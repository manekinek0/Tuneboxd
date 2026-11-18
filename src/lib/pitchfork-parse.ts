import { artistSimilarity, titleSimilarity } from "./text";

export type PitchforkSearchResult = {
  url: string;
  title: string;
  artist: string;
};

const NAMED_ENTITIES: Record<string, string> = {
  amp: "&",
  apos: "'",
  gt: ">",
  lt: "<",
  nbsp: " ",
  quot: '"',
};

export function decodeEntities(value: string): string {
  return value.replace(/&(#x?[0-9a-f]+|[a-z]+);/gi, (entity, code: string) => {
    if (code.startsWith("#")) {
      const hex = code[1]?.toLowerCase() === "x";
      const point = Number.parseInt(code.slice(hex ? 2 : 1), hex ? 16 : 10);
      return Number.isFinite(point) ? String.fromCodePoint(point) : entity;
    }
    return NAMED_ENTITIES[code.toLowerCase()] ?? entity;
  });
}

function stripTags(value: string): string {
  return decodeEntities(value.replace(/<[^>]*>/g, " "))
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Pitchfork's search page server-renders result cards. Heading links carry the
 * review URL and title; the artist sits in the sub-heading right below.
 */
export function parsePitchforkSearchResults(html: string): PitchforkSearchResult[] {
  const results: PitchforkSearchResult[] = [];
  const seen = new Set<string>();
  const anchor = /<a\b([^>]*)>([\s\S]*?)<\/a>/gi;

  for (const match of html.matchAll(anchor)) {
    const attributes = match[1];
    if (!/class="[^"]*SummaryItemHedLink[^"]*"/i.test(attributes)) continue;

    const href = attributes.match(/href="(\/reviews\/albums\/[^"]+)"/i)?.[1];
    if (!href || seen.has(href)) continue;

    const title = stripTags(match[2]);
    if (!title) continue;

    const index = (match.index ?? 0) + match[0].length;
    const tail = html.slice(index, index + 6000);
    const nextCard = tail.search(/<a\b[^>]*class="[^"]*SummaryItemHedLink/i);
    const block = nextCard >= 0 ? tail.slice(0, nextCard) : tail;
    const artistHtml = block.match(
      /<div\b[^>]*class="[^"]*SummaryItemSubHedBase[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
    )?.[1];

    seen.add(href);
    results.push({ url: href, title, artist: artistHtml ? stripTags(artistHtml) : "" });
  }

  return results;
}

/** The review page embeds its editorial score in the preloaded JSON state. */
export function parsePitchforkScore(html: string): number | null {
  const match = html.match(
    /\\?"musicRating\\?"\s*:\s*\{[^}]*?\\?"score\\?"\s*:\s*([0-9]+(?:\.[0-9]+)?)/,
  );
  if (!match) return null;

  const score = Number(match[1]);
  if (!Number.isFinite(score) || score < 0 || score > 10) return null;
  return Math.round(score * 10) / 10;
}

/** Picks the review whose title and artist best match the MusicBrainz release. */
export function pickPitchforkResult(
  results: PitchforkSearchResult[],
  artist: string,
  title: string,
): PitchforkSearchResult | null {
  let best: PitchforkSearchResult | null = null;
  let bestScore = 0;

  for (const result of results) {
    const artistScore = artistSimilarity(artist, result.artist);
    if (artistScore === 0) continue;

    const titleScore = titleSimilarity(title, result.title);
    if (titleScore === 0) continue;

    const score = titleScore * 0.68 + artistScore * 0.32;
    if (score > bestScore) {
      best = result;
      bestScore = score;
    }
  }

  // An exact title by the wrong artist scores 0.68, so this threshold keeps
  // same-name albums by other artists out.
  return bestScore >= 0.8 ? best : null;
}
