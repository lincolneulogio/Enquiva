"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function TicketError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Ticket error boundary:", error);
  }, [error]);

  return (
    <main className="mx-auto flex min-h-screen max-w-lg flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 className="text-2xl font-semibold">No se pudo mostrar el ticket</h1>
      <p className="text-sm text-muted-foreground">
        El enlace puede ser inválido o hubo un error temporal.
      </p>
      <div className="flex gap-3">
        <button
          type="button"
          onClick={reset}
          className="rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
        >
          Reintentar
        </button>
        <Link href="/" className="rounded-xl border border-border px-4 py-2 text-sm font-medium">
          Inicio
        </Link>
      </div>
    </main>
  );
}
