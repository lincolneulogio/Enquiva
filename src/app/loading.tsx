export default function RootLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center" aria-busy="true" aria-label="Cargando">
      <div className="h-10 w-10 animate-pulse rounded-full bg-muted" />
    </div>
  );
}
