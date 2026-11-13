"use client";

export default function ReleaseError({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="mx-auto max-w-md rounded-2xl bg-panel p-6 text-center">
      <h1 className="text-xl font-bold">Не удалось загрузить релиз</h1>
      <p className="mt-2 text-sm text-muted">
        MusicBrainz сейчас перегружен. Подождите пару секунд и попробуйте ещё раз.
      </p>
      <button
        onClick={reset}
        className="mt-4 rounded-full bg-accent px-5 py-2 font-semibold text-black hover:bg-accent-hover"
      >
        Повторить
      </button>
    </div>
  );
}
