import Link from "next/link";
import { RATING_SELECT, RatingCard, type RatingWithJoins } from "@/components/rating-card";
import { ReleaseTile } from "@/components/release";
import { createClient, getViewer } from "@/lib/supabase/server";

export default async function Home() {
  const supabase = await createClient();
  const viewer = await getViewer();

  let feed: RatingWithJoins[] | null = null;
  if (viewer) {
    const { data: follows } = await supabase
      .from("follows")
      .select("following_id")
      .eq("follower_id", viewer.id);
    const ids = (follows ?? []).map((f) => f.following_id);
    if (ids.length) {
      const { data } = await supabase
        .from("ratings")
        .select(RATING_SELECT)
        .in("user_id", ids)
        .order("updated_at", { ascending: false })
        .limit(30);
      feed = (data as unknown as RatingWithJoins[]) ?? [];
    } else {
      feed = [];
    }
  }

  const [{ data: recent }, { data: stats }] = await Promise.all([
    supabase.from("ratings").select(RATING_SELECT).order("updated_at", { ascending: false }).limit(10),
    supabase
      .from("release_stats")
      .select("release_id, avg_score, ratings_count")
      .order("avg_score", { ascending: false })
      .order("ratings_count", { ascending: false })
      .limit(12),
  ]);
  const topIds = (stats ?? []).map((s) => s.release_id);
  const { data: topReleases } = topIds.length
    ? await supabase.from("releases").select("id, mbid, title, artist, release_date").in("id", topIds)
    : { data: [] };
  const top = (stats ?? [])
    .map((s) => ({ stat: s, release: topReleases?.find((r) => r.id === s.release_id) }))
    .filter((x) => x.release);

  return (
    <div className="space-y-12">
      {!viewer && (
        <section className="rounded-2xl border border-line bg-gradient-to-br from-rose-950/60 via-orange-950/40 to-amber-950/30 p-8">
          <h1 className="text-3xl font-extrabold">
            Оценивай музыку <span className="accent-text">по 90-балльной шкале</span>
          </h1>
          <p className="mt-3 max-w-2xl text-zinc-300">
            Рифмы, структура, стиль, харизма и вайб. Отмечай любимые треки, пиши рецензии, собирай свой
            топ-10 всех времён и следи за оценками друзей.
          </p>
          <div className="mt-6 flex gap-3">
            <Link href="/login" className="rounded-full bg-accent px-4 py-2 font-semibold text-black hover:bg-accent-hover">
              Начать
            </Link>
            <Link href="/search" className="rounded-lg border border-line px-4 py-2 hover:border-accent">
              Найти релиз
            </Link>
          </div>
        </section>
      )}

      {feed && (
        <section>
          <h2 className="mb-4 text-lg font-bold">Лента подписок</h2>
          {feed.length ? (
            <div className="space-y-3">
              {feed.map((r, i) => (
                <RatingCard key={i} rating={r} />
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted">
              Здесь появятся оценки людей, на которых вы подпишетесь. Найдите их в свежих оценках ниже.
            </p>
          )}
        </section>
      )}

      {top.length > 0 && (
        <section>
          <h2 className="mb-4 text-lg font-bold">Лучшие релизы</h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-6">
            {top.map(({ stat, release }) => (
              <ReleaseTile key={release!.id} release={release!} score={stat.avg_score} />
            ))}
          </div>
        </section>
      )}

      <section>
        <h2 className="mb-4 text-lg font-bold">Свежие оценки</h2>
        {recent?.length ? (
          <div className="space-y-3">
            {(recent as unknown as RatingWithJoins[]).map((r, i) => (
              <RatingCard key={i} rating={r} />
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted">Пока никто ничего не оценил. Будьте первым!</p>
        )}
      </section>
    </div>
  );
}
