"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { syncLastfmAction } from "@/lib/actions/lastfm";
import { formatDate } from "@/lib/format";
import type { SyncResult } from "@/lib/types";
import { LastfmIcon, RefreshIcon } from "./icons";

const PERIODS = [
  { value: 1, label: "Сутки" },
  { value: 7, label: "Неделя" },
  { value: 30, label: "Месяц" },
];

export function LastfmSync({ lastSync }: { lastSync?: string }) {
  const [period, setPeriod] = useState(1);
  const [result, setResult] = useState<SyncResult | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const run = () =>
    startTransition(async () => {
      const response = await syncLastfmAction(period);
      setResult(response);
      router.refresh();
    });

  return (
    <div className="rounded-2xl border border-line bg-surface p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-[17px] font-semibold">Импорт из Last.fm</h2>
          <p className="mt-1 max-w-md text-[13px] leading-relaxed text-muted">
            Заберёт альбомы из твоих скробблов и добавит их в дневник как прослушанные — останется
            только поставить оценки.
          </p>
        </div>
        <LastfmIcon className="h-7 w-7 shrink-0 text-accent" />
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <div className="inline-flex rounded-xl bg-fill p-0.5">
          {PERIODS.map((p) => (
            <button
              key={p.value}
              type="button"
              onClick={() => setPeriod(p.value)}
              className={`rounded-[9px] px-3 py-1.5 text-[12px] font-medium transition-colors ${
                period === p.value ? "bg-surface text-ink shadow-sm" : "text-muted hover:text-ink"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={run}
          disabled={pending}
          className="inline-flex items-center gap-2 rounded-full bg-accent px-4 py-2 text-[13px] font-semibold text-white transition-colors hover:bg-accent-hover disabled:opacity-50"
        >
          <RefreshIcon className={`h-4 w-4 ${pending ? "animate-spin" : ""}`} />
          {pending ? "Синхронизирую…" : "Синхронизировать"}
        </button>
      </div>

      {lastSync && (
        <p className="mt-2 text-[11px] text-muted">Последняя синхронизация: {formatDate(lastSync)}</p>
      )}

      {result && (
        <div
          className={`mt-3 rounded-xl px-3 py-2 text-[12px] leading-relaxed ${
            result.ok ? "bg-positive/10 text-ink" : "bg-accent-soft text-ink"
          }`}
        >
          {result.message}
        </div>
      )}

      <p className="mt-3 text-[11px] text-muted">
        Импорт идёт с ограничением MusicBrainz — примерно 1 альбом в секунду, максимум 8 новых за
        раз. Если альбомов больше, нажми кнопку ещё раз.
      </p>
    </div>
  );
}
