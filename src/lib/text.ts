/** Text normalisation shared by external-catalogue matching (Pitchfork, Deezer). */

export function normalizeText(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Drops "Deluxe Edition", "CD 2" and similar suffixes before comparing titles. */
export function canonicalTitle(value: string): string {
  return normalizeText(
    value
      .replace(/\s*[(\[][^)\]]*\b(?:deluxe|expanded|remaster(?:ed)?|anniversary|edition|bonus|reissue|special|cd\s*\d+|dis[ck]\s*\d+)\b[^)\]]*[)\]]/gi, " ")
      .replace(/\s*[-–—]\s*(?:deluxe|expanded|remaster(?:ed)?|anniversary|edition|bonus|reissue).*$/i, " "),
  );
}

/** 1 for an exact artist match, lower values for aliases/partial credits. */
export function artistSimilarity(left: string, right: string): number {
  const a = normalizeText(left);
  const b = normalizeText(right);
  if (!a || !b) return 0;
  if (a === b) return 1;

  const shortA = a.replace(/^the /, "");
  const shortB = b.replace(/^the /, "");
  if (shortA === shortB) return 1;
  if (shortA.includes(shortB) || shortB.includes(shortA)) return 0.85;

  const tokensA = new Set(shortA.split(" "));
  const tokensB = new Set(shortB.split(" "));
  let shared = 0;
  for (const token of tokensA) if (tokensB.has(token)) shared += 1;
  const overlap = shared / Math.min(tokensA.size, tokensB.size);
  return overlap >= 0.5 ? 0.6 : 0;
}

/** Split combined reviews ("Blonde / Endless") into separately matchable titles. */
function titleParts(value: string): string[] {
  return value
    .split(/\s*\/\s*/)
    .map(canonicalTitle)
    .filter(Boolean);
}

/** 1 for an exact title, 0.9 without edition suffixes, lower for partials. */
export function titleSimilarity(left: string, right: string): number {
  const a = normalizeText(left);
  const b = normalizeText(right);
  if (!a || !b) return 0;
  if (a === b) return 1;

  const shortA = canonicalTitle(left);
  const shortB = canonicalTitle(right);
  if (shortA && shortA === shortB) return 0.9;

  const partsA = new Set(titleParts(left));
  const partsB = new Set(titleParts(right));
  for (const part of partsA) {
    if (part && partsB.has(part)) return 0.9;
  }

  if (shortA && shortB && (shortA.includes(shortB) || shortB.includes(shortA))) return 0.65;
  return 0;
}
