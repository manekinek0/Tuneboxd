const dateFmt = new Intl.DateTimeFormat("ru-RU", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

const shortDateFmt = new Intl.DateTimeFormat("ru-RU", {
  day: "numeric",
  month: "short",
});

/** Postgres text timestamps look like "2026-11-17 11:46:51.338+00". */
export function toDate(value: string | Date): Date {
  if (value instanceof Date) return value;
  let text = value;
  if (/^\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}/.test(text)) {
    text = text.replace(" ", "T");
    // JS needs a full offset: "+00" -> "+00:00", "+0530" -> "+05:30".
    text = text.replace(/([+-]\d{2})$/, "$1:00").replace(/([+-]\d{2})(\d{2})$/, "$1:$2");
  }
  return new Date(text);
}

export function formatDate(iso: string | Date | null | undefined) {
  if (!iso) return "";
  const date = toDate(iso);
  return Number.isNaN(date.getTime()) ? "" : dateFmt.format(date);
}

export function formatShortDate(iso: string | Date | null | undefined) {
  if (!iso) return "";
  const date = toDate(iso);
  return Number.isNaN(date.getTime()) ? "" : shortDateFmt.format(date);
}

/** MusicBrainz dates can be partial: YYYY, YYYY-MM, YYYY-MM-DD. */
export function formatReleaseDate(date: string | null | undefined) {
  if (!date) return "";
  const [year, month, day] = date.split("-");
  if (!month) return year;
  const months = [
    "января",
    "февраля",
    "марта",
    "апреля",
    "мая",
    "июня",
    "июля",
    "августа",
    "сентября",
    "октября",
    "ноября",
    "декабря",
  ];
  if (!day) return `${months[Number(month) - 1]} ${year}`;
  return `${Number(day)} ${months[Number(month) - 1]} ${year}`;
}

export function yearOf(date: string | null | undefined) {
  return date?.slice(0, 4) ?? "";
}

export function plural(n: number, one: string, few: string, many: string) {
  const m10 = n % 10;
  const m100 = n % 100;
  if (m10 === 1 && m100 !== 11) return one;
  if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return few;
  return many;
}

export function formatLength(ms: number | null) {
  if (!ms) return "";
  const s = Math.round(ms / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}
