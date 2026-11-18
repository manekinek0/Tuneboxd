import "server-only";
import type { ReleaseGroupSummary } from "./musicbrainz";
import { artistSimilarity, canonicalTitle, normalizeText } from "./text";

const API = "https://api.deezer.com";
const USER_AGENT = "Tuneboxd/0.3 ( https://github.com/manekinek0/Tuneboxd )";
const CACHE_SECONDS = 24 * 60 * 60;

export type RankedReleaseGroup = ReleaseGroupSummary & {
  /** Deezer album fans; null when the album is not in Deezer or the lookup failed. */
  popularity: number | null;
};

type DeezerAlbum = {
  id: number;
  title: string;
  artist?: { name?: string };
};

type DeezerSearch = {
  data?: DeezerAlbum[];
};

type DeezerAlbumDetails = {
  fans?: number;
};

async function getJson<T>(url: string, timeoutMs = 3500): Promise<T> {
  const response = await fetch(url, {
    headers: { "user-agent": USER_AGENT, accept: "application/json" },
    next: { revalidate: CACHE_SECONDS },
    signal: AbortSignal.timeout(timeoutMs),
  });
  if (!response.ok) throw new Error(`Deezer ответил ${response.status}`);
  return response.json() as Promise<T>;
}

function albumKey(artist: string, title: string): string {
  return `${normalizeText(artist)}|${canonicalTitle(title)}`;
}

/** Matches MusicBrainz release groups to the albums returned by one Deezer search. */
function matchAlbums(
  results: ReleaseGroupSummary[],
  albums: DeezerAlbum[],
): Map<string, DeezerAlbum> {
  const byKey = new Map<string, DeezerAlbum>();
  const byTitle = new Map<string, DeezerAlbum[]>();

  for (const album of albums) {
    const artist = album.artist?.name?.trim();
    if (!artist) continue;

    const key = albumKey(artist, album.title);
    if (!byKey.has(key)) byKey.set(key, album);

    const title = canonicalTitle(album.title);
    const list = byTitle.get(title);
    if (list) list.push(album);
    else byTitle.set(title, [album]);
  }

  const matches = new Map<string, DeezerAlbum>();
  for (const result of results) {
    const exact = byKey.get(albumKey(result.artist, result.title));
    if (exact) {
      matches.set(result.mbid, exact);
      continue;
    }

    const candidates = byTitle.get(canonicalTitle(result.title)) ?? [];
    let best: DeezerAlbum | null = null;
    let bestScore = 0;
    for (const candidate of candidates) {
      const score = artistSimilarity(result.artist, candidate.artist?.name ?? "");
      if (score > bestScore) {
        best = candidate;
        bestScore = score;
      }
    }
    if (best && bestScore >= 0.85) matches.set(result.mbid, best);
  }

  return matches;
}

/** Deezer exposes album fans in the detail endpoint, not in search results. */
async function fetchFans(ids: number[]): Promise<Map<number, number>> {
  const fans = new Map<number, number>();
  const queue = [...new Set(ids)];
  if (!queue.length) return fans;

  const deadline = Date.now() + 6000;
  async function worker() {
    while (Date.now() < deadline) {
      const id = queue.shift();
      if (id === undefined) return;
      try {
        const album = await getJson<DeezerAlbumDetails>(`${API}/album/${id}`, 2500);
        if (typeof album.fans === "number") fans.set(id, album.fans);
      } catch {
        // A missing album just means unknown popularity.
      }
    }
  }

  await Promise.all(Array.from({ length: Math.min(8, queue.length) }, worker));
  return fans;
}

/**
 * Orders MusicBrainz results by Deezer album popularity. If Deezer is
 * unreachable, the original relevance order from MusicBrainz is preserved.
 */
export async function rankByPopularity(
  query: string,
  results: ReleaseGroupSummary[],
): Promise<RankedReleaseGroup[]> {
  const fallback = () =>
    results
      .map((result) => ({ ...result, popularity: null }))
      .sort((a, b) => b.relevance - a.relevance || a.title.localeCompare(b.title, "ru"));

  if (!results.length) return [];

  let albums: DeezerAlbum[];
  try {
    const data = await getJson<DeezerSearch>(
      `${API}/search/album?q=${encodeURIComponent(query)}&limit=100`,
    );
    albums = data.data ?? [];
  } catch {
    return fallback();
  }
  if (!albums.length) return fallback();

  const matches = matchAlbums(results, albums);
  const fans = await fetchFans([...matches.values()].map((album) => album.id));

  const ranked = results.map((result) => {
    const album = matches.get(result.mbid);
    return {
      ...result,
      popularity: album ? (fans.get(album.id) ?? null) : null,
    };
  });

  if (!ranked.some((result) => result.popularity != null)) return fallback();

  return ranked.sort(
    (a, b) =>
      (b.popularity ?? -1) - (a.popularity ?? -1) ||
      b.relevance - a.relevance ||
      a.title.localeCompare(b.title, "ru"),
  );
}
