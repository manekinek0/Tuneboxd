import type { Metadata } from "next";
import Link from "next/link";
import { Cover } from "@/components/cover";
import { searchReleaseGroups, typeLabel } from "@/lib/musicbrainz";

export const metadata: Metadata = { title: "Поиск" };

export default async function SearchPage({ searchParams }: PageProps<"/search">) {
  const { q } = await searchParams;
  const query = typeof q === "string" ? q.trim() : "";

  let results: Awaited<ReturnType<typeof searchReleaseGroups>> = [];
  let failed = false;
  if (query) {
    try {
      results = await searchReleaseGroups(query);
    } catch {
      failed = true;
    }
  }

  return (
    <div>
      <form className="mb-8 flex gap-2">
        <input
          name="q"
          defaultValue={query}
          autoFocus
          placeholder="Артист, альбом или сингл"
          className="flex-1 rounded-lg border border-line bg-panel px-4 py-2.5 outline-none focus:border-violet-500"
        />
        <button className="rounded-lg bg-violet-600 px-5 font-medium text-white hover:bg-violet-500">Найти</button>
      </form>

      {failed && <p className="text-red-400">MusicBrainz сейчас не отвечает, попробуйте ещё раз.</p>}
      {query && !failed && results.length === 0 && <p className="text-zinc-400">Ничего не нашлось.</p>}

      <div className="grid gap-3 sm:grid-cols-2">
        {results.map((r) => (
          <Link
            key={r.mbid}
            href={`/release/${r.mbid}`}
            className="flex items-center gap-4 rounded-xl border border-line bg-panel p-3 hover:border-violet-500"
          >
            <Cover mbid={r.mbid} title={r.title} size="sm" />
            <div className="min-w-0">
              <div className="truncate font-medium">{r.title}</div>
              <div className="truncate text-sm text-zinc-400">{r.artist}</div>
              <div className="text-xs text-zinc-500">
                {typeLabel(r.primaryType, r.secondaryTypes)}
                {r.releaseDate && ` · ${r.releaseDate.slice(0, 4)}`}
              </div>
            </div>
          </Link>
        ))}
      </div>
      {!query && (
        <p className="text-sm text-zinc-500">
          Каталог релизов берётся из открытой базы MusicBrainz.
        </p>
      )}
    </div>
  );
}
