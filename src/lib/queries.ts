import "server-only";
import { getSql } from "./db";
import type {
  DiaryStats,
  ListenState,
  ListenWithRelease,
  RatingRow,
  RatingWithRelease,
  ReleaseRow,
  ReleaseStats,
  SettingsMap,
  TopCandidate,
  TopEntry,
  TrackRow,
} from "./types";

type Row = Record<string, unknown>;

function toRelease(row: Row): ReleaseRow {
  let secondary: string[] = [];
  const raw = row.secondary_types;
  if (Array.isArray(raw)) secondary = raw.map(String);
  else if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) secondary = parsed.map(String);
    } catch {
      secondary = [];
    }
  }
  return {
    id: String(row.id),
    mbid: String(row.mbid),
    title: String(row.title),
    artist: String(row.artist),
    primary_type: (row.primary_type as string | null) ?? null,
    secondary_types: secondary,
    release_date: (row.release_date as string | null) ?? null,
    pitchfork_score: num(row.pitchfork_score),
    pitchfork_url: (row.pitchfork_url as string | null) ?? null,
  };
}

function toRating(row: Row): RatingRow {
  return {
    release_id: String(row.release_id),
    rhymes: Number(row.rhymes),
    structure: Number(row.structure),
    style: Number(row.style),
    individuality: Number(row.individuality),
    vibe: Number(row.vibe),
    score: Number(row.score),
    review: (row.review as string | null) ?? null,
    created_at: String(row.created_at ?? ""),
    updated_at: String(row.updated_at ?? ""),
  };
}

function toRatingWithRelease(row: Row): RatingWithRelease {
  return {
    ...toRating(row),
    ...toRelease(row),
  };
}

