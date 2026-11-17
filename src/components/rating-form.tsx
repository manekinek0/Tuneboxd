"use client";

import { useActionState, useState } from "react";
import { saveRating } from "@/lib/actions/ratings";
import type { ActionState } from "@/lib/action-state";
import {
  BASE_FACTOR,
  CRITERIA,
  VIBE,
  computeScore,
  scoreColor,
  vibeMultiplier,
  type CriterionKey,
  type Scores,
} from "@/lib/score";

const ALL = [...CRITERIA, VIBE];
const TICKS = Array.from({ length: 10 }, (_, i) => i + 1);

/** Horizontal position of value v (1..10) under a 26px thumb. */
const pos = (v: number) => `calc(13px + (100% - 26px) * ${(v - 1) / 9})`;

function Criterion({
  index,
  label,
  name,
  value,
  onChange,
}: {
  index: number;
  label: string;
  name: CriterionKey;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="py-3">
      <div className="flex items-baseline justify-between gap-4">
        <label htmlFor={`c-${name}`} className="text-[14px] font-medium">
          <span className="mr-2 text-[12px] tabular-nums text-muted">{String(index).padStart(2, "0")}</span>
          {label}
        </label>
        <span className="text-[17px] font-semibold tabular-nums text-accent">{value}</span>
      </div>
      <input
        id={`c-${name}`}
        type="range"
        name={name}
        min={1}
        max={10}
        step={1}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="slider mt-1"
        style={{ "--c": "var(--accent)", "--fill": pos(value) } as React.CSSProperties}
      />
      <div className="relative h-4" aria-hidden>
        {TICKS.map((t) => (
          <button
            key={t}
            type="button"
            tabIndex={-1}
            onClick={() => onChange(t)}
            className={`absolute top-0 -translate-x-1/2 px-1 text-[10px] tabular-nums ${
              t === value ? "font-semibold text-accent" : "text-muted/60 hover:text-ink"
            }`}
            style={{ left: pos(t) }}
          >
            {t}
          </button>
        ))}
      </div>
    </div>
  );
}

export function RatingForm({
  releaseId,
  mbid,
  initial,
}: {
  releaseId: string;
  mbid: string;
  initial: (Scores & { review: string | null }) | null;
}) {
  const [scores, setScores] = useState<Scores>(
    initial ?? { rhymes: 5, structure: 5, style: 5, individuality: 5, vibe: 5 },
  );
  const [state, action, pending] = useActionState<ActionState, FormData>(saveRating, undefined);
  const base = scores.rhymes + scores.structure + scores.style + scores.individuality;
  const total = computeScore(scores);

  return (
    <form action={action} className="rounded-2xl border border-line bg-surface p-5 lg:p-6">
      <input type="hidden" name="release_id" value={releaseId} />
      <input type="hidden" name="mbid" value={mbid} />

      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-[17px] font-semibold">Моя оценка</h2>
          <p className="mt-0.5 text-[12px] text-muted">5 критериев · шкала из 90</p>
        </div>
        <div className="text-right">
          <div className={`text-[44px] font-semibold leading-none tabular-nums ${scoreColor(total)}`}>{total}</div>
          <div className="mt-1 text-[10px] uppercase tracking-wide text-muted">из 90</div>
        </div>
      </div>

      <div className="mt-4 divide-y divide-line border-y border-line">
        {ALL.map((c, i) => (
          <Criterion
            key={c.key}
            index={i + 1}
            label={c.label}
            name={c.key}
            value={scores[c.key]}
            onChange={(v) => setScores((s) => ({ ...s, [c.key]: v }))}
          />
        ))}
      </div>

      <p className="mt-3 text-center text-[11px] text-muted">
        <span className="text-ink">{base}</span> × {BASE_FACTOR} ×{" "}
        <span className="text-accent">{vibeMultiplier(scores.vibe).toFixed(4)}</span> ={" "}
        <span className="font-semibold text-ink">{total}</span>
      </p>

      <label className="mt-4 block">
        <span className="text-[13px] font-medium">Рецензия</span>
        <textarea
          name="review"
          defaultValue={initial?.review ?? ""}
          rows={5}
          maxLength={10000}
          placeholder="Что зацепило, а что нет? Необязательно."
          className="mt-1.5 w-full resize-y rounded-xl border border-line bg-bg p-3 text-[13px] leading-relaxed outline-none transition-colors focus:border-accent"
        />
      </label>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button
          disabled={pending}
          className="rounded-full bg-accent px-5 py-2 text-[14px] font-semibold text-white transition-colors hover:bg-accent-hover disabled:opacity-50"
        >
          {pending ? "Сохраняю…" : initial ? "Обновить оценку" : "Сохранить оценку"}
        </button>
        {state?.ok && (
          <span className="flex items-center gap-1 text-[13px] text-positive">Сохранено</span>
        )}
        {state?.error && <span className="text-[13px] text-accent">{state.error}</span>}
      </div>
    </form>
  );
}
