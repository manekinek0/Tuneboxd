import { ChevronRightIcon } from "./icons";
import { getPitchforkRating } from "@/lib/pitchfork";

export function PitchforkCardSkeleton() {
  return (
    <div
      aria-hidden
      className="rounded-2xl border border-line bg-surface p-5"
    >
      <div className="flex animate-pulse items-start justify-between gap-4">
        <div className="space-y-2">
          <div className="h-4 w-24 rounded bg-fill" />
          <div className="h-3 w-20 rounded bg-fill" />
        </div>
        <div className="h-10 w-16 rounded bg-fill" />
      </div>
      <div className="mt-5 h-3 w-32 animate-pulse rounded bg-fill" />
    </div>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return <section className="rounded-2xl border border-line bg-surface p-5">{children}</section>;
}

export async function PitchforkCard({
  releaseId,
  artist,
  title,
}: {
  releaseId: string;
  artist: string;
  title: string;
}) {
  const rating = await getPitchforkRating(releaseId, artist, title);

  if (rating.status === "found") {
    return (
      <Shell>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-[17px] font-semibold">Pitchfork</h2>
            <p className="mt-0.5 text-[12px] text-muted">Оценка издания</p>
          </div>
          <div className="text-right">
            <div className="text-[44px] font-semibold leading-none tabular-nums text-accent">
              {rating.score.toFixed(1)}
            </div>
            <div className="mt-1 text-[10px] uppercase tracking-wide text-muted">из 10</div>
          </div>
        </div>
        {rating.url ? (
          <a
            href={rating.url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 flex items-center justify-between gap-3 border-t border-line pt-3 text-[12px] text-muted transition-colors hover:text-accent"
          >
            Читать рецензию
            <ChevronRightIcon className="h-4 w-4" />
          </a>
        ) : null}
      </Shell>
    );
  }

  if (rating.status === "none") {
    return (
      <Shell>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-[17px] font-semibold">Pitchfork</h2>
            <p className="mt-0.5 text-[12px] text-muted">Оценка издания</p>
          </div>
          <div className="text-[44px] font-semibold leading-none text-muted/50">—</div>
        </div>
        <p className="mt-4 border-t border-line pt-3 text-[12px] leading-relaxed text-muted">
          Pitchfork ещё не рецензировал этот релиз.
        </p>
      </Shell>
    );
  }

  return (
    <Shell>
      <h2 className="text-[17px] font-semibold">Pitchfork</h2>
      <p className="mt-1 text-[12px] leading-relaxed text-muted">
        Не удалось получить оценку. Попробуйте открыть страницу чуть позже.
      </p>
    </Shell>
  );
}
