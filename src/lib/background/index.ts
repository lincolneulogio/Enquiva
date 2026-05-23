import { after } from "next/after";

/**
 * Ejecuta una tarea asíncrona en segundo plano sin bloquear la respuesta HTTP principal.
 * Intenta utilizar 'next/after' si está soportado y habilitado por el entorno de Next.js,
 * con un mecanismo de respaldo seguro de promesas asíncronas no bloqueantes.
 */
export function runBackground(callback: () => Promise<void> | void): void {
  try {
    after(async () => {
      try {
        await callback();
      } catch (error) {
        console.error("Error en la ejecución de la tarea en segundo plano (Next.js after):", error);
      }
    });
  } catch {
    // Mecanismo de respaldo seguro (fallback) para entornos donde 'after' no está disponible
    Promise.resolve()
      .then(callback)
      .catch((error) => {
        console.error("Error en la ejecución de la tarea en segundo plano (Fallback):", error);
      });
  }
}
