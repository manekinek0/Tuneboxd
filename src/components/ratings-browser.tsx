"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { toDate, yearOf } from "@/lib/format";
import { typeLabel, type MainType } from "@/lib/type-label";
import type { RatingWithRelease } from "@/lib/types";
import { Cover } from "./cover";
import { ChevronRightIcon, SearchIcon } from "./icons";
import { Score } from "./release";

type Sort = "score" | "date" | "title";

const SORTS: { value: Sort; label: string }[] = [
  { value: "score", label: "По баллу" },
  { value: "date", label: "По дате" },
  { value: "title", label: "По названию" },
];

const FILTERS: { value: MainType; label: string }[] = [
  { value: "all", label: "Все" },
  { value: "album", label: "Альбомы" },
  { value: "ep", label: "EP" },
  { value: "single", label: "Синглы" },
];

export function RatingsBrowser({ ratings }: { ratings: RatingWithRelease[] }) {
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<Sort>("score");
  const [filter, setFilter] = useState<MainType>("all");

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = ratings.filter((r) => {
      if (filter !== "all" && r.primary_type !== { album: "Album", ep: "EP", single: "Single" }[filter]) {
        return false;
      }
      return !q || `${r.artist} ${r.title}`.toLowerCase().includes(q);
    });

    list = [...list].sort((a, b) => {
      if (sort === "date") return toDate(b.updated_at).getTime() - toDate(a.updated_at).getTime();
      if (sort === "title") return a.title.localeCompare(b.title, "ru");
      return b.score - a.score || a.title.localeCompare(b.title, "ru");
    });
    return list;
  }, [ratings, query, sort, filter]);

  return (
    <div>
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative w-full lg:max-w-xs">
          <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Найти в рейтинге"
            className="w-full rounded-full border border-transparent bg-fill py-2 pl-9 pr-3 text-[14px] outline-none transition-colors placeholder:text-muted focus:border-accent/50 focus:bg-surface"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex rounded-xl bg-fill p-0.5">
            {SORTS.map((s) => (
              <button
                key={s.value}
                type="button"
                onClick={() => setSort(s.value)}
                className={`rounded-[9px] px-2.5 py-1.5 text-[12px] font-medium transition-colors ${
                  sort === s.value ? "bg-surface text-ink shadow-sm" : "text-muted hover:text-ink"
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
          <span className="hidden text-[12px] text-muted sm:inline">
            {visible.length} {visible.length === 1 ? "релиз" : "релизов"}
          </span>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            type="button"
            onClick={() => setFilter(f.value)}
            className={`rounded-full px-3 py-1 text-[12px] font-medium transition-colors ${
              filter === f.value
                ? "bg-accent text-white"
                : "bg-fill text-muted hover:text-ink"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="mt-4 overflow-hidden rounded-2xl border border-line bg-surface">
        <div className="hidden items-center gap-3 border-b border-line px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.06em] text-muted sm:flex">
          <span className="w-7 text-center">№</span>
          <span className="w-12" />
          <span className="flex-1">Релиз</span>
          <span className="w-12 text-right">Балл</span>
          <span className="w-4" />
        </div>

        {visible.length ? (
          <div className="divide-y divide-line">
            {visible.map((r, i) => (
              <Link
                key={r.release_id}
                href={`/release/${r.mbid}`}
                className="group flex items-center gap-3 px-3 py-2.5 transition-colors hover:bg-fill/70 sm:px-4"
              >
                <span
                  className={`w-7 text-center text-[13px] font-semibold tabular-nums ${
                    i < 3 ? "text-accent" : "text-muted"
                  }`}
                >
                  {i + 1}
                </span>
                <Cover mbid={r.mbid} title={r.title} size="sm" />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[14px] font-medium leading-tight group-hover:text-accent">
                    {r.title}
                  </div>
                  <div className="truncate text-[12px] text-muted">
                    {r.artist}
                    {r.release_date && ` · ${yearOf(r.release_date)}`}
                    <span className="hidden sm:inline"> · {typeLabel(r.primary_type)}</span>
                  </div>
                </div>
                {r.review && (
                  <span className="hidden rounded-full bg-fill px-2 py-0.5 text-[10px] text-muted md:inline">
                    рецензия
                  </span>
                )}
                <div className="w-10 text-right">
                  <Score value={r.score} className="text-[19px]" />
                </div>
                <ChevronRightIcon className="hidden h-4 w-4 text-muted/50 sm:block" />
              </Link>
            ))}
          </div>
        ) : (
          <p className="px-4 py-10 text-center text-[13px] text-muted">
            Ничего не найдено. Попробуйте изменить фильтры или запрос.
          </p>
        )}
      </div>
    </div>
  );
}
