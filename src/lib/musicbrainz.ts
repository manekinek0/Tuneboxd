import "server-only";
import { cache } from "react";
import { getSql } from "./db";

const API = "https://musicbrainz.org/ws/2";
// MusicBrainz requires an identifying User-Agent.
const USER_AGENT = "Tuneboxd/0.2 ( https://github.com/manekinek0/Tuneboxd )";

type ArtistCredit = { name: string; joinphrase?: string }[];

export type ReleaseGroupSummary = {
  mbid: string;
  title: string;
  artist: string;
  primaryType: string | null;
  secondaryTypes: string[];
  releaseDate: string | null;
};

type MbReleaseGroup = {
  id: string;
  title: string;
  "primary-type"?: string | null;
  "secondary-types"?: string[];
  "first-release-date"?: string;
  "artist-credit"?: ArtistCredit;
  releases?: { id: string; status?: string; date?: string }[];
};

type MbRelease = {
  media?: {
    position: number;
    tracks?: { position: number; title: string; length?: number | null }[];
  }[];
};

export function coverUrl(mbid: string, size: 250 | 500 | 1200 = 250) {
  return `https://coverartarchive.org/release-group/${mbid}/front-${size}`;
}

function creditToString(credit: ArtistCredit | undefined) {
  return (credit ?? []).map((c) => c.name + (c.joinphrase ?? "")).join("") || "Неизвестный артист";
}

function summarize(rg: MbReleaseGroup): ReleaseGroupSummary {
  return {
    mbid: rg.id,
    title: rg.title,
    artist: creditToString(rg["artist-credit"]),
    primaryType: rg["primary-type"] ?? null,
    secondaryTypes: rg["secondary-types"] ?? [],
    releaseDate: rg["first-release-date"] || null,
  };
}

async function mb<T>(path: string, revalidate = 3600): Promise<T> {
  for (let attempt = 0; ; attempt++) {
    const res = await fetch(`${API}${path}`, {
      headers: { "User-Agent": USER_AGENT, Accept: "application/json" },
      next: { revalidate },
      signal: AbortSignal.timeout(8000),
    });
    // 503 usually means the 1 request/second rate limit was hit.
    if (res.status === 503 && attempt < 2) {
      await new Promise((r) => setTimeout(r, 1100));
      continue;
    }
    if (!res.ok) throw new Error(`MusicBrainz ${res.status} for ${path}`);
    return res.json() as Promise<T>;
  }
}

export async function searchReleaseGroups(query: string): Promise<ReleaseGroupSummary[]> {
  const data = await mb<{ "release-groups": MbReleaseGroup[] }>(
    `/release-group?query=${encodeURIComponent(query)}&limit=24&fmt=json`,
  );
  return (data["release-groups"] ?? []).map(summarize);
}

function escapeLucene(value: string) {
  return value.replace(/([+\-&|!(){}[\]^"~*?:\\/])/g, "\\$1");
}

/** Best-effort match for a Last.fm album that has no MusicBrainz id. */
export async function searchBestReleaseGroup(artist: string, album: string): Promise<string | null> {
  const query = `release:${escapeLucene(album)} AND artist:${escapeLucene(artist)}`;
  try {
    const data = await mb<{ "release-groups": MbReleaseGroup[] }>(
      `/release-group?query=${encodeURIComponent(query)}&limit=5&fmt=json`,
    );
    const groups = data["release-groups"] ?? [];
    const normalizedAlbum = album.trim().toLowerCase();
    const exact = groups.find((g) => g.title.trim().toLowerCase() === normalizedAlbum);
    return (exact ?? groups[0])?.id ?? null;
  } catch {
    return null;
  }
}

/** Last.fm album ids are release ids, while the app stores release groups. */
export async function releaseGroupFromRelease(releaseMbid: string): Promise<string | null> {
  try {
    const data = await mb<{ "release-group"?: { id: string } }>(
      `/release/${releaseMbid}?inc=release-groups&fmt=json`,
    );
    return data["release-group"]?.id ?? null;
  } catch {
    return null;
  }
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Returns the local release id for a MusicBrainz release group, importing it
 * (metadata + tracklist of the earliest official release) on first access.
 */
export const ensureRelease = cache(async (mbid: string): Promise<string | null> => {
  if (!UUID.test(mbid)) return null;
  const sql = getSql();

  const existing = (await sql`
    select id from public.releases where mbid = ${mbid}
  `) as { id: string }[];
  if (existing[0]) return existing[0].id;

  let rg: MbReleaseGroup;
  try {
    rg = await mb<MbReleaseGroup>(`/release-group/${mbid}?inc=artist-credits+releases&fmt=json`);
  } catch {
    return null;
  }
  const summary = summarize(rg);

  const candidates = [...(rg.releases ?? [])].sort((a, b) => {
    const official = Number(b.status === "Official") - Number(a.status === "Official");
    return official || (a.date || "9999").localeCompare(b.date || "9999");
  });

  let tracks: { disc: number; position: number; title: string; length_ms: number | null }[] = [];
  if (candidates[0]) {
    try {
      const release = await mb<MbRelease>(`/release/${candidates[0].id}?inc=recordings&fmt=json`, 86400);
      tracks = (release.media ?? []).flatMap((m) =>
        (m.tracks ?? []).map((t) => ({
          disc: m.position,
          position: t.position,
          title: t.title,
          length_ms: t.length ?? null,
        })),
      );
    } catch {
      tracks = [];
    }
  }

  const inserted = (await sql`
    insert into public.releases (mbid, title, artist, primary_type, secondary_types, release_date)
    values (
      ${mbid},
      ${summary.title},
      ${summary.artist},
      ${summary.primaryType},
      ${JSON.stringify(summary.secondaryTypes)}::jsonb,
      ${summary.releaseDate}
    )
    on conflict (mbid) do nothing
    returning id
  `) as { id: string }[];

  // A concurrent request imported it first.
  if (!inserted[0]) {
    const again = (await sql`
      select id from public.releases where mbid = ${mbid}
    `) as { id: string }[];
    return again[0]?.id ?? null;
  }

  const id = inserted[0].id;
  if (tracks.length) {
    await sql`
      insert into public.tracks (release_id, disc, position, title, length_ms)
      select ${id}, (t->>'disc')::smallint, (t->>'position')::smallint, t->>'title',
             nullif(t->>'length_ms', '')::int
      from jsonb_array_elements(${JSON.stringify(tracks)}::jsonb) t
    `;
  }
  return id;
});
