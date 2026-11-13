import Link from "next/link";
import { scoreColor } from "@/lib/score";
import { Cover } from "./cover";

export type ReleaseRow = {
  id: string;
  mbid: string;
  title: string;
  artist: string;
  release_date: string | null;
};

export function Score({ value, className = "" }: { value: number | null; className?: string }) {
  if (value == null) return <span className={`text-muted ${className}`}>—</span>;
  return <span className={`font-extrabold tabular-nums ${scoreColor(Number(value))} ${className}`}>{Math.round(Number(value))}</span>;
}

export const MEDALS: Record<number, string> = { 1: "🥇", 2: "🥈", 3: "🥉" };

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
    <Link href={`/release/${release.mbid}`} className="group block">
      <div className="relative">
        <Cover mbid={release.mbid} title={release.title} size="fill" />
        {rank != null &&
          (MEDALS[rank] ? (
            <span
              className="emoji absolute -left-2 -top-3 text-4xl drop-shadow-[0_2px_4px_rgb(0_0_0/0.6)]"
              role="img"
              aria-label={`${rank} место`}
            >
              {MEDALS[rank]}
            </span>
          ) : (
            <span className="absolute left-1.5 top-1.5 rounded-md bg-black/70 px-1.5 text-xs font-bold text-white">
              #{rank}
            </span>
          ))}
        {score != null && (
          <span className="absolute bottom-1.5 right-1.5 rounded bg-black/75 px-1.5 text-sm">
            <Score value={score} />
          </span>
        )}
      </div>
      <div className="mt-1.5 truncate text-sm font-medium group-hover:text-accent">{release.title}</div>
      <div className="truncate text-xs text-muted">
        {release.artist}
        {release.release_date && ` · ${release.release_date.slice(0, 4)}`}
      </div>
    </Link>
  );
}

export function Avatar({ name, url, size = 8 }: { name: string; url?: string | null; size?: 8 | 20 }) {
  const cls = size === 20 ? "h-20 w-20 text-3xl" : "h-8 w-8 text-sm";
  if (url) {
    // eslint-disable-next-line @next/next/no-img-element -- OAuth avatar hosts vary
    return <img src={url} alt="" className={`${cls} rounded-full object-cover`} />;
  }
  return (
    <div className={`${cls} flex items-center justify-center rounded-full bg-gradient-to-br from-vibe to-accent font-bold text-white`}>
      {name.slice(0, 1).toUpperCase()}
    </div>
  );
}
