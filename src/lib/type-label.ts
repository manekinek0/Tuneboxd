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

export type MainType = "all" | "album" | "ep" | "single";

export function mainType(primary: string | null): Exclude<MainType, "all"> {
  if (primary === "Album") return "album";
  if (primary === "EP") return "ep";
  if (primary === "Single") return "single";
  return "album";
}
