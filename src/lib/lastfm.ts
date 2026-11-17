import "server-only";
import { getSql } from "./db";
import { ensureRelease, releaseGroupFromRelease, searchBestReleaseGroup } from "./musicbrainz";
import { getSettings, setSetting } from "./queries";
import type { SyncResult } from "./types";

const API = "https://ws.audioscrobbler.com/2.0/";

type LastfmTrack = {
  name?: string;
  mbid?: string;
  artist?: { "#text"?: string; mbid?: string } | string;
  album?: { "#text"?: string; mbid?: string };
  date?: { uts?: string; "#text"?: string };
  "@attr"?: { nowplaying?: string };
};

type AlbumGroup = {
  artist: string;
  album: string;
  albumMbid: string | null;
  lastUts: number;
  plays: number;
};

async function call<T>(params: Record<string, string>): Promise<T> {
  const url = new URL(API);
  for (const [key, value] of Object.entries({ ...params, format: "json" })) {
    url.searchParams.set(key, value);
  }
  const res = await fetch(url, { cache: "no-store" });
  const data = (await res.json()) as T & { error?: number; message?: string };
  if (!res.ok || data.error) throw new Error(data.message || `Last.fm ответил ${res.status}`);
  return data;
}

function artistName(track: LastfmTrack): string {
  if (typeof track.artist === "string") return track.artist;
  return track.artist?.["#text"] ?? "";
}

function normalizeTracks(value: LastfmTrack | LastfmTrack[] | undefined): LastfmTrack[] {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

/** Validates the API key + username pair. Throws a readable error otherwise. */
export async function validateLastfm(apiKey: string, username: string): Promise<string> {
  const data = await call<{ user?: { name?: string } }>({
    method: "user.getinfo",
    user: username,
    api_key: apiKey,
  });
  if (!data.user?.name) throw new Error("Пользователь Last.fm не найден");
  return data.user.name;
}

async function recentTracks(apiKey: string, username: string, fromUnix: number): Promise<LastfmTrack[]> {
  const tracks: LastfmTrack[] = [];
  // A day of listening rarely needs more than two pages of 200 scrobbles.
  for (let page = 1; page <= 2; page++) {
    const data = await call<{ recenttracks?: { track?: LastfmTrack | LastfmTrack[] } }>({
      method: "user.getrecenttracks",
      user: username,
      api_key: apiKey,
      from: String(fromUnix),
      limit: "200",
      extended: "1",
      page: String(page),
    });
    const list = normalizeTracks(data.recenttracks?.track);
    tracks.push(...list);
    if (list.length < 200) break;
  }
  return tracks;
}

function groupAlbums(tracks: LastfmTrack[]): AlbumGroup[] {
  const groups = new Map<string, AlbumGroup>();
  for (const track of tracks) {
    if (track["@attr"]?.nowplaying === "true") continue;
    const uts = Number(track.date?.uts);
    if (!Number.isFinite(uts)) continue;

    const artist = artistName(track).trim();
    const album = track.album?.["#text"]?.trim() ?? "";
    if (!artist || !album) continue; // singles and unmatched scrobbles are skipped

    const albumMbid = track.album?.mbid?.trim() || null;
    const key = albumMbid ? `mbid:${albumMbid}` : `${artist.toLowerCase()}|${album.toLowerCase()}`;
    const existing = groups.get(key);
    if (existing) {
      existing.lastUts = Math.max(existing.lastUts, uts);
      existing.plays += 1;
    } else {
      groups.set(key, { artist, album, albumMbid, lastUts: uts, plays: 1 });
    }
  }
  return [...groups.values()].sort((a, b) => b.lastUts - a.lastUts);
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Pulls recent scrobbles, turns albums into MusicBrainz releases and stores
 * them as listens without ratings, ready to be rated in the diary.
 */
export async function syncLastfm(periodDays: number, maxAlbums = 8): Promise<SyncResult> {
  const settings = await getSettings();
  const apiKey = settings.lastfm_api_key?.trim();
  const username = settings.lastfm_username?.trim();

  if (!apiKey || !username) {
    return { ok: false, message: "Сначала укажите username и API-ключ Last.fm в настройках." };
  }

  try {
    const from = Math.floor(Date.now() / 1000) - Math.max(1, periodDays) * 86400;
    const tracks = await recentTracks(apiKey, username, from);
    const groups = groupAlbums(tracks);

    if (!groups.length) {
      await setSetting("lastfm_last_sync", new Date().toISOString());
      return { ok: true, message: "Новых альбомов за этот период нет.", scanned: tracks.length, albums: 0, added: 0 };
    }

    const batch = groups.slice(0, maxAlbums);
    let added = 0;
    let known = 0;
    let skipped = 0;

    for (const group of batch) {
      let releaseGroup = group.albumMbid ? await releaseGroupFromRelease(group.albumMbid) : null;
      if (!releaseGroup) releaseGroup = await searchBestReleaseGroup(group.artist, group.album);

      const releaseId = releaseGroup ? await ensureRelease(releaseGroup) : null;
      if (!releaseId) {
        skipped += 1;
        await sleep(1050);
        continue;
      }

      const rows = (await getSql()`
        insert into public.listens as l (release_id, listened_at, source)
        values (${releaseId}, to_timestamp(${group.lastUts}), 'lastfm')
        on conflict (release_id) do update
          set listened_at = greatest(l.listened_at, excluded.listened_at)
        returning (xmax = 0) as inserted
      `) as { inserted: boolean }[];

      if (rows[0]?.inserted) added += 1;
      else known += 1;

      await sleep(1050);
    }

    await setSetting("lastfm_last_sync", new Date().toISOString());
    const remaining = Math.max(0, groups.length - batch.length);

    return {
      ok: true,
      message:
        `Найдено ${groups.length} альбомов в ${tracks.length} скробблах. ` +
        `Добавлено ${added}, уже было ${known}` +
        (skipped ? `, не удалось сопоставить ${skipped}` : "") +
        (remaining ? `. Осталось ${remaining} — нажмите синхронизацию ещё раз.` : "."),
      scanned: tracks.length,
      albums: groups.length,
      added,
      known,
      skipped,
      remaining,
    };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Не удалось синхронизировать Last.fm.",
    };
  }
}
