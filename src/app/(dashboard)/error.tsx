"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Dashboard error boundary:", error);
  }, [error]);

  return (
    <div className="mx-auto flex min-h-[50vh] max-w-lg flex-col items-center justify-center gap-4 px-6 py-16 text-center">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Error</p>
      <h1 className="text-2xl font-semibold text-foreground">No se pudo cargar esta sección</h1>
      <p className="text-sm text-muted-foreground">
        Ocurrió un problema inesperado. Puedes reintentar o volver al inicio del panel.
      </p>
      <div className="mt-2 flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onClick={reset}
          className="inline-flex items-center rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Reintentar
        </button>
        <Link
          href="/dashboard"
          className="inline-flex items-center rounded-xl border border-border bg-card px-4 py-2 text-sm font-medium text-foreground hover:bg-muted/40"
        >
          Ir al panel
        </Link>
      </div>
    </div>
  );
}
