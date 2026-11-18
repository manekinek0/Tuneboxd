import "server-only";
import { cache } from "react";
import { getSql } from "./db";
import { toDate } from "./format";
import {
  parsePitchforkScore,
  parsePitchforkSearchResults,
  pickPitchforkResult,
} from "./pitchfork-parse";

const BASE = "https://pitchfork.com";
const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0 Safari/537.36";
const CACHE_MS = 30 * 24 * 60 * 60 * 1000;
const REQUEST_TIMEOUT_MS = 5000;
const LOOKUP_BUDGET_MS = 9000;

export type PitchforkRating =
  | { status: "found"; score: number; url: string | null }
  | { status: "none" }
  | { status: "error" };

type ReleasePitchforkRow = {
  pitchfork_score: string | number | null;
  pitchfork_url: string | null;
  pitchfork_checked_at: string | null;
};

async function fetchHtml(url: string, timeoutMs = REQUEST_TIMEOUT_MS): Promise<string> {
  const response = await fetch(url, {
    headers: {
      "user-agent": USER_AGENT,
      accept: "text/html,application/xhtml+xml",
      "accept-language": "en-US,en;q=0.9",
    },
    cache: "no-store",
    redirect: "follow",
    signal: AbortSignal.timeout(Math.max(1, timeoutMs)),
  });
  if (!response.ok) throw new Error(`Pitchfork ответил ${response.status}`);
  return response.text();
}

/** Finds the review for an artist/title pair and reads its embedded score. */
export async function lookupPitchforkRating(
  artist: string,
  title: string,
): Promise<{ score: number; url: string } | null> {
  // Pitchfork's site search is literal: "Frank Ocean Blonde" finds no review,
  // while "Frank Ocean" lists "Blonde / Endless". Try the narrow query first,
  // then widen it.
  const seenQueries = new Set<string>();
  const queries = [`${artist} ${title}`, artist, title].filter((value) => {
    const key = value.trim().toLowerCase();
    if (!key || seenQueries.has(key)) return false;
    seenQueries.add(key);
    return true;
  });

  const triedUrls = new Set<string>();
  const deadline = Date.now() + LOOKUP_BUDGET_MS;
  const get = (url: string) => {
    const remaining = deadline - Date.now();
    if (remaining <= 0) throw new Error("Pitchfork не ответил вовремя");
    return fetchHtml(url, Math.min(REQUEST_TIMEOUT_MS, remaining));
  };

  for (const query of queries) {
    const search = new URL("/search/", BASE);
    search.searchParams.set("query", query);

    const results = parsePitchforkSearchResults(await get(search.toString()));
    const match = pickPitchforkResult(results, artist, title);
    if (!match) continue;

    const url = new URL(match.url, BASE).toString();
    if (triedUrls.has(url)) continue;
    triedUrls.add(url);

    const score = parsePitchforkScore(await get(url));
    if (score != null) return { score, url };
  }

  return null;
}

/**
 * Returns a cached Pitchfork score, looking it up once a month otherwise.
 * Network failures are not cached, so the next visit retries them.
 */
export const getPitchforkRating = cache(
  async (releaseId: string, artist: string, title: string): Promise<PitchforkRating> => {
    const sql = getSql();
    const rows = (await sql`
      select pitchfork_score, pitchfork_url, pitchfork_checked_at::text as pitchfork_checked_at
      from public.releases
      where id = ${releaseId}
    `) as ReleasePitchforkRow[];

    const row = rows[0];
    if (!row) return { status: "error" };

    const cached: PitchforkRating | null =
      row.pitchfork_score == null
        ? null
        : {
            status: "found",
            score: Number(row.pitchfork_score),
            url: row.pitchfork_url,
          };
    const checkedAt = row.pitchfork_checked_at ? toDate(row.pitchfork_checked_at).getTime() : 0;
    const fresh = checkedAt > 0 && Date.now() - checkedAt < CACHE_MS;

    if (fresh) return cached ?? { status: "none" };

    try {
      const found = await lookupPitchforkRating(artist, title);
      await sql`
        update public.releases
        set pitchfork_score = ${found?.score ?? null},
            pitchfork_url = ${found?.url ?? null},
            pitchfork_checked_at = now()
        where id = ${releaseId}
      `;
      return found ? { status: "found", score: found.score, url: found.url } : { status: "none" };
    } catch {
      // Keep an older score if there is one; otherwise let a later visit retry.
      return cached ?? { status: "error" };
    }
  },
);
