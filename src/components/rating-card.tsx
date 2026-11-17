import Link from "next/link";
import { formatDate } from "@/lib/format";
import type { RatingWithRelease } from "@/lib/types";
import { Cover } from "./cover";
import { Score } from "./release";

export function RatingCard({ rating, showCover = true }: { rating: RatingWithRelease; showCover?: boolean }) {
  return (
    <article className="flex gap-4 rounded-2xl border border-line bg-surface p-4 transition-shadow hover:shadow-[var(--shadow-card)]">
      {showCover && (
        <Link href={`/release/${rating.mbid}`} className="shrink-0">
          <Cover mbid={rating.mbid} title={rating.title} size="sm" />
        </Link>
      )}
      <div className="min-w-0 flex-1">
        <Link href={`/release/${rating.mbid}`} className="group block">
          <div className="truncate text-[15px] font-medium leading-tight group-hover:text-accent">
            {rating.title}
          </div>
          <div className="truncate text-[13px] text-muted">{rating.artist}</div>
        </Link>
        {rating.review && (
          <p className="mt-2 line-clamp-3 whitespace-pre-line text-[13px] leading-relaxed text-muted">
            {rating.review}
          </p>
        )}
        <div className="mt-1.5 text-[11px] text-muted">{formatDate(rating.updated_at)}</div>
      </div>
      <div className="shrink-0 text-right">
        <Score value={rating.score} className="text-[26px] leading-none" />
        <div className="mt-1 text-[10px] uppercase tracking-wide text-muted">из 90</div>
      </div>
    </article>
  );
}
