import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { toggleFollow } from "@/app/actions";
import { Avatar, ReleaseTile, Score } from "@/components/release";
import { Cover } from "@/components/cover";
import { createClient, getViewer } from "@/lib/supabase/server";

const PAGE = 30;

export async function generateMetadata({ params }: PageProps<"/u/[username]">): Promise<Metadata> {
  return { title: `@${(await params).username}` };
}

type Release = { id: string; mbid: string; title: string; artist: string; release_date: string | null };

export default async function ProfilePage({ params, searchParams }: PageProps<"/u/[username]">) {
  const { username } = await params;
  const { show, sort } = await searchParams;
  const limit = Math.min(Math.max(Number(show) || PAGE, PAGE), 5000);
  const sortBy = sort === "score" ? "score" : "date";

  const supabase = await createClient();
  const viewer = await getViewer();
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, username, display_name, bio, avatar_url")
    .eq("username", username)
    .maybeSingle();
  if (!profile) notFound();

  const isMe = viewer?.id === profile.id;

  const [top, listens, ratings, followers, following, amFollowing] = await Promise.all([
    supabase
      .from("top_releases")
      .select("position, releases(id, mbid, title, artist, release_date)")
      .eq("user_id", profile.id)
      .order("position"),
    supabase
      .from("listens")
      .select("created_at, releases(id, mbid, title, artist, release_date)", { count: "exact" })
      .eq("user_id", profile.id)
      .order("created_at", { ascending: false })
      .limit(5000),
    supabase
      .from("ratings")
      .select("release_id, score, review")
      .eq("user_id", profile.id),
    supabase.from("follows").select("*", { count: "exact", head: true }).eq("following_id", profile.id),
    supabase.from("follows").select("*", { count: "exact", head: true }).eq("follower_id", profile.id),
    viewer && !isMe
      ? supabase
          .from("follows")
          .select("follower_id")
          .eq("follower_id", viewer.id)
          .eq("following_id", profile.id)
          .maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  const ratingMap = new Map((ratings.data ?? []).map((r) => [r.release_id, r]));
  let listened = (listens.data ?? [])
    .map((l) => ({ release: l.releases as unknown as Release, rating: ratingMap.get((l.releases as unknown as Release).id) }))
    .filter((l) => l.release);
  if (sortBy === "score") {
    listened = listened.sort((a, b) => (b.rating?.score ?? -1) - (a.rating?.score ?? -1));
  }
  const total = listens.count ?? listened.length;
  const shown = listened.slice(0, limit);
  const avg = ratings.data?.length
    ? ratings.data.reduce((s, r) => s + r.score, 0) / ratings.data.length
    : null;

  const topItems = (top.data ?? []).map((t) => ({
    position: t.position,
    release: t.releases as unknown as Release,
  }));

  const qs = (extra: Record<string, string | number>) =>
    "?" + new URLSearchParams({ ...(sortBy === "score" ? { sort: "score" } : {}), ...Object.fromEntries(Object.entries(extra).map(([k, v]) => [k, String(v)])) }).toString();

  return (
    <div className="space-y-12">
      <section className="flex flex-col gap-6 sm:flex-row sm:items-center">
        <Avatar name={profile.display_name || profile.username} url={profile.avatar_url} size={20} />
        <div className="flex-1">
          <h1 className="text-2xl font-extrabold">{profile.display_name || profile.username}</h1>
          <div className="text-sm text-zinc-400">@{profile.username}</div>
          {profile.bio && <p className="mt-2 max-w-xl whitespace-pre-line text-sm text-zinc-300">{profile.bio}</p>}
        </div>
        <dl className="flex gap-6 text-center">
          <Stat label="Прослушано" value={total} />
          <Stat label="Оценок" value={ratings.data?.length ?? 0} />
          <div>
            <Score value={avg} className="text-xl" />
            <div className="text-xs text-zinc-500">Средний балл</div>
          </div>
          <Stat label="Подписчики" value={followers.count ?? 0} />
          <Stat label="Подписки" value={following.count ?? 0} />
        </dl>
        {viewer && !isMe && (
          <form action={toggleFollow}>
            <input type="hidden" name="profile_id" value={profile.id} />
            <input type="hidden" name="username" value={profile.username} />
            <input type="hidden" name="following" value={amFollowing.data ? "1" : "0"} />
            <button
              className={
                amFollowing.data
                  ? "rounded-lg border border-line px-4 py-2 text-sm hover:border-red-500"
                  : "rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-500"
              }
            >
              {amFollowing.data ? "Отписаться" : "Подписаться"}
            </button>
          </form>
        )}
        {isMe && (
          <Link href="/settings" className="rounded-lg border border-line px-4 py-2 text-sm hover:border-violet-500">
            Редактировать
          </Link>
        )}
      </section>

      <section>
        <div className="mb-4 flex items-baseline justify-between">
          <h2 className="text-lg font-bold">Топ-10 релизов всех времён</h2>
          {isMe && (
            <Link href="/settings/top" className="text-sm text-violet-300 hover:underline">
              Изменить топ
            </Link>
          )}
        </div>
        {topItems.length ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
            {topItems.map((t) => (
              <ReleaseTile
                key={t.position}
                release={t.release}
                badge={`#${t.position}`}
                score={ratingMap.get(t.release.id)?.score ?? null}
              />
            ))}
          </div>
        ) : (
          <p className="text-sm text-zinc-500">
            {isMe ? "Вы ещё не собрали свой топ-10." : "Топ-10 пока пуст."}
          </p>
        )}
      </section>

      <section>
        <div className="mb-4 flex items-baseline justify-between">
          <h2 className="text-lg font-bold">Прослушанные релизы · {total}</h2>
          <div className="flex gap-3 text-sm">
            <Link href={`?show=${limit}`} className={sortBy === "date" ? "text-violet-300" : "text-zinc-400"}>
              По дате
            </Link>
            <Link href={`?sort=score&show=${limit}`} className={sortBy === "score" ? "text-violet-300" : "text-zinc-400"}>
              По баллу
            </Link>
          </div>
        </div>
        {shown.length ? (
          <ul className="divide-y divide-line rounded-xl border border-line bg-panel">
            {shown.map(({ release, rating }) => (
              <li key={release.id}>
                <Link href={`/release/${release.mbid}`} className="flex items-center gap-4 px-4 py-2.5 hover:bg-white/5">
                  <Cover mbid={release.mbid} title={release.title} size="sm" />
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-medium">{release.title}</div>
                    <div className="truncate text-sm text-zinc-400">
                      {release.artist}
                      {release.release_date && ` · ${release.release_date.slice(0, 4)}`}
                    </div>
                  </div>
                  {rating?.review && <span className="text-xs text-zinc-500" title="Есть рецензия">✎</span>}
                  <Score value={rating?.score ?? null} className="w-10 text-right text-xl" />
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-zinc-500">Пока ничего не прослушано.</p>
        )}
        {total > shown.length && (
          <Link
            href={qs({ show: limit + PAGE })}
            scroll={false}
            className="mt-4 inline-block rounded-lg border border-line px-4 py-2 text-sm hover:border-violet-500"
          >
            Показать ещё ({total - shown.length})
          </Link>
        )}
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="text-xl font-bold tabular-nums">{value}</div>
      <div className="text-xs text-zinc-500">{label}</div>
    </div>
  );
}
