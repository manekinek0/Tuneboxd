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
  type Scores,
} from "@/lib/score";

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
    <form action={action} className="space-y-5 rounded-2xl border border-line bg-panel p-5">
      <input type="hidden" name="release_id" value={releaseId} />
      <input type="hidden" name="mbid" value={mbid} />

      <div className="flex items-center justify-between rounded-xl bg-black/30 px-4 py-3">
        <div className="flex gap-3">
          {[...CRITERIA, VIBE].map((c, i) => (
            <div key={c.key} className="text-center">
              <div className="text-[10px] text-zinc-500">{i + 1}</div>
              <div className={`text-xl font-bold tabular-nums ${c.key === "vibe" ? "text-violet-400" : "text-blue-400"}`}>
                {scores[c.key]}
              </div>
            </div>
          ))}
        </div>
        <div className={`text-5xl font-extrabold tabular-nums ${scoreColor(total)}`}>{total}</div>
      </div>

      <div className="space-y-3">
        {[...CRITERIA, VIBE].map((c, i) => (
          <label key={c.key} className="block">
            <div className="flex justify-between text-sm">
              <span className={c.key === "vibe" ? "text-violet-300" : "text-blue-300"}>
                {i + 1}. {c.label}
              </span>
              <span className="tabular-nums text-zinc-400">{scores[c.key]} / 10</span>
            </div>
            <input
              type="range"
              name={c.key}
              min={1}
              max={10}
              step={1}
              value={scores[c.key]}
              onChange={(e) => setScores({ ...scores, [c.key]: Number(e.target.value) })}
              className="w-full"
            />
          </label>
        ))}
      </div>

      <p className="text-xs text-zinc-500">
        <span className="text-blue-300">{base}</span> × {BASE_FACTOR} ×{" "}
        <span className="text-violet-300">{vibeMultiplier(scores.vibe).toFixed(4)}</span> ={" "}
        <span className="text-zinc-300">{total}</span>
      </p>

      <label className="block">
        <span className="text-sm text-zinc-300">Рецензия (необязательно)</span>
        <textarea
          name="review"
          defaultValue={initial?.review ?? ""}
          rows={5}
          maxLength={10000}
          placeholder="Что зацепило, а что нет?"
          className="mt-1 w-full rounded-lg border border-line bg-black/30 p-3 text-sm outline-none focus:border-violet-500"
        />
      </label>

      <div className="flex items-center gap-3">
        <button
          disabled={pending}
          className="rounded-lg bg-violet-600 px-4 py-2 font-medium text-white hover:bg-violet-500 disabled:opacity-60"
        >
          {pending ? "Сохраняю…" : initial ? "Обновить оценку" : "Оценить"}
        </button>
        {state?.ok && <span className="text-sm text-emerald-400">Сохранено</span>}
        {state?.error && <span className="text-sm text-red-400">{state.error}</span>}
      </div>
    </form>
  );
}
