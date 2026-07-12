"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function EventsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Events error boundary:", error);
  }, [error]);

  return (
    <main className="mx-auto flex min-h-[60vh] max-w-lg flex-col items-center justify-center gap-4 px-6 py-16 text-center">
      <h1 className="text-2xl font-semibold text-foreground">No se pudo cargar el evento</h1>
      <p className="text-sm text-muted-foreground">Intenta de nuevo o vuelve al listado de eventos.</p>
      <div className="flex gap-3">
        <button
          type="button"
          onClick={reset}
          className="rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
        >
          Reintentar
        </button>
        <Link href="/events" className="rounded-xl border border-border px-4 py-2 text-sm font-medium">
          Ver eventos
        </Link>
      </div>
    </main>
  );
}
