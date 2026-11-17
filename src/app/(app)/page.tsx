import type { Metadata } from "next";
import Link from "next/link";
import { Cover } from "@/components/cover";
import { ChevronRightIcon, MusicNoteIcon } from "@/components/icons";
import { RatingCard } from "@/components/rating-card";
import { ReleaseTile, Score } from "@/components/release";
import { yearOf } from "@/lib/format";
import { getBestRated, getDiaryStats, getRecentRatings, getUnratedListens } from "@/lib/queries";

export const metadata: Metadata = { title: "Обзор" };

export default async function HomePage() {
  const today = new Intl.DateTimeFormat("ru-RU", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date());

  const [stats, recent, best, unrated] = await Promise.all([
    getDiaryStats(),
    getRecentRatings(6),
    getBestRated(6),
    getUnratedListens(10),
  ]);

  const latest = recent[0] ?? null;

  return (
    <div className="space-y-9">
      <header className="flex items-end justify-between gap-4">
        <div>
          <p className="text-[13px] capitalize text-muted">{today}</p>
          <h1 className="mt-0.5 text-[34px] font-semibold tracking-tight">Обзор</h1>
        </div>
        <Link
          href="/ratings"
          className="mb-1 hidden items-center gap-0.5 text-[13px] text-muted transition-colors hover:text-accent sm:flex"
        >
          Весь рейтинг <ChevronRightIcon className="h-4 w-4" />
        </Link>
      </header>

      {latest ? (
        <section className="relative overflow-hidden rounded-3xl border border-line bg-surface p-5 sm:p-7">
          <div className="pointer-events-none absolute -right-16 -top-24 h-64 w-64 rounded-full bg-accent/10 blur-3xl" />
          <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:gap-7">
            <div className="w-36 shrink-0 sm:w-40">
              <Cover mbid={latest.mbid} title={latest.title} size="fill" eager />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">
                Последняя оценка
              </p>
              <Link href={`/release/${latest.mbid}`} className="group mt-1 block">
                <h2 className="truncate text-[26px] font-semibold leading-tight tracking-tight group-hover:text-accent">
                  {latest.title}
                </h2>
              </Link>
              <p className="mt-0.5 truncate text-[15px] text-muted">
                {latest.artist}
                {latest.release_date && ` · ${yearOf(latest.release_date)}`}
              </p>
              <div className="mt-4 flex flex-wrap items-center gap-4">
                <div className="flex items-baseline gap-1">
                  <Score value={latest.score} className="text-[42px] leading-none" />
                  <span className="text-[12px] text-muted">из 90</span>
                </div>
                <Link
                  href={`/release/${latest.mbid}`}
                  className="rounded-full bg-accent px-4 py-2 text-[13px] font-semibold text-white transition-colors hover:bg-accent-hover"
                >
                  Открыть релиз
                </Link>
              </div>
              {latest.review && (
                <p className="mt-3 line-clamp-2 text-[13px] leading-relaxed text-muted">{latest.review}</p>
              )}
            </div>
          </div>
        </section>
      ) : (
        <section className="rounded-3xl border border-line bg-surface px-6 py-12 text-center">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-accent-soft text-accent">
            <MusicNoteIcon className="h-6 w-6" />
          </span>
          <h2 className="mt-4 text-[20px] font-semibold">Дневник пока пуст</h2>
          <p className="mx-auto mt-1 max-w-sm text-[13px] leading-relaxed text-muted">
            Найдите первый релиз в MusicBrainz, поставьте оценку — и здесь появится ваша музыкальная
            история.
          </p>
          <Link
            href="/search"
            className="mt-5 inline-block rounded-full bg-accent px-5 py-2 text-[13px] font-semibold text-white transition-colors hover:bg-accent-hover"
          >
            Найти музыку
          </Link>
        </section>
      )}

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Оценок" value={String(stats.ratings_count)} />
        <Stat label="Прослушано" value={String(stats.listens_count)} />
        <Stat
          label="Средний балл"
          value={stats.avg_score == null ? "—" : String(Math.round(stats.avg_score))}
          suffix={stats.avg_score == null ? undefined : "из 90"}
          accent
        />
        <Stat label="Любимых треков" value={String(stats.favourites_count)} />
      </section>

      {unrated.length > 0 && (
        <section>
          <SectionHeader
            title="Ждут оценки"
            subtitle="Прослушано, но ещё не оценено"
            href="/import"
            linkLabel="Last.fm"
          />
          <div className="no-scrollbar -mx-4 flex gap-3 overflow-x-auto px-4 pb-1 sm:mx-0 sm:grid sm:grid-cols-3 sm:overflow-visible sm:px-0 lg:grid-cols-6">
            {unrated.map((item) => (
              <Link
                key={item.release_id}
                href={`/release/${item.mbid}`}
                className="group w-[132px] shrink-0 sm:w-auto"
              >
                <Cover mbid={item.mbid} title={item.title} size="fill" />
                <div className="mt-2 truncate text-[13px] font-medium leading-tight group-hover:text-accent">
                  {item.title}
                </div>
                <div className="truncate text-[12px] text-muted">{item.artist}</div>
                <div className="mt-0.5 text-[11px] text-accent">
                  {item.source === "lastfm" ? "Из Last.fm · оценить" : "Оценить"}
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {best.length > 0 && (
        <section>
          <SectionHeader title="Лучшее в дневнике" href="/ratings" linkLabel="Весь рейтинг" />
          <div className="grid grid-cols-3 gap-x-3 gap-y-5 sm:grid-cols-4 lg:grid-cols-6">
            {best.map((rating, i) => (
              <ReleaseTile
                key={rating.release_id}
                release={rating}
                score={rating.score}
                rank={i + 1}
              />
            ))}
          </div>
        </section>
      )}

      {recent.length > 0 && (
        <section>
          <SectionHeader title="Последние оценки" href="/ratings" linkLabel="Все оценки" />
          <div className="grid gap-3 lg:grid-cols-2">
            {recent.map((rating) => (
              <RatingCard key={rating.release_id} rating={rating} />
            ))}
          </div>
        </section>
      )}

      {recent.length > 0 && (
        <section>
          <SectionHeader
            title="Статистика критериев"
            subtitle="Средние оценки по всем релизам"
          />
          <div className="grid gap-x-8 gap-y-4 rounded-2xl border border-line bg-surface p-5 sm:grid-cols-2">
            {[
              { label: "Рифмы / образы", value: stats.avg_rhymes },
              { label: "Структура / ритмика", value: stats.avg_structure },
              { label: "Реализация стиля", value: stats.avg_style },
              { label: "Индивидуальность / харизма", value: stats.avg_individuality },
              { label: "Атмосфера / вайб", value: stats.avg_vibe },
            ].map((item) => (
              <div key={item.label}>
                <div className="flex items-baseline justify-between text-[12px]">
                  <span className="text-muted">{item.label}</span>
                  <span className="font-semibold tabular-nums">{item.value ?? "—"}</span>
                </div>
                <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-fill">
                  <div
                    className="h-full rounded-full bg-accent"
                    style={{ width: `${((item.value ?? 0) / 10) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function Stat({
  label,
  value,
  suffix,
  accent = false,
}: {
  label: string;
  value: string;
  suffix?: string;
  accent?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-line bg-surface p-4">
      <div className={`text-[26px] font-semibold leading-none tabular-nums ${accent ? "text-accent" : ""}`}>
        {value}
        {suffix && <span className="ml-1 text-[11px] font-normal text-muted">{suffix}</span>}
      </div>
      <div className="mt-1.5 text-[11px] uppercase tracking-[0.06em] text-muted">{label}</div>
    </div>
  );
}

function SectionHeader({
  title,
  subtitle,
  href,
  linkLabel,
}: {
  title: string;
  subtitle?: string;
  href?: string;
  linkLabel?: string;
}) {
  return (
    <div className="mb-3 flex items-end justify-between gap-4">
      <div>
        <h2 className="text-[20px] font-semibold tracking-tight">{title}</h2>
        {subtitle && <p className="mt-0.5 text-[12px] text-muted">{subtitle}</p>}
      </div>
      {href && linkLabel && (
        <Link
          href={href}
          className="flex items-center gap-0.5 text-[12px] text-muted transition-colors hover:text-accent"
        >
          {linkLabel} <ChevronRightIcon className="h-4 w-4" />
        </Link>
      )}
    </div>
  );
}
