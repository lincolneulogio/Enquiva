export function DashboardRouteLoading() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Cargando panel">
      <div className="h-8 w-48 max-w-full animate-pulse rounded-lg bg-muted" />
      <div className="h-4 w-72 max-w-full animate-pulse rounded bg-muted/70" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="h-28 animate-pulse rounded-2xl border border-border bg-card/60"
          />
        ))}
      </div>
      <div className="h-64 animate-pulse rounded-2xl border border-border bg-card/50" />
    </div>
  );
}
