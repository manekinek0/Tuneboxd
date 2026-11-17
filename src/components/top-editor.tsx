"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { saveTop } from "@/lib/actions/ratings";
import { ChevronDownIcon, ChevronUpIcon, PlusIcon, SearchIcon, XIcon } from "./icons";
import { Cover } from "./cover";
import { Rank } from "./release";

type Item = { id: string; mbid: string; title: string; artist: string; score: number | null };

export function TopEditor({ initial, candidates }: { initial: Item[]; candidates: Item[] }) {
  const [items, setItems] = useState(initial);
  const [filter, setFilter] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const available = useMemo(() => {
    const chosen = new Set(items.map((i) => i.id));
    const q = filter.trim().toLowerCase();
    return candidates.filter(
      (c) => !chosen.has(c.id) && (!q || `${c.artist} ${c.title}`.toLowerCase().includes(q)),
    );
  }, [items, candidates, filter]);

  const move = (from: number, to: number) => {
    if (to < 0 || to >= items.length) return;
    const next = [...items];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    setItems(next);
    setStatus(null);
  };

  const save = () =>
    startTransition(async () => {
      const result = await saveTop(items.map((i) => i.id));
      setStatus(result?.error ?? result?.message ?? "Топ сохранён");
    });

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <section className="rounded-2xl border border-line bg-surface p-4">
        <div className="flex items-baseline justify-between">
          <h2 className="text-[17px] font-semibold">Мой топ</h2>
          <span className="text-[12px] text-muted">{items.length} из 10</span>
        </div>

        <ol className="mt-3 space-y-1.5">
          {items.map((item, i) => (
            <li key={item.id} className="flex items-center gap-2 rounded-xl bg-fill/50 p-2">
              <Rank value={i + 1} />
              <Cover mbid={item.mbid} title={item.title} size="xs" />
              <div className="min-w-0 flex-1">
                <div className="truncate text-[13px] font-medium leading-tight">{item.title}</div>
                <div className="truncate text-[11px] text-muted">{item.artist}</div>
              </div>
              {item.score != null && (
                <span className="text-[13px] font-semibold tabular-nums text-accent">{item.score}</span>
              )}
              <button
                type="button"
                aria-label="Выше"
                onClick={() => move(i, i - 1)}
                disabled={i === 0}
                className="flex h-7 w-7 items-center justify-center rounded-full text-muted hover:bg-fill hover:text-ink disabled:opacity-25"
              >
                <ChevronUpIcon className="h-4 w-4" />
              </button>
              <button
                type="button"
                aria-label="Ниже"
                onClick={() => move(i, i + 1)}
                disabled={i === items.length - 1}
                className="flex h-7 w-7 items-center justify-center rounded-full text-muted hover:bg-fill hover:text-ink disabled:opacity-25"
              >
                <ChevronDownIcon className="h-4 w-4" />
              </button>
              <button
                type="button"
                aria-label="Убрать"
                onClick={() => {
                  setItems(items.filter((x) => x.id !== item.id));
                  setStatus(null);
                }}
                className="flex h-7 w-7 items-center justify-center rounded-full text-muted hover:bg-fill hover:text-accent"
              >
                <XIcon className="h-4 w-4" />
              </button>
            </li>
          ))}
          {!items.length && (
            <li className="rounded-xl border border-dashed border-line px-4 py-8 text-center text-[13px] text-muted">
              Добавьте релизы из списка справа.
            </li>
          )}
        </ol>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button
            onClick={save}
            disabled={pending}
            className="rounded-full bg-accent px-4 py-2 text-[13px] font-semibold text-white transition-colors hover:bg-accent-hover disabled:opacity-50"
          >
            {pending ? "Сохраняю…" : "Сохранить"}
          </button>
          <Link href="/" className="text-[13px] text-muted hover:text-ink">
            К обзору
          </Link>
          {status && <span className="text-[12px] text-muted">{status}</span>}
        </div>
      </section>

      <section className="rounded-2xl border border-line bg-surface p-4">
        <h2 className="text-[17px] font-semibold">Прослушанные релизы</h2>
        <div className="relative mt-3">
          <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <input
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Фильтр"
            className="w-full rounded-full border border-transparent bg-fill py-2 pl-9 pr-3 text-[13px] outline-none focus:border-accent/50 focus:bg-bg"
          />
        </div>
        <ul className="mt-3 max-h-[55vh] space-y-1 overflow-y-auto pr-1">
          {available.map((c) => (
            <li key={c.id} className="flex items-center gap-2 rounded-xl px-2 py-1.5 hover:bg-fill/60">
              <Cover mbid={c.mbid} title={c.title} size="xs" />
              <div className="min-w-0 flex-1">
                <div className="truncate text-[13px] leading-tight">{c.title}</div>
                <div className="truncate text-[11px] text-muted">{c.artist}</div>
              </div>
              {c.score != null && (
                <span className="text-[13px] font-semibold tabular-nums text-accent">{c.score}</span>
              )}
              <button
                type="button"
                aria-label={`Добавить «${c.title}» в топ`}
                disabled={items.length >= 10}
                onClick={() => {
                  setItems([...items, c]);
                  setStatus(null);
                }}
                className="flex h-7 w-7 items-center justify-center rounded-full border border-line text-muted hover:border-accent hover:text-accent disabled:opacity-25"
              >
                <PlusIcon className="h-4 w-4" />
              </button>
            </li>
          ))}
          {!available.length && (
            <li className="px-2 py-8 text-center text-[13px] text-muted">
              Нет доступных релизов. Найдите музыку в поиске и отметьте её прослушанной.
            </li>
          )}
        </ul>
      </section>
    </div>
  );
}
