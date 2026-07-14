"use client";

import { useEffect } from "react";
import Link from "next/link";

/**
 * error.tsx se renderiza DENTRO del RootLayout.
 * No debe incluir <html>/<body> (eso solo va en global-error.tsx).
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Root error boundary:", error);
  }, [error]);

  return (
    <div className="flex min-h-[70vh] items-center justify-center px-6">
      <div className="max-w-md text-center">
        <h1 className="font-display text-2xl font-semibold text-foreground">Algo salió mal</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Error inesperado en la aplicación. Puedes reintentar o volver al inicio.
        </p>
        <div className="mt-6 flex justify-center gap-3">
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
      </div>
    </div>
  );
}
