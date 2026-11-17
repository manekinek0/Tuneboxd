import type { Metadata } from "next";
import { TopEditor } from "@/components/top-editor";
import { getTopCandidates, getTopReleases } from "@/lib/queries";

export const metadata: Metadata = { title: "Топ-10" };

export default async function TopPage() {
  const [top, candidates] = await Promise.all([getTopReleases(), getTopCandidates()]);

  const initial = top.map((entry) => ({
    id: entry.release.id,
    mbid: entry.release.mbid,
    title: entry.release.title,
    artist: entry.release.artist,
    score: entry.score,
  }));

  return (
    <div className="space-y-6">
      <header>
        <p className="text-[13px] text-muted">Коллекция</p>
        <h1 className="mt-0.5 text-[34px] font-semibold tracking-tight">Топ-10</h1>
        <p className="mt-1 text-[13px] text-muted">
          Главные релизы всех времён. Порядок можно менять стрелками.
        </p>
      </header>

      <TopEditor initial={initial} candidates={candidates} />
    </div>
  );
}
