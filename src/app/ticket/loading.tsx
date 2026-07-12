export default function TicketLoading() {
  return (
    <main className="mx-auto min-h-screen max-w-2xl px-6 py-12" aria-busy="true">
      <div className="rounded-3xl border border-border bg-card p-8">
        <div className="h-3 w-24 animate-pulse rounded bg-muted" />
        <div className="mt-4 h-8 w-3/4 animate-pulse rounded-lg bg-muted" />
        <div className="mt-8 flex justify-center">
          <div className="h-48 w-48 animate-pulse rounded-xl bg-muted/60" />
        </div>
      </div>
    </main>
  );
}