function num(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

export async function getReleaseByMbid(mbid: string): Promise<ReleaseRow | null> {
  const rows = (await getSql()`
    select id, mbid, title, artist, primary_type, secondary_types, release_date,
           pitchfork_score, pitchfork_url
    from public.releases
    where mbid = ${mbid}
  `) as Row[];
  return rows[0] ? toRelease(rows[0]) : null;
}

export async function getReleaseById(id: string): Promise<ReleaseRow | null> {
  const rows = (await getSql()`
    select id, mbid, title, artist, primary_type, secondary_types, release_date,
           pitchfork_score, pitchfork_url
    from public.releases
    where id = ${id}
  `) as Row[];
  return rows[0] ? toRelease(rows[0]) : null;
}

export async function getTracks(releaseId: string): Promise<TrackRow[]> {
  return (await getSql()`
    select id, release_id, disc, position, title, length_ms
    from public.tracks
    where release_id = ${releaseId}
    order by disc, position
  `) as unknown as TrackRow[];
}

export async function getReleaseStats(releaseId: string): Promise<ReleaseStats | null> {
  const rows = (await getSql()`
    select ratings_count, avg_score, avg_rhymes, avg_structure, avg_style, avg_individuality, avg_vibe
    from public.release_stats
    where release_id = ${releaseId}
  `) as Row[];
  const row = rows[0];
  if (!row) return null;
  return {
    ratings_count: Number(row.ratings_count),
    avg_score: num(row.avg_score),
    avg_rhymes: num(row.avg_rhymes),
    avg_structure: num(row.avg_structure),
    avg_style: num(row.avg_style),
    avg_individuality: num(row.avg_individuality),
    avg_vibe: num(row.avg_vibe),
  };
}

export async function getRating(releaseId: string): Promise<RatingRow | null> {
  const rows = (await getSql()`
    select release_id, rhymes, structure, style, individuality, vibe, score, review,
           created_at::text as created_at, updated_at::text as updated_at
    from public.ratings
    where release_id = ${releaseId}
  `) as Row[];
  return rows[0] ? toRating(rows[0]) : null;
}

export async function getListenState(releaseId: string): Promise<ListenState> {
  const rows = (await getSql()`
    select listened_at::text as listened_at, source
    from public.listens
    where release_id = ${releaseId}
  `) as Row[];
  if (!rows[0]) return { listened: false, listened_at: null, source: null };
  return {
    listened: true,
    listened_at: String(rows[0].listened_at),
    source: rows[0].source as "manual" | "lastfm",
  };
}

export async function getFavouriteTrackIds(releaseId: string): Promise<string[]> {
  const rows = (await getSql()`
    select track_id from public.favourite_tracks where release_id = ${releaseId}
  `) as Row[];
  return rows.map((r) => String(r.track_id));
}

export async function getTopIds(): Promise<string[]> {
  const rows = (await getSql()`
    select release_id from public.top_releases order by position
  `) as Row[];
  return rows.map((r) => String(r.release_id));
}

export async function getTopReleases(): Promise<TopEntry[]> {
  const rows = (await getSql()`
    select t.position, rel.id, rel.mbid, rel.title, rel.artist, rel.primary_type,
           rel.secondary_types, rel.release_date, rel.pitchfork_score, rel.pitchfork_url, r.score
    from public.top_releases t
    join public.releases rel on rel.id = t.release_id
    left join public.ratings r on r.release_id = rel.id
    order by t.position
  `) as Row[];
  return rows.map((row) => ({
    position: Number(row.position),
    release: toRelease(row),
    score: num(row.score),
  }));
}

export async function getRecentRatings(limit = 10): Promise<RatingWithRelease[]> {
  const rows = (await getSql()`
    select r.release_id, r.rhymes, r.structure, r.style, r.individuality, r.vibe, r.score, r.review,
           r.created_at::text as created_at, r.updated_at::text as updated_at,
           rel.mbid, rel.title, rel.artist, rel.primary_type, rel.secondary_types, rel.release_date,
           rel.pitchfork_score, rel.pitchfork_url
    from public.ratings r
    join public.releases rel on rel.id = r.release_id
    order by r.updated_at desc
    limit ${limit}
  `) as Row[];
  return rows.map(toRatingWithRelease);
}

export async function getBestRated(limit = 10): Promise<RatingWithRelease[]> {
  const rows = (await getSql()`
    select r.release_id, r.rhymes, r.structure, r.style, r.individuality, r.vibe, r.score, r.review,
           r.created_at::text as created_at, r.updated_at::text as updated_at,
           rel.mbid, rel.title, rel.artist, rel.primary_type, rel.secondary_types, rel.release_date,
           rel.pitchfork_score, rel.pitchfork_url
    from public.ratings r
    join public.releases rel on rel.id = r.release_id
    order by r.score desc, r.updated_at desc
    limit ${limit}
  `) as Row[];
  return rows.map(toRatingWithRelease);
}

export async function getAllRatings(): Promise<RatingWithRelease[]> {
  const rows = (await getSql()`
    select r.release_id, r.rhymes, r.structure, r.style, r.individuality, r.vibe, r.score, r.review,
           r.created_at::text as created_at, r.updated_at::text as updated_at,
           rel.mbid, rel.title, rel.artist, rel.primary_type, rel.secondary_types, rel.release_date,
           rel.pitchfork_score, rel.pitchfork_url
    from public.ratings r
    join public.releases rel on rel.id = r.release_id
    order by r.score desc, rel.title asc
  `) as Row[];
  return rows.map(toRatingWithRelease);
}

export async function getUnratedListens(limit = 12): Promise<ListenWithRelease[]> {
  const rows = (await getSql()`
    select l.release_id, l.listened_at::text as listened_at, l.source,
           rel.mbid, rel.title, rel.artist, rel.primary_type, rel.secondary_types, rel.release_date,
           rel.pitchfork_score, rel.pitchfork_url
    from public.listens l
    join public.releases rel on rel.id = l.release_id
    left join public.ratings r on r.release_id = l.release_id
    where r.release_id is null
    order by l.listened_at desc
    limit ${limit}
  `) as Row[];
  return rows.map((row) => ({
    release_id: String(row.release_id),
    listened_at: String(row.listened_at),
    source: row.source as "manual" | "lastfm",
    ...toRelease(row),
  }));
}

export async function getDiaryStats(): Promise<DiaryStats> {
  const rows = (await getSql()`
    select
      (select count(*) from public.ratings)::int as ratings_count,
      (select count(*) from public.listens)::int as listens_count,
      (select count(*) from public.favourite_tracks)::int as favourites_count,
      (select round(avg(score), 1) from public.ratings) as avg_score,
      (select round(avg(rhymes), 1) from public.ratings) as avg_rhymes,
      (select round(avg(structure), 1) from public.ratings) as avg_structure,
      (select round(avg(style), 1) from public.ratings) as avg_style,
      (select round(avg(individuality), 1) from public.ratings) as avg_individuality,
      (select round(avg(vibe), 1) from public.ratings) as avg_vibe
  `) as Row[];
  const row = rows[0];
  return {
    ratings_count: Number(row.ratings_count),
    listens_count: Number(row.listens_count),
    favourites_count: Number(row.favourites_count),
    avg_score: num(row.avg_score),
    avg_rhymes: num(row.avg_rhymes),
    avg_structure: num(row.avg_structure),
    avg_style: num(row.avg_style),
    avg_individuality: num(row.avg_individuality),
    avg_vibe: num(row.avg_vibe),
  };
}

export async function getTopCandidates(limit = 2000): Promise<TopCandidate[]> {
  const rows = (await getSql()`
    select rel.id, rel.mbid, rel.title, rel.artist, rel.primary_type, rel.secondary_types,
           rel.release_date, rel.pitchfork_score, rel.pitchfork_url, r.score,
           l.listened_at::text as listened_at
    from public.listens l
    join public.releases rel on rel.id = l.release_id
    left join public.ratings r on r.release_id = rel.id
    order by r.score desc nulls last, l.listened_at desc
    limit ${limit}
  `) as Row[];
  return rows.map((row) => ({
    ...toRelease(row),
    score: num(row.score),
    listened_at: String(row.listened_at),
  }));
}

export async function getSettings(): Promise<SettingsMap> {
  const rows = (await getSql()`
    select key, value #>> '{}' as value from public.settings
  `) as Row[];
  return Object.fromEntries(rows.map((r) => [String(r.key), String(r.value ?? "")]));
}

export async function setSetting(key: string, value: string): Promise<void> {
  await getSql()`
    insert into public.settings (key, value)
    values (${key}, ${JSON.stringify(value)}::jsonb)
    on conflict (key) do update set value = excluded.value, updated_at = now()
  `;
}

export async function deleteSetting(key: string): Promise<void> {
  await getSql()`delete from public.settings where key = ${key}`;
}

export async function updateListenedAt(releaseId: string, listenedAt: string): Promise<void> {
  await getSql()`
    update public.listens
    set listened_at = greatest(listened_at, ${listenedAt}::timestamptz)
    where release_id = ${releaseId}
  `;
}

export type ExportData = {
  exported_at: string;
  releases: Row[];
  tracks: Row[];
  listens: Row[];
  ratings: Row[];
  favourite_tracks: Row[];
  top_releases: Row[];
};

export async function getExportData(): Promise<ExportData> {
  const sql = getSql();
  const [releases, tracks, listens, ratings, favourite_tracks, top_releases] = await Promise.all([
    sql`select * from public.releases order by created_at`,
    sql`select * from public.tracks order by release_id, disc, position`,
    sql`select * from public.listens order by listened_at`,
    sql`select * from public.ratings order by created_at`,
    sql`select * from public.favourite_tracks order by created_at`,
    sql`select * from public.top_releases order by position`,
  ]);
  return {
    exported_at: new Date().toISOString(),
    releases: releases as Row[],
    tracks: tracks as Row[],
    listens: listens as Row[],
    ratings: ratings as Row[],
    favourite_tracks: favourite_tracks as Row[],
    top_releases: top_releases as Row[],
  };
}
