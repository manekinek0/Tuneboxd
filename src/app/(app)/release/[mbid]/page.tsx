import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { addToTop, deleteRating, toggleFavouriteTrack, toggleListened } from "@/lib/actions/ratings";
import { Cover } from "@/components/cover";
import {
  CalendarIcon,
  CheckIcon,
  ChevronLeftIcon,
  HeartFilledIcon,
  HeartIcon,
  LastfmIcon,
  PlusIcon,
  SpotifyIcon,
  StarFilledIcon,
  TrashIcon,
} from "@/components/icons";
import { RatingForm } from "@/components/rating-form";
import { Score } from "@/components/release";
import { formatDate, formatLength, formatReleaseDate, yearOf } from "@/lib/format";
import { ensureRelease } from "@/lib/musicbrainz";
import { typeLabel as releaseTypeLabel } from "@/lib/type-label";
import {
  getFavouriteTrackIds,
  getListenState,
  getRating,
  getReleaseByMbid,
  getReleaseStats,
  getTopIds,
  getTracks,
} from "@/lib/queries";

async function loadRelease(mbid: string) {
  const releaseId = await ensureRelease(mbid);
  if (!releaseId) return null;
  return getReleaseByMbid(mbid);
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ mbid: string }>;
}): Promise<Metadata> {
  const release = await loadRelease((await params).mbid);
  return { title: release ? `${release.artist} — ${release.title}` : "Релиз не найден" };
}

