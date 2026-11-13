import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  addToTop,
  deleteRating,
  toggleFavouriteTrack,
  toggleListened,
} from "@/app/actions";
import { Cover } from "@/components/cover";
import { RATING_SELECT, RatingCard, type RatingWithJoins } from "@/components/rating-card";
import { RatingForm } from "@/components/rating-form";
import { Score } from "@/components/release";
import { ensureRelease, typeLabel } from "@/lib/musicbrainz";
import { CRITERIA, VIBE } from "@/lib/score";
import { createClient, getViewer } from "@/lib/supabase/server";

async function loadRelease(mbid: string) {
  const releaseId = await ensureRelease(mbid);
  if (!releaseId) return null;
  const supabase = await createClient();
  const { data } = await supabase.from("releases").select("*").eq("id", releaseId).single();
  return data;
}

export async function generateMetadata({ params }: PageProps<"/release/[mbid]">): Promise<Metadata> {
  const release = await loadRelease((await params).mbid);
  return { title: release ? `${release.artist} — ${release.title}` : "Релиз не найден" };
}

function formatLength(ms: number | null) {
  if (!ms) return "";
  const s = Math.round(ms / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

export default async function ReleasePage({ params }: PageProps<"/release/[mbid]">) {
  const { mbid } = await params;
  const release = await loadRelease(mbid);
  if (!release) notFound();

  const supabase = await createClient();
  const viewer = await getViewer();

  const [{ data: tracks }, { data: stats }, { data: favCounts }, { data: reviews }] = await Promise.all([
    supabase.from("tracks").select("id, disc, position, title, length_ms").eq("release_id", release.id).order("disc").order("position"),
    supabase.from("release_stats").select("*").eq("release_id", release.id).maybeSingle(),
    supabase.from("track_favourite_counts").select("track_id, favourites").eq("release_id", release.id),
    supabase
      .from("ratings")
      .select(RATING_SELECT)
      .eq("release_id", release.id)
      .order("updated_at", { ascending: false })
      .limit(50),
  ]);

  let mine: {
    rating: Record<string, number> & { review: string | null } | null;
    listened: boolean;
    favourites: Set<string>;
    topCount: number;
    inTop: boolean;
  } | null = null;
  if (viewer) {
    const [{ data: rating }, { data: listen }, { data: favs }, { data: top }] = await Promise.all([
      supabase
        .from("ratings")
        .select("rhymes, structure, style, individuality, vibe, review")
        .eq("user_id", viewer.id)
        .eq("release_id", release.id)
        .maybeSingle(),
      supabase.from("listens").select("release_id").eq("user_id", viewer.id).eq("release_id", release.id).maybeSingle(),
      supabase.from("favourite_tracks").select("track_id").eq("user_id", viewer.id).eq("release_id", release.id),
      supabase.from("top_releases").select("release_id").eq("user_id", viewer.id),
    ]);
    mine = {
      rating,
      listened: !!listen,
      favourites: new Set((favs ?? []).map((f) => f.track_id)),
      topCount: top?.length ?? 0,
      inTop: !!top?.some((t) => t.release_id === release.id),
    };
  }

  const favMap = new Map((favCounts ?? []).map((f) => [f.track_id, f.favourites]));
  const multiDisc = new Set((tracks ?? []).map((t) => t.disc)).size > 1;
  const hidden = { release_id: release.id, mbid };

  return (
    <div className="grid gap-10 lg:grid-cols-[1fr_380px]">
      <div className="space-y-10">
        <section className="flex flex-col gap-6 sm:flex-row">
          <Cover mbid={mbid} title={release.title} size="lg" />
          <div className="flex flex-col justify-end gap-2">
            <div className="text-sm text-muted">
              {typeLabel(release.primary_type, release.secondary_types)}
              {release.release_date && ` · ${release.release_date}`}
            </div>
            <h1 className="text-3xl font-extrabold">{release.title}</h1>
            <div className="text-lg text-zinc-300">{release.artist}</div>
            <div className="mt-4 flex items-end gap-6">
              <div>
                <div className="text-xs uppercase tracking-wide text-muted">Средний балл</div>
                <Score value={stats?.avg_score ?? null} className="text-5xl" />
              </div>
              <div className="pb-1 text-sm text-muted">
                {stats?.ratings_count ?? 0} {plural(stats?.ratings_count ?? 0, "оценка", "оценки", "оценок")}
              </div>
            </div>
            {stats && (
              <dl className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
                {[...CRITERIA, VIBE].map((c) => (
                  <div key={c.key}>
                    {c.label}:{" "}
                    <span className={c.key === "vibe" ? "text-vibe" : "text-accent"}>
                      {stats[`avg_${c.key}` as keyof typeof stats]}
                    </span>
                  </div>
                ))}
              </dl>
            )}
            <a
              href={`https://open.spotify.com/search/${encodeURIComponent(`${release.artist} ${release.title}`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex w-fit items-center gap-2 rounded-full bg-spotify px-4 py-1.5 text-sm font-semibold text-black hover:brightness-110"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden>
                <path d="M12 0a12 12 0 1 0 0 24 12 12 0 0 0 0-24Zm5.5 17.3a.75.75 0 0 1-1 .25c-2.9-1.77-6.5-2.17-10.8-1.19a.75.75 0 1 1-.33-1.46c4.67-1.07 8.68-.61 11.88 1.35.36.22.47.69.25 1.05Zm1.47-3.27a.94.94 0 0 1-1.29.31c-3.3-2.03-8.35-2.62-12.26-1.43a.94.94 0 1 1-.55-1.8c4.47-1.36 10.02-.7 13.79 1.62.44.27.58.85.31 1.3Zm.13-3.4C15.14 8.28 8.6 8.07 4.8 9.22a1.13 1.13 0 1 1-.65-2.16c4.36-1.32 11.6-1.07 16.17 1.64a1.13 1.13 0 0 1-1.16 1.94Z" />
              </svg>
              Слушать в Spotify
            </a>
          </div>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-bold">Треклист</h2>
          {tracks?.length ? (
            <ol className="divide-y divide-line rounded-xl border border-line bg-panel">
              {tracks.map((t) => {
                const isFav = mine?.favourites.has(t.id) ?? false;
                const count = favMap.get(t.id) ?? 0;
                return (
                  <li key={t.id} className="flex items-center gap-3 px-4 py-2 text-sm">
                    <span className="w-8 text-right tabular-nums text-muted">
                      {multiDisc ? `${t.disc}.${t.position}` : t.position}
                    </span>
                    <span className="flex-1">{t.title}</span>
                    {count > 0 && <span className="text-xs text-vibe">♥ {count}</span>}
                    <span className="w-12 text-right tabular-nums text-muted">{formatLength(t.length_ms)}</span>
                    {viewer && (
                      <form action={toggleFavouriteTrack}>
                        <input type="hidden" name="track_id" value={t.id} />
                        <input type="hidden" name="release_id" value={release.id} />
                        <input type="hidden" name="mbid" value={mbid} />
                        <input type="hidden" name="favourite" value={isFav ? "1" : "0"} />
                        <button
                          title={isFav ? "Убрать из любимых" : "Любимый трек"}
                          aria-label={isFav ? `Убрать «${t.title}» из любимых` : `Отметить «${t.title}» любимым`}
                          className={`text-lg leading-none ${isFav ? "text-vibe" : "text-zinc-600 hover:text-vibe"}`}
                        >
                          {isFav ? "♥" : "♡"}
                        </button>
                      </form>
                    )}
                  </li>
                );
              })}
            </ol>
          ) : (
            <p className="text-sm text-muted">В MusicBrainz нет треклиста для этого релиза.</p>
          )}
        </section>

        <section>
          <h2 className="mb-3 text-lg font-bold">Рецензии и оценки</h2>
          {reviews?.length ? (
            <div className="space-y-3">
              {(reviews as unknown as RatingWithJoins[]).map((r, i) => (
                <RatingCard key={i} rating={r} showRelease={false} />
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted">Оценок пока нет.</p>
          )}
        </section>
      </div>

      <aside className="space-y-4">
        {viewer && mine ? (
          <>
            <RatingForm releaseId={release.id} mbid={mbid} initial={mine.rating as never} />
            <div className="flex flex-wrap gap-2 text-sm">
              <form action={toggleListened}>
                <HiddenFields values={{ ...hidden, listened: mine.listened ? "1" : "0" }} />
                <button className="rounded-lg border border-line px-3 py-1.5 hover:border-accent">
                  {mine.listened ? "✓ Прослушано" : "Отметить прослушанным"}
                </button>
              </form>
              {mine.inTop ? (
                <Link href="/settings/top" className="rounded-lg border border-accent/60 px-3 py-1.5 text-accent">
                  ★ В моём топ-10
                </Link>
              ) : mine.topCount < 10 ? (
                <form action={addToTop}>
                  <HiddenFields values={hidden} />
                  <button className="rounded-lg border border-line px-3 py-1.5 hover:border-accent">
                    ☆ Добавить в топ-10
                  </button>
                </form>
              ) : (
                <Link href="/settings/top" className="rounded-lg border border-line px-3 py-1.5 text-muted">
                  Топ-10 заполнен — изменить
                </Link>
              )}
              {mine.rating && (
                <form action={deleteRating}>
                  <HiddenFields values={hidden} />
                  <button className="rounded-lg px-3 py-1.5 text-muted hover:text-red-400">Удалить оценку</button>
                </form>
              )}
            </div>
            {mine.listened && !mine.rating && (
              <p className="text-xs text-muted">Снятие отметки «Прослушано» также удаляет оценку.</p>
            )}
          </>
        ) : (
          <div className="rounded-2xl border border-line bg-panel p-5 text-sm text-zinc-300">
            <Link href="/login" className="text-accent hover:underline">
              Войдите
            </Link>
            , чтобы оценить релиз, написать рецензию и отметить любимые треки.
          </div>
        )}
      </aside>
    </div>
  );
}

function HiddenFields({ values }: { values: Record<string, string> }) {
  return Object.entries(values).map(([k, v]) => <input key={k} type="hidden" name={k} value={v} />);
}

function plural(n: number, one: string, few: string, many: string) {
  const m10 = n % 10;
  const m100 = n % 100;
  if (m10 === 1 && m100 !== 11) return one;
  if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return few;
  return many;
}
