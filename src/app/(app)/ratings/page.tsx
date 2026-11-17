import type { Metadata } from "next";
import { RatingsBrowser } from "@/components/ratings-browser";
import { getAllRatings } from "@/lib/queries";

export const metadata: Metadata = { title: "Рейтинг" };

export default async function RatingsPage() {
  const ratings = await getAllRatings();
  const avg = ratings.length
    ? Math.round(ratings.reduce((sum, rating) => sum + rating.score, 0) / ratings.length)
    : null;

  return (
    <div className="space-y-6">
      <header>
        <p className="text-[13px] text-muted">Коллекция</p>
        <h1 className="mt-0.5 text-[34px] font-semibold tracking-tight">Рейтинг</h1>
        <p className="mt-1 text-[13px] text-muted">
          Все релизы, которым вы когда-либо поставили оценку.
        </p>
      </header>

      <div className="flex flex-wrap items-baseline gap-x-8 gap-y-3 rounded-2xl border border-line bg-surface px-5 py-4">
        <div>
          <span className="text-[26px] font-semibold tabular-nums">{ratings.length}</span>
          <span className="ml-1.5 text-[12px] text-muted">оценено</span>
        </div>
        <div>
          <span className="text-[26px] font-semibold tabular-nums text-accent">{avg ?? "—"}</span>
          <span className="ml-1.5 text-[12px] text-muted">средний балл</span>
        </div>
        <div>
          <span className="text-[26px] font-semibold tabular-nums">
            {ratings.filter((r) => r.review).length}
          </span>
          <span className="ml-1.5 text-[12px] text-muted">с рецензией</span>
        </div>
      </div>

      <RatingsBrowser ratings={ratings} />
    </div>
  );
}