export default async function ReleasePage({ params }: { params: Promise<{ mbid: string }> }) {
  const { mbid } = await params;
  const release = await loadRelease(mbid);
  if (!release) notFound();

  const [tracks, stats, rating, listen, favouriteIds, topIds] = await Promise.all([
    getTracks(release.id),
    getReleaseStats(release.id),
    getRating(release.id),
    getListenState(release.id),
    getFavouriteTrackIds(release.id),
    getTopIds(),
  ]);

  const favourites = new Set(favouriteIds);
  const inTop = topIds.includes(release.id);
  const multiDisc = new Set(tracks.map((t) => t.disc)).size > 1;
  const hidden = { release_id: release.id, mbid };

  return (
    <div className="space-y-8">
      <Link
        href="/ratings"
        className="inline-flex items-center gap-1 text-[13px] text-muted transition-colors hover:text-ink"
      >
        <ChevronLeftIcon className="h-4 w-4" /> Рейтинг
      </Link>

      <section className="flex flex-col gap-6 sm:flex-row sm:items-end sm:gap-7">
        <div className="w-[210px] shrink-0 sm:w-[280px]">
          <Cover mbid={mbid} title={release.title} size="fill" eager />
        </div>
        <div className="min-w-0 flex-1 pb-1">
          <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">
            {releaseTypeLabel(release.primary_type, release.secondary_types)}
            {release.release_date && ` · ${yearOf(release.release_date)}`}
          </div>
          <h1 className="mt-1.5 text-[32px] font-semibold leading-[1.08] tracking-tight sm:text-[38px]">
            {release.title}
          </h1>
          <p className="mt-1 text-[17px] text-muted">{release.artist}</p>

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <div className="flex items-baseline gap-1.5">
              <Score value={rating?.score ?? stats?.avg_score ?? null} className="text-[40px] leading-none" />
              <span className="text-[12px] text-muted">из 90</span>
            </div>
            {release.release_date && (
              <span className="hidden items-center gap-1 text-[12px] text-muted sm:flex">
                <CalendarIcon className="h-3.5 w-3.5" /> {formatReleaseDate(release.release_date)}
              </span>
            )}
            {listen.listened && (
              <span className="inline-flex items-center gap-1 rounded-full bg-positive/10 px-2 py-0.5 text-[11px] font-medium text-positive">
                <CheckIcon className="h-3 w-3" /> Прослушано
              </span>
            )}
            {listen.source === "lastfm" && (
              <span className="inline-flex items-center gap-1 rounded-full bg-fill px-2 py-0.5 text-[11px] text-muted">
                <LastfmIcon className="h-3 w-3 text-accent" /> из Last.fm
              </span>
            )}
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <a
              href={`https://open.spotify.com/search/${encodeURIComponent(`${release.artist} ${release.title}`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full bg-spotify px-4 py-2 text-[13px] font-semibold text-black transition-opacity hover:opacity-90"
            >
              <SpotifyIcon className="h-4 w-4" /> Слушать
            </a>

            <form action={toggleListened}>
              <HiddenFields values={{ ...hidden, listened: listen.listened ? "1" : "0" }} />
              <button className="rounded-full border border-line px-3.5 py-2 text-[13px] text-muted transition-colors hover:border-accent hover:text-ink">
                {listen.listened ? "Убрать прослушивание" : "Прослушано"}
              </button>
            </form>

            {inTop ? (
              <Link
                href="/top"
                className="inline-flex items-center gap-1.5 rounded-full border border-accent/40 px-3.5 py-2 text-[13px] text-accent"
              >
                <StarFilledIcon className="h-4 w-4" /> В топ-10
              </Link>
            ) : topIds.length < 10 ? (
              <form action={addToTop}>
                <HiddenFields values={hidden} />
                <button className="inline-flex items-center gap-1.5 rounded-full border border-line px-3.5 py-2 text-[13px] text-muted transition-colors hover:border-accent hover:text-ink">
                  <PlusIcon className="h-4 w-4" /> В топ-10
                </button>
              </form>
            ) : (
              <Link
                href="/top"
                className="rounded-full border border-line px-3.5 py-2 text-[13px] text-muted transition-colors hover:border-accent hover:text-ink"
              >
                Топ-10 заполнен
              </Link>
            )}

            {rating && (
              <form action={deleteRating}>
                <HiddenFields values={hidden} />
                <button className="inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-[13px] text-muted transition-colors hover:text-accent">
                  <TrashIcon className="h-4 w-4" /> Удалить оценку
                </button>
              </form>
            )}
          </div>
        </div>
      </section>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_390px]">
        <div className="order-2 space-y-8 lg:order-1">
          <section>
            <div className="mb-3 flex items-baseline justify-between">
              <h2 className="text-[20px] font-semibold tracking-tight">Треклист</h2>
              {tracks.length > 0 && <span className="text-[12px] text-muted">{tracks.length} треков</span>}
            </div>
            {tracks.length ? (
              <ol className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-surface">
                {tracks.map((track) => {
                  const isFavourite = favourites.has(track.id);
                  return (
                    <li key={track.id} className="flex items-center gap-3 px-4 py-2.5 text-[14px]">
                      <span className="w-7 shrink-0 text-right text-[12px] tabular-nums text-muted">
                        {multiDisc ? `${track.disc}.${track.position}` : track.position}
                      </span>
                      <span className="min-w-0 flex-1 truncate">{track.title}</span>
                      <span className="w-10 shrink-0 text-right text-[12px] tabular-nums text-muted">
                        {formatLength(track.length_ms)}
                      </span>
                      <form action={toggleFavouriteTrack}>
                        <input type="hidden" name="track_id" value={track.id} />
                        <input type="hidden" name="release_id" value={release.id} />
                        <input type="hidden" name="mbid" value={mbid} />
                        <input type="hidden" name="favourite" value={isFavourite ? "1" : "0"} />
                        <button
                          title={isFavourite ? "Убрать из любимых" : "Любимый трек"}
                          aria-label={isFavourite ? `Убрать «${track.title}» из любимых` : `Отметить «${track.title}» любимым`}
                          className={`flex h-7 w-7 items-center justify-center rounded-full transition-colors ${
                            isFavourite ? "text-accent" : "text-muted/50 hover:text-accent"
                          }`}
                        >
                          {isFavourite ? <HeartFilledIcon className="h-4 w-4" /> : <HeartIcon className="h-4 w-4" />}
                        </button>
                      </form>
                    </li>
                  );
                })}
              </ol>
            ) : (
              <p className="rounded-2xl border border-dashed border-line px-4 py-8 text-center text-[13px] text-muted">
                В MusicBrainz нет треклиста для этого релиза.
              </p>
            )}
          </section>

          {rating?.review && (
            <section className="rounded-2xl border border-line bg-surface p-5">
              <div className="flex items-baseline justify-between gap-4">
                <h2 className="text-[20px] font-semibold tracking-tight">Моя рецензия</h2>
                <span className="text-[11px] text-muted">{formatDate(rating.updated_at)}</span>
              </div>
              <p className="mt-3 whitespace-pre-line text-[14px] leading-relaxed text-ink/90">
                {rating.review}
              </p>
            </section>
          )}

          {stats && (
            <section className="rounded-2xl border border-line bg-surface p-5">
              <h2 className="text-[20px] font-semibold tracking-tight">Детали оценки</h2>
              <dl className="mt-3 space-y-2">
                {[
                  ["Рифмы / образы", stats.avg_rhymes],
                  ["Структура / ритмика", stats.avg_structure],
                  ["Реализация стиля", stats.avg_style],
                  ["Индивидуальность / харизма", stats.avg_individuality],
                  ["Атмосфера / вайб", stats.avg_vibe],
                ].map(([label, value]) => (
                  <div key={String(label)} className="flex items-center gap-3">
                    <dt className="w-56 shrink-0 text-[12px] text-muted">{label}</dt>
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-fill">
                      <div
                        className="h-full rounded-full bg-accent"
                        style={{ width: `${(Number(value ?? 0) / 10) * 100}%` }}
                      />
                    </div>
                    <dd className="w-8 text-right text-[12px] font-semibold tabular-nums">
                      {value ?? "—"}
                    </dd>
                  </div>
                ))}
              </dl>
            </section>
          )}
        </div>

        <aside className="order-1 space-y-4 lg:order-2">
          <div className="lg:sticky lg:top-6">
            <RatingForm
              releaseId={release.id}
              mbid={mbid}
              initial={
                rating
                  ? {
                      rhymes: rating.rhymes,
                      structure: rating.structure,
                      style: rating.style,
                      individuality: rating.individuality,
                      vibe: rating.vibe,
                      review: rating.review,
                    }
                  : null
              }
            />
            {listen.listened && rating && (
              <p className="mt-3 px-1 text-[11px] leading-relaxed text-muted">
                Снятие отметки «Прослушано» также удаляет оценку.
              </p>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}

function HiddenFields({ values }: { values: Record<string, string> }) {
  return Object.entries(values).map(([key, value]) => (
    <input key={key} type="hidden" name={key} value={value} />
  ));
}
