export const CRITERIA = [
  { key: "rhymes", label: "Рифмы / образы" },
  { key: "structure", label: "Структура / ритмика" },
  { key: "style", label: "Реализация стиля" },
  { key: "individuality", label: "Индивидуальность / харизма" },
] as const;

export const VIBE = { key: "vibe", label: "Атмосфера / вайб" } as const;

export type CriterionKey = (typeof CRITERIA)[number]["key"] | typeof VIBE.key;

export type Scores = Record<CriterionKey, number>;

export const BASE_FACTOR = 1.4;
export const MAX_VIBE_MULTIPLIER = 1.6072;
export const MAX_SCORE = 90;

/** Vibe 1..10 maps linearly onto x1.0000..x1.6072. */
export function vibeMultiplier(vibe: number): number {
  return 1 + ((vibe - 1) * (MAX_VIBE_MULTIPLIER - 1)) / 9;
}

/** Unrounded score. Keep in sync with ratings.score in the SQL migration. */
export function rawScore(s: Scores): number {
  const base = (s.rhymes + s.structure + s.style + s.individuality) * BASE_FACTOR;
  return base * vibeMultiplier(s.vibe);
}

export function computeScore(s: Scores): number {
  return Math.min(MAX_SCORE, Math.round(rawScore(s)));
}

/** Tailwind text colour for a 0..90 score. */
export function scoreColor(score: number): string {
  if (score >= 75) return "text-fuchsia-300";
  if (score >= 60) return "text-violet-300";
  if (score >= 45) return "text-blue-300";
  if (score >= 30) return "text-sky-200";
  return "text-zinc-400";
}
