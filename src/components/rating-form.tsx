"use client";

import { useActionState, useState } from "react";
import { saveRating, type ActionState } from "@/app/actions";
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
  vibe,
  onChange,
}: {
  index: number;
  label: string;
  name: CriterionKey;
  value: number;
  vibe: boolean;
  onChange: (v: number) => void;
}) {
  const color = vibe ? "var(--color-vibe)" : "var(--color-accent)";
  return (
    <div className="rounded-xl bg-raised/60 px-4 pb-2 pt-3">
      <div className="flex items-baseline justify-between">
        <label htmlFor={`c-${name}`} className="text-[15px] font-medium">
          <span className="mr-1.5 text-muted">{index}</span>
          {label}
        </label>
        <span className="text-2xl font-bold tabular-nums" style={{ color }}>
          {value}
        </span>
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
        style={{ "--c": color, "--fill": pos(value) } as React.CSSProperties}
      />
      <div className="relative h-5" aria-hidden>
        {TICKS.map((t) => (
          <button
            key={t}
            type="button"
            tabIndex={-1}
            onClick={() => onChange(t)}
            className={`absolute top-0 -translate-x-1/2 px-1 text-[11px] tabular-nums ${
              t === value ? "font-bold" : "text-muted/70 hover:text-zinc-200"
            }`}
            style={{ left: pos(t), color: t === value ? color : undefined }}
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
    <form action={action} className="space-y-4 rounded-2xl bg-panel p-4">
      <input type="hidden" name="release_id" value={releaseId} />
      <input type="hidden" name="mbid" value={mbid} />

      <div className="flex items-center justify-between rounded-xl bg-black/50 px-4 py-3">
        <div className="flex gap-3.5">
          {ALL.map((c, i) => (
            <div key={c.key} className="text-center">
              <div className="text-[10px] text-muted">{i + 1}</div>
              <div className={`text-xl font-bold tabular-nums ${c.key === "vibe" ? "text-vibe" : "text-accent"}`}>
                {scores[c.key]}
              </div>
            </div>
          ))}
        </div>
        <div className={`text-5xl font-extrabold tabular-nums ${scoreColor(total)}`}>{total}</div>
      </div>

      <div className="space-y-2">
        {ALL.map((c, i) => (
          <Criterion
            key={c.key}
            index={i + 1}
            label={c.label}
            name={c.key}
            value={scores[c.key]}
            vibe={c.key === "vibe"}
            onChange={(v) => setScores((s) => ({ ...s, [c.key]: v }))}
          />
        ))}
      </div>

      <p className="text-center text-xs text-muted">
        <span className="text-accent">{base}</span> × {BASE_FACTOR} ×{" "}
        <span className="text-vibe">{vibeMultiplier(scores.vibe).toFixed(4)}</span> ={" "}
        <span className="font-semibold text-zinc-200">{total}</span>
      </p>

      <label className="block">
        <span className="text-sm text-zinc-300">Рецензия (необязательно)</span>
        <textarea
          name="review"
          defaultValue={initial?.review ?? ""}
          rows={5}
          maxLength={10000}
          placeholder="Что зацепило, а что нет?"
          className="mt-1 w-full rounded-xl border border-line bg-black/40 p-3 text-sm outline-none focus:border-accent"
        />
      </label>

      <div className="flex items-center gap-3">
        <button
          disabled={pending}
          className="rounded-full bg-accent px-5 py-2 font-semibold text-black hover:bg-accent-hover disabled:opacity-60"
        >
          {pending ? "Сохраняю…" : initial ? "Обновить оценку" : "Оценить"}
        </button>
        {state?.ok && <span className="text-sm text-success">Сохранено</span>}
        {state?.error && <span className="text-sm text-red-400">{state.error}</span>}
      </div>
    </form>
  );
}
