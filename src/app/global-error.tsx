"use client";

import { useEffect } from "react";

/**
 * Solo se monta si falla el RootLayout. Aquí sí hace falta <html>/<body>.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Global error boundary:", error);
  }, [error]);

  return (
    <html lang="es">
      <body className="flex min-h-screen items-center justify-center bg-white px-6 font-sans text-zinc-900">
        <div className="max-w-md text-center">
          <h1 className="text-2xl font-semibold">Algo salió mal</h1>
          <p className="mt-2 text-sm text-zinc-600">
            Error crítico. Intenta recargar la página.
          </p>
          <button
            type="button"
            onClick={reset}
            className="mt-6 rounded-xl bg-zinc-900 px-4 py-2 text-sm font-medium text-white"
          >
            Reintentar
          </button>
        </div>
      </body>
    </html>
  );
}
