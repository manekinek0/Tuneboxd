"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { saveTop } from "@/app/actions";

type Item = { id: string; mbid: string; title: string; artist: string; score: number | null };

export function TopEditor({ initial, candidates, username }: { initial: Item[]; candidates: Item[]; username: string }) {
  const [items, setItems] = useState(initial);
  const [filter, setFilter] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const available = useMemo(() => {
    const chosen = new Set(items.map((i) => i.id));
    const f = filter.toLowerCase();
    return candidates.filter(
      (c) => !chosen.has(c.id) && (!f || `${c.artist} ${c.title}`.toLowerCase().includes(f)),
    );
  }, [items, candidates, filter]);

  const move = (from: number, to: number) => {
    if (to < 0 || to >= items.length) return;
    const next = [...items];
    const [x] = next.splice(from, 1);
    next.splice(to, 0, x);
    setItems(next);
    setStatus(null);
  };

  const save = () =>
    startTransition(async () => {
      const res = await saveTop(items.map((i) => i.id));
      setStatus(res?.error ?? "Топ сохранён");
    });

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <section>
        <h2 className="mb-3 font-bold">Мой топ · {items.length}/10</h2>
        <ol className="space-y-2">
          {items.map((item, i) => (
            <li key={item.id} className="flex items-center gap-3 rounded-lg border border-line bg-panel px-3 py-2">
              <span className="w-6 text-right font-bold tabular-nums text-violet-300">{i + 1}</span>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium">{item.title}</div>
                <div className="truncate text-xs text-zinc-400">{item.artist}</div>
              </div>
              <button type="button" aria-label="Выше" onClick={() => move(i, i - 1)} disabled={i === 0} className="px-1 text-zinc-400 hover:text-white disabled:opacity-30">
                ↑
              </button>
              <button type="button" aria-label="Ниже" onClick={() => move(i, i + 1)} disabled={i === items.length - 1} className="px-1 text-zinc-400 hover:text-white disabled:opacity-30">
                ↓
              </button>
              <button
                type="button"
                aria-label="Убрать"
                onClick={() => {
                  setItems(items.filter((x) => x.id !== item.id));
                  setStatus(null);
                }}
                className="px-1 text-zinc-500 hover:text-red-400"
              >
                ✕
              </button>
            </li>
          ))}
          {items.length === 0 && <li className="text-sm text-zinc-500">Добавьте релизы из списка справа.</li>}
        </ol>
        <div className="mt-4 flex items-center gap-3">
          <button
            onClick={save}
            disabled={pending}
            className="rounded-lg bg-violet-600 px-4 py-2 font-medium text-white hover:bg-violet-500 disabled:opacity-60"
          >
            {pending ? "Сохраняю…" : "Сохранить"}
          </button>
          <Link href={`/u/${username}`} className="text-sm text-zinc-400 hover:text-zinc-200">
            К профилю
          </Link>
          {status && <span className="text-sm text-zinc-300">{status}</span>}
        </div>
      </section>

      <section>
        <h2 className="mb-3 font-bold">Прослушанные релизы</h2>
        <input
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="Фильтр"
          className="mb-3 w-full rounded-lg border border-line bg-panel px-3 py-1.5 text-sm outline-none focus:border-violet-500"
        />
        <ul className="max-h-[60vh] space-y-1 overflow-y-auto">
          {available.map((c) => (
            <li key={c.id} className="flex items-center gap-3 rounded-lg px-3 py-1.5 hover:bg-white/5">
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm">{c.title}</div>
                <div className="truncate text-xs text-zinc-400">{c.artist}</div>
              </div>
              {c.score != null && <span className="text-sm font-bold text-violet-300">{c.score}</span>}
              <button
                type="button"
                disabled={items.length >= 10}
                onClick={() => {
                  setItems([...items, c]);
                  setStatus(null);
                }}
                className="rounded border border-line px-2 text-sm hover:border-violet-500 disabled:opacity-30"
              >
                +
              </button>
            </li>
          ))}
          {available.length === 0 && (
            <li className="text-sm text-zinc-500">
              Нет релизов. Найдите релиз через поиск и отметьте его прослушанным или оцените.
            </li>
          )}
        </ul>
      </section>
    </div>
  );
}
