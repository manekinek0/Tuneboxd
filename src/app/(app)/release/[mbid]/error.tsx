"use client";

import { RefreshIcon } from "@/components/icons";

export default function ReleaseError({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="mx-auto max-w-md rounded-2xl border border-line bg-surface p-8 text-center">
      <h1 className="text-[20px] font-semibold">Не удалось загрузить релиз</h1>
      <p className="mt-2 text-[13px] leading-relaxed text-muted">
        MusicBrainz сейчас перегружен. Подождите пару секунд и попробуйте ещё раз.
      </p>
      <button
        onClick={reset}
        className="mt-5 inline-flex items-center gap-2 rounded-full bg-accent px-4 py-2 text-[13px] font-semibold text-white transition-colors hover:bg-accent-hover"
      >
        <RefreshIcon className="h-4 w-4" /> Повторить
      </button>
    </div>
  );
}
