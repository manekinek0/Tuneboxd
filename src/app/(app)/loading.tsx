/**
 * Route-level fallback shown during client-side navigation. A thin accent bar
 * at the top plus neutral skeletons makes the transition feel immediate.
 */
export default function AppLoading() {
  return (
    <div aria-busy="true" aria-live="polite" className="space-y-7">
      <span className="sr-only">Загрузка…</span>
      <div className="pointer-events-none fixed inset-x-0 top-0 z-50 h-[2px] overflow-hidden lg:left-[260px]">
        <div className="tb-progress-bar h-full rounded-full bg-accent" />
      </div>

      <div className="animate-pulse space-y-7">
        <div className="space-y-2.5">
          <div className="h-3 w-20 rounded-full bg-fill" />
          <div className="h-9 w-64 max-w-full rounded-xl bg-fill" />
          <div className="h-3 w-80 max-w-full rounded-full bg-fill" />
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="h-[92px] rounded-2xl border border-line bg-surface"
            />
          ))}
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="h-44 rounded-2xl border border-line bg-surface" />
          ))}
        </div>
      </div>
    </div>
  );
}
