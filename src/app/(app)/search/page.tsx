import type { Metadata } from "next";
import Link from "next/link";
import { Cover } from "@/components/cover";
import { ChevronRightIcon, SearchIcon } from "@/components/icons";
import { plural, yearOf } from "@/lib/format";
import { searchReleaseGroups } from "@/lib/musicbrainz";
import { rankByPopularity } from "@/lib/popularity";
import { typeLabel } from "@/lib/type-label";

export const metadata: Metadata = { title: "Поиск" };

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string | string[] }>;
}) {
  const { q } = await searchParams;
  const query = typeof q === "string" ? q.trim() : "";

  let results: Awaited<ReturnType<typeof rankByPopularity>> = [];
  let failed = false;
  if (query) {
    try {
      results = await rankByPopularity(query, await searchReleaseGroups(query));
    } catch {
      failed = true;
    }
  }

  const rankedByPopularity = results.some((release) => release.popularity != null);

  return (
    <div className="space-y-6">
      <header>
        <p className="text-[13px] text-muted">MusicBrainz</p>
        <h1 className="mt-0.5 text-[34px] font-semibold tracking-tight">Поиск</h1>
      </header>

      <form className="flex gap-2">
        <div className="relative flex-1">
          <SearchIcon className="pointer-events-none absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-muted" />
          <input
            name="q"
            defaultValue={query}
            autoFocus
            placeholder="Артист, альбом или сингл"
            className="w-full rounded-full border border-transparent bg-fill py-3 pl-11 pr-4 text-[15px] outline-none transition-colors placeholder:text-muted focus:border-accent/50 focus:bg-surface"
          />
        </div>
        <button className="shrink-0 rounded-full bg-accent px-5 text-[14px] font-semibold text-white transition-colors hover:bg-accent-hover">
          Найти
        </button>
      </form>

      {failed && (
        <p className="rounded-xl bg-accent-soft px-4 py-3 text-[13px]">
          MusicBrainz сейчас не отвечает. Подождите пару секунд и попробуйте снова.
        </p>
      )}

      {query && !failed && results.length === 0 && (
        <p className="py-10 text-center text-[13px] text-muted">Ничего не нашлось.</p>
      )}

      {!query && (
        <div className="rounded-2xl border border-line bg-surface px-5 py-10 text-center">
          <SearchIcon className="mx-auto h-6 w-6 text-muted" />
          <p className="mt-3 text-[14px] font-medium">Найдите релиз, чтобы начать</p>
          <p className="mx-auto mt-1 max-w-sm text-[12px] leading-relaxed text-muted">
            Каталог берётся из открытой базы MusicBrainz. Релиз сохранится в дневнике при первом
            открытии его страницы.
          </p>
        </div>
      )}

      {query && !failed && results.length > 0 && (
        <div className="flex flex-wrap items-baseline justify-between gap-2 text-[12px] text-muted">
          <span>
            {results.length} {plural(results.length, "релиз", "релиза", "релизов")}
          </span>
          <span>{rankedByPopularity ? "Сначала популярные · Deezer" : "Сначала релевантные"}</span>
        </div>
      )}

      <div className="grid gap-2.5 sm:grid-cols-2">
        {results.map((release) => (
          <Link
            key={release.mbid}
            href={`/release/${release.mbid}`}
            // Opening a release imports it from MusicBrainz; don't do that for every result in view.
            prefetch={false}
            className="group flex items-center gap-3 rounded-2xl border border-line bg-surface p-3 transition-shadow hover:shadow-[var(--shadow-card)]"
          >
            <Cover mbid={release.mbid} title={release.title} size="sm" />
            <div className="min-w-0 flex-1">
              <div className="truncate text-[14px] font-medium leading-tight group-hover:text-accent">
                {release.title}
              </div>
              <div className="truncate text-[12px] text-muted">{release.artist}</div>
              <div className="truncate text-[11px] text-muted">
                {typeLabel(release.primaryType, release.secondaryTypes)}
                {release.releaseDate && ` · ${yearOf(release.releaseDate)}`}
              </div>
            </div>
            <ChevronRightIcon className="h-4 w-4 shrink-0 text-muted/50" />
          </Link>
        ))}
      </div>
    </div>
  );
}
