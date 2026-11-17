import Link from "next/link";
import { scoreColor } from "@/lib/score";
import type { ReleaseRow } from "@/lib/types";
import { yearOf } from "@/lib/format";
import { Cover } from "./cover";

export function Score({ value, className = "" }: { value: number | null | undefined; className?: string }) {
  if (value == null) return <span className={`text-muted ${className}`}>—</span>;
  return (
    <span className={`font-semibold tabular-nums ${scoreColor(Number(value))} ${className}`}>
      {Math.round(Number(value))}
    </span>
  );
}

export function ScoreBadge({ value }: { value: number | null | undefined }) {
  if (value == null) return null;
  return (
    <span className="rounded-md bg-black/65 px-1.5 py-0.5 text-[13px] font-semibold tabular-nums text-white backdrop-blur-sm">
      {Math.round(Number(value))}
    </span>
  );
}

export function Rank({ value }: { value: number }) {
  return (
    <span
      className={`inline-block w-7 text-center text-[15px] font-semibold tabular-nums ${
        value <= 3 ? "text-accent" : "text-muted"
      }`}
    >
      {value}
    </span>
  );
}

export function ReleaseTile({
  release,
  score,
  rank,
}: {
  release: Pick<ReleaseRow, "mbid" | "title" | "artist" | "release_date">;
  score?: number | null;
  rank?: number;
}) {
  return (
    <Link href={`/release/${release.mbid}`} className="group block min-w-0">
      <div className="relative transition-transform duration-200 group-hover:-translate-y-0.5">
        <Cover mbid={release.mbid} title={release.title} size="fill" />
        {rank != null && (
          <span className="absolute left-2 top-2 flex h-6 min-w-6 items-center justify-center rounded-md bg-black/55 px-1.5 text-[12px] font-semibold tabular-nums text-white backdrop-blur-sm">
            {rank}
          </span>
        )}
        {score != null && (
          <span className="absolute bottom-2 right-2">
            <ScoreBadge value={score} />
          </span>
        )}
      </div>
      <div className="mt-2 truncate text-[13px] font-medium leading-tight group-hover:text-accent">
        {release.title}
      </div>
      <div className="truncate text-[12px] text-muted">
        {release.artist}
        {release.release_date && ` · ${yearOf(release.release_date)}`}
      </div>
    </Link>
  );
}
