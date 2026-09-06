/**
 * Fuente única de verdad + chunks recuperables para el Copilot (RAG liviano).
 */

export type PlatformModule = {
  id: number;
  name: string;
  summary: string;
  details?: string;
  /** Sinónimos / frases que el usuario suele usar al preguntar por este módulo */
  synonyms: string[];
  /** Preguntas frecuentes / cómo funciona (para retrieval) */
  faqs: string[];
};

export const PLATFORM_MODULE_COUNT = 11;

export const PLATFORM_OVERVIEW =
  "Enquiva cubre el ciclo completo de un evento: publicación, inscripción, pago, transporte, acceso en puerta y operación del negocio.";
