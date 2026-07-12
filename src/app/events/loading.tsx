export default function EventsLoading() {
  return (
    <div className="mx-auto max-w-5xl px-6 py-12" aria-busy="true" aria-label="Cargando evento">
      <div className="h-10 w-2/3 max-w-md animate-pulse rounded-lg bg-muted" />
      <div className="mt-4 h-4 w-full max-w-xl animate-pulse rounded bg-muted/70" />
      <div className="mt-8 h-64 w-full animate-pulse rounded-3xl bg-muted/50" />
    </div>
  );
}
