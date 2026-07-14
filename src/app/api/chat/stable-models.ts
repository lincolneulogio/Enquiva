/**
 * Cadena de producción: modelos de pago primero, free solo como último recurso.
 * OpenRouter `models[]` máx. 3 por request.
 */
export const STABLE_OPENROUTER_MODELS = [
  "google/gemini-2.5-flash",
  "google/gemini-2.5-flash-lite",
  "anthropic/claude-3.5-haiku",
  "openai/gpt-4o-mini",
  "qwen/qwen3-next-80b-a3b-instruct:free",
  "openrouter/free",
] as const;

export const DEFAULT_GEMINI_MODEL = "gemini-3.5-flash";
export const DEFAULT_GEMINI_FALLBACK_MODEL = "gemini-3.1-flash-lite";
