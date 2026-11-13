import Link from "next/link";
import { Avatar, Score } from "./release";
import { Cover } from "./cover";

export type RatingWithJoins = {
  score: number;
  review: string | null;
  updated_at: string;
  profiles: { username: string; display_name: string | null; avatar_url: string | null } | null;
  releases: { mbid: string; title: string; artist: string } | null;
};

export const RATING_SELECT =
  "score, review, updated_at, profiles(username, display_name, avatar_url), releases(mbid, title, artist)";

const dateFmt = new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "long", year: "numeric" });

export function RatingCard({ rating, showRelease = true }: { rating: RatingWithJoins; showRelease?: boolean }) {
  const user = rating.profiles;
  const release = rating.releases;
  if (!user || !release) return null;
  return (
    <article className="flex gap-4 rounded-xl border border-line bg-panel p-4">
      {showRelease && (
        <Link href={`/release/${release.mbid}`}>
          <Cover mbid={release.mbid} title={release.title} size="sm" />
        </Link>
      )}
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 text-sm">
          <Link href={`/u/${user.username}`} className="flex items-center gap-2 font-medium hover:text-accent">
            <Avatar name={user.display_name || user.username} url={user.avatar_url} />
            {user.display_name || user.username}
          </Link>
          {showRelease && (
            <>
              <span className="text-muted">оценил(а)</span>
              <Link href={`/release/${release.mbid}`} className="font-medium hover:text-accent">
                {release.artist} — {release.title}
              </Link>
            </>
          )}
          <span className="text-xs text-muted">{dateFmt.format(new Date(rating.updated_at))}</span>
        </div>
        {rating.review && (
          <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-zinc-300">{rating.review}</p>
        )}
      </div>
      <Score value={rating.score} className="text-2xl" />
    </article>
  );
}
