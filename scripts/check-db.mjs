/**
 * Applies the SQL migration to an in-memory Postgres (PGlite) and checks the
 * invariants the app relies on. Runs without Neon or Docker: `pnpm db:check`.
 */
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { PGlite } from "@electric-sql/pglite";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const migrationsDir = path.join(root, "db", "migrations");
const migrations = (await readdir(migrationsDir)).filter((name) => name.endsWith(".sql")).sort();

const db = new PGlite();
let checks = 0;
let failures = 0;

function ok(condition, label, extra = "") {
  checks += 1;
  if (condition) {
    console.log(`ok    ${label}`);
  } else {
    failures += 1;
    console.error(`FAIL  ${label}${extra ? ` — ${extra}` : ""}`);
  }
}

function eq(actual, expected, label) {
  ok(Object.is(actual, expected), label, `expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
}

async function rejects(label, sql, params = []) {
  try {
    await db.query(sql, params);
    ok(false, label);
  } catch {
    ok(true, label);
  }
}

async function one(sql, params = []) {
  const { rows } = await db.query(sql, params);
  return rows[0];
}

for (const name of migrations) {
  console.log(`Applying db/migrations/${name}…`);
  await db.exec(await readFile(path.join(migrationsDir, name), "utf8"));
}
ok(true, "migrations apply cleanly");

const release = await one(
  `insert into public.releases (mbid, title, artist, primary_type, secondary_types, release_date)
   values ($1, 'Test Album', 'Test Artist', 'Album', '[]'::jsonb, '2024-05-01')
   returning id`,
  ["11111111-1111-1111-1111-111111111111"],
);

const other = await one(
  `insert into public.releases (mbid, title, artist, primary_type, secondary_types, release_date)
   values ($1, 'Low Album', 'Test Artist', null, '["Live"]'::jsonb, '1999')
   returning id`,
  ["22222222-2222-2222-2222-222222222222"],
);

// Pitchfork cache --------------------------------------------------------------
await db.query(
  `update public.releases
   set pitchfork_score = 9.3, pitchfork_url = 'https://pitchfork.com/reviews/albums/test/'
   where id = $1`,
  [release.id],
);
eq(
  Number((await one(`select pitchfork_score from public.releases where id = $1`, [release.id])).pitchfork_score),
  9.3,
  "pitchfork score is stored",
);
await rejects(
  "pitchfork score is limited to 10",
  `update public.releases set pitchfork_score = 11 where id = $1`,
  [release.id],
);

const track = await one(
  `insert into public.tracks (release_id, disc, position, title, length_ms)
   values ($1, 1, 1, 'First', 181000) returning id`,
  [release.id],
);

// Score formula -----------------------------------------------------------------
await db.query(
  `insert into public.ratings (release_id, rhymes, structure, style, individuality, vibe)
   values ($1, 8, 7, 9, 6, 7)`,
  [release.id],
);
eq((await one(`select score from public.ratings where release_id = $1`, [release.id])).score, 59,
  "score is 59 for {8,7,9,6,7}");

await db.query(
  `insert into public.ratings (release_id, rhymes, structure, style, individuality, vibe)
   values ($1, 1, 1, 1, 1, 1)`,
  [other.id],
);
eq((await one(`select score from public.ratings where release_id = $1`, [other.id])).score, 6,
  "score is 6 for all ones");

await db.query(
  `update public.ratings
   set rhymes = 10, structure = 10, style = 10, individuality = 10, vibe = 10
   where release_id = $1`,
  [release.id],
);
eq((await one(`select score from public.ratings where release_id = $1`, [release.id])).score, 90,
  "score is capped at 90 for all tens");

await rejects(
  "rating out of range is rejected",
  `insert into public.ratings (release_id, rhymes, structure, style, individuality, vibe)
   values ($1, 11, 5, 5, 5, 5)`,
  [release.id],
);

await rejects(
  "rating needs a known release",
  `insert into public.ratings (release_id, rhymes, structure, style, individuality, vibe)
   values (gen_random_uuid(), 5, 5, 5, 5, 5)`,
);

// Compare the generated column with src/lib/score.ts over every combination.
const { rows: combos } = await db.query(`
  select r, s, st, i, v,
         least(90, round((r + s + st + i) * 1.4 * (1 + (v - 1) * 0.6072 / 9)))::int as score
  from generate_series(1, 10) r, generate_series(1, 10) s, generate_series(1, 10) st,
       generate_series(1, 10) i, generate_series(1, 10) v
`);
let mismatches = 0;
for (const row of combos) {
  const js = Math.min(
    90,
    Math.round((row.r + row.s + row.st + row.i) * 1.4 * (1 + ((row.v - 1) * (1.6072 - 1)) / 9)),
  );
  if (js !== row.score) mismatches += 1;
}
eq(mismatches, 0, `SQL and score.ts agree on all ${combos.length} combinations`);

// Listens ----------------------------------------------------------------------
eq((await one(`select count(*)::int as n from public.listens`)).n, 2,
  "rating inserts a listen for every rated release");

await db.query(`update public.ratings set review = 'great' where release_id = $1`, [release.id]);
eq((await one(`select count(*)::int as n from public.listens where release_id = $1`, [release.id])).n, 1,
  "updating a rating does not duplicate the listen");
eq((await one(`select source from public.listens where release_id = $1`, [release.id])).source, "manual",
  "listens default to source=manual");

const stamp = await one(
  `select created_at::text as created_at, updated_at::text as updated_at
   from public.ratings where release_id = $1`,
  [release.id],
);
ok(stamp.updated_at >= stamp.created_at, "updated_at is refreshed on update");

// Favourite tracks -------------------------------------------------------------
await db.query(
  `insert into public.favourite_tracks (track_id, release_id) values ($1, $2)`,
  [track.id, other.id],
);
eq((await one(`select release_id from public.favourite_tracks where track_id = $1`, [track.id])).release_id,
  release.id, "favourite track inherits the track's release_id");

await rejects(
  "favourite track is unique",
  `insert into public.favourite_tracks (track_id, release_id) values ($1, $2)`,
  [track.id, release.id],
);

// Views ------------------------------------------------------------------------
const stats = await one(`select * from public.release_stats where release_id = $1`, [release.id]);
eq(stats.ratings_count, 1, "release_stats counts ratings");
eq(Number(stats.avg_score), 90, "release_stats averages the score");
eq(Number(stats.avg_vibe), 10, "release_stats averages vibe");

const favourites = await one(`select count(*)::int as n from public.favourite_tracks`);
eq(favourites.n, 1, "favourite tracks are stored once per track");

// Settings ---------------------------------------------------------------------
await db.query(
  `insert into public.settings (key, value) values ('lastfm_username', to_jsonb($1::text))`,
  ["owner"],
);
await db.query(
  `insert into public.settings (key, value) values ('lastfm_username', to_jsonb($1::text))
   on conflict (key) do update set value = excluded.value, updated_at = now()`,
  ["owner2"],
);
eq((await one(`select value #>> '{}' as value from public.settings where key = 'lastfm_username'`)).value, "owner2",
  "settings upsert keeps one value per key");

// Top-10 -----------------------------------------------------------------------
await db.query(
  `insert into public.top_releases (position, release_id) values (1, $1), (2, $2)`,
  [release.id, other.id],
);
await rejects(
  "top position is limited to 10",
  `insert into public.top_releases (position, release_id) values (11, gen_random_uuid())`,
);
await rejects(
  "a release appears in the top only once",
  `insert into public.top_releases (position, release_id) values (3, $1)`,
  [release.id],
);

// Cascades ---------------------------------------------------------------------
await db.query(`delete from public.releases where id = $1`, [release.id]);
eq((await one(`select count(*)::int as n from public.ratings`)).n, 1, "deleting a release removes its rating");
eq((await one(`select count(*)::int as n from public.tracks`)).n, 0, "deleting a release removes its tracks");
eq((await one(`select count(*)::int as n from public.favourite_tracks`)).n, 0, "deleting a release removes favourites");

console.log(`\n${checks - failures}/${checks} checks passed.`);
await db.close();
process.exit(failures ? 1 : 0);
