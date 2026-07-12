export default function DashboardLoading() {
  return (
    <div className="flex min-h-[50vh] flex-col gap-4 p-6 lg:p-8" aria-busy="true" aria-label="Cargando">
      <div className="h-8 w-48 animate-pulse rounded-lg bg-muted" />
      <div className="h-4 w-72 animate-pulse rounded bg-muted/70" />
      <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-32 animate-pulse rounded-2xl border border-border bg-card/60" />
        ))}
      </div>
    </div>
  );
}
