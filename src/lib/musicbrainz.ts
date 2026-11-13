import "server-only";
import { cache } from "react";
import { createAdminClient } from "@/lib/supabase/server";

const API = "https://musicbrainz.org/ws/2";
// MusicBrainz requires an identifying User-Agent.
const USER_AGENT = "Tuneboxd/0.1 ( https://github.com/manekinek0/Tuneboxd )";

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
    });
    // 503 means the 1 request/second rate limit was hit.
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
  return data["release-groups"].map(summarize);
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Returns the local release id for a MusicBrainz release group, importing it
 * (metadata + tracklist of the earliest official release) on first access.
 */
export const ensureRelease = cache(async (mbid: string): Promise<string | null> => {
  if (!UUID.test(mbid)) return null;
  const admin = createAdminClient();

  const existing = await admin.from("releases").select("id").eq("mbid", mbid).maybeSingle();
  if (existing.data) return existing.data.id;

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
    const release = await mb<MbRelease>(`/release/${candidates[0].id}?inc=recordings&fmt=json`, 86400);
    tracks = (release.media ?? []).flatMap((m) =>
      (m.tracks ?? []).map((t) => ({
        disc: m.position,
        position: t.position,
        title: t.title,
        length_ms: t.length ?? null,
      })),
    );
  }

  const { data: inserted, error } = await admin
    .from("releases")
    .upsert(
      {
        mbid,
        title: summary.title,
        artist: summary.artist,
        primary_type: summary.primaryType,
        secondary_types: summary.secondaryTypes,
        release_date: summary.releaseDate,
      },
      { onConflict: "mbid", ignoreDuplicates: true },
    )
    .select("id")
    .maybeSingle();
  if (error) throw error;

  // A concurrent request imported it first.
  if (!inserted) {
    const again = await admin.from("releases").select("id").eq("mbid", mbid).single();
    return again.data?.id ?? null;
  }

  if (tracks.length) {
    const { error: tracksError } = await admin
      .from("tracks")
      .insert(tracks.map((t) => ({ ...t, release_id: inserted.id })));
    if (tracksError) throw tracksError;
  }
  return inserted.id;
});

const TYPE_LABELS: Record<string, string> = {
  Album: "Альбом",
  EP: "EP",
  Single: "Сингл",
  Broadcast: "Эфир",
  Other: "Другое",
  Mixtape: "Микстейп",
  "Mixtape/Street": "Микстейп",
  Compilation: "Сборник",
  Live: "Концерт",
  Soundtrack: "Саундтрек",
  Remix: "Ремиксы",
};

export function typeLabel(primary: string | null, secondary: string[] = []) {
  const parts = [primary, ...secondary].filter(Boolean) as string[];
  return parts.map((p) => TYPE_LABELS[p] ?? p).join(" · ") || "Релиз";
}
