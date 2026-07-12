"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function GlobalError({
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
    <html lang="es">
      <body className="flex min-h-screen items-center justify-center bg-background px-6 font-sans text-foreground">
        <div className="max-w-md text-center">
          <h1 className="text-2xl font-semibold">Algo salió mal</h1>
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
      </body>
    </html>
  );
}
