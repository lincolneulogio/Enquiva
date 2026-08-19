export default function PricingLoading() {
  return (
    <div className="mx-auto max-w-6xl px-6 py-12" aria-busy="true" aria-label="Cargando planes">
      <div className="mx-auto h-8 w-40 animate-pulse rounded-full bg-muted" />
      <div className="mx-auto mt-6 h-12 w-2/3 max-w-lg animate-pulse rounded-lg bg-muted" />
      <div className="mx-auto mt-4 h-4 w-full max-w-xl animate-pulse rounded bg-muted/70" />
      <div className="mt-12 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div
            key={index}
            className="h-96 animate-pulse rounded-3xl border border-border bg-card/60"
          />
        ))}
      </div>
    </div>
  );
}
