import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createOpenAI } from "@ai-sdk/openai";
import { streamText, stepCountIs, type LanguageModel } from "ai";
import { env } from "@/env";
import { createResponseSanitizer } from "./sanitize-output";
import {
  DEFAULT_GEMINI_FALLBACK_MODEL,
  DEFAULT_GEMINI_MODEL,
  STABLE_OPENROUTER_MODELS,
} from "./stable-models";

type StreamMessages = NonNullable<Parameters<typeof streamText>[0]["messages"]>;

type ResolvedModel = {
  id: string;
  model: LanguageModel;
};

/** OpenRouter solo acepta hasta 3 entradas en `models`. */
const OPENROUTER_MODELS_ARRAY_MAX = 3;

export type StreamMeta = {
  modelId: string;
  citations?: string[];
  intent?: string;
  ragMode?: string;
  statusHint?: string;
};

function parseModelList(value: string | undefined): string[] {
  if (!value?.trim()) return [];
  return value
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
}

function uniquePreserveOrder(ids: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const id of ids) {
    if (seen.has(id)) continue;
    seen.add(id);
    out.push(id);
  }
  return out;
}

function resolveOpenRouterModelIds(): string[] {
  const preferred = env.OPENROUTER_MODEL?.trim() || STABLE_OPENROUTER_MODELS[0];
  const fromEnv = parseModelList(env.OPENROUTER_FALLBACK_MODELS);
  const fallbacks = fromEnv.length > 0 ? fromEnv : [...STABLE_OPENROUTER_MODELS];
  return uniquePreserveOrder([preferred, ...fallbacks]);
}

function resolveGeminiModelIds(): string[] {
  const preferred = env.GEMINI_MODEL?.trim() || DEFAULT_GEMINI_MODEL;
  const fallback =
    env.GEMINI_FALLBACK_MODEL?.trim() || DEFAULT_GEMINI_FALLBACK_MODEL;
  return uniquePreserveOrder([preferred, fallback]);
}

function getGeminiModels(): ResolvedModel[] {
  if (!env.GEMINI_API_KEY) return [];
  const google = createGoogleGenerativeAI({ apiKey: env.GEMINI_API_KEY });
  return resolveGeminiModelIds().map((id) => ({
    id: `google/${id}`,
    model: google(id),
  }));
}

function getOpenRouterModels(): ResolvedModel[] {
  if (!env.OPENROUTER_API_KEY) return [];

  const chain = resolveOpenRouterModelIds();
  if (chain.length === 0) return [];

  const batches: string[][] = [];
  for (let i = 0; i < chain.length; i += OPENROUTER_MODELS_ARRAY_MAX) {
    batches.push(chain.slice(i, i + OPENROUTER_MODELS_ARRAY_MAX));
  }

  return batches.map((batch) => {
    const [primary, ...fallbacks] = batch;
    const openrouter = createOpenAI({
      baseURL: "https://openrouter.ai/api/v1",
      apiKey: env.OPENROUTER_API_KEY,
      name: "openrouter",
      headers: {
        "HTTP-Referer": env.NEXT_PUBLIC_APP_URL,
        "X-Title": "Evora Copilot",
      },
      fetch: async (input, init) => {
        if (!init?.body || typeof init.body !== "string") {
          return fetch(input, init);
        }
        try {
          const body = JSON.parse(init.body) as Record<string, unknown>;
          if (fallbacks.length > 0) {
            body.models = uniquePreserveOrder([
              String(body.model ?? primary),
              ...fallbacks,
            ]).slice(0, OPENROUTER_MODELS_ARRAY_MAX);
          }
          body.reasoning = { exclude: true };
          return fetch(input, { ...init, body: JSON.stringify(body) });
        } catch {
          return fetch(input, init);
        }
      },
    });

    return {
      id: `openrouter/${primary}${fallbacks.length ? ` (+${fallbacks.length} fallbacks)` : ""}`,
      model: openrouter.chat(primary!),
    };
  });
}

/**
 * Preferencia de producción: Gemini (estable) primero si hay key,
 * salvo AI_PROVIDER=openrouter explícito.
 */
function resolveModels(): ResolvedModel[] {
  const gemini = getGeminiModels();
  const openrouter = getOpenRouterModels();
  if (env.AI_PROVIDER === "openrouter") {
    return [...openrouter, ...gemini];
  }
  // Default google: Gemini estable primero
  return [...gemini, ...openrouter];
}

export function isAiConfigured(): boolean {
  return resolveModels().length > 0;
}

function shortError(error: unknown): string {
  if (!(error instanceof Error)) return String(error);
  const status = (error as { statusCode?: number }).statusCode;
  return status ? `${error.message} (${status})` : error.message;
}

async function toTextResponseAfterFirstChunk(
  textStream: AsyncIterable<string>,
  meta: StreamMeta,
): Promise<Response> {
  const iterator = textStream[Symbol.asyncIterator]();
  const first = await iterator.next();

  if (first.done) {
    throw new Error(
      `Respuesta vacía de ${meta.modelId} (sin texto tras herramientas).`,
    );
  }

  const sanitizer = createResponseSanitizer();
  const firstClean =
    typeof first.value === "string" ? sanitizer.push(first.value) : "";

  let primed = firstClean;
  if (!primed) {
    while (true) {
      const next = await iterator.next();
      if (next.done) {
        const leftover = sanitizer.end();
        if (!leftover.trim()) {
          throw new Error(
            `Respuesta vacía o solo tokens de control de ${meta.modelId}.`,
          );
        }
        primed = leftover;
        break;
      }
      primed = sanitizer.push(next.value);
      if (primed) break;
    }
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        if (primed) controller.enqueue(encoder.encode(primed));
        while (true) {
          const next = await iterator.next();
          if (next.done) {
            const tail = sanitizer.end();
            if (tail) controller.enqueue(encoder.encode(tail));
            break;
          }
          const clean = sanitizer.push(next.value);
          if (clean) controller.enqueue(encoder.encode(clean));
        }
        controller.close();
      } catch (error) {
        controller.error(error);
      }
    },
  });

  const headers: Record<string, string> = {
    "Content-Type": "text/plain; charset=utf-8",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
    "X-Evora-Model": meta.modelId,
    "Access-Control-Expose-Headers":
      "X-Evora-Model, X-Evora-Citations, X-Evora-Intent, X-Evora-Rag-Mode, X-Evora-Status",
  };
  if (meta.citations?.length) {
    headers["X-Evora-Citations"] = encodeURIComponent(JSON.stringify(meta.citations));
  }
  if (meta.intent) headers["X-Evora-Intent"] = meta.intent;
  if (meta.ragMode) headers["X-Evora-Rag-Mode"] = meta.ragMode;
  if (meta.statusHint) headers["X-Evora-Status"] = encodeURIComponent(meta.statusHint);

  return new Response(stream, { headers });
}

export async function streamWithFallback(
  messages: StreamMessages,
  system: string,
  tools: Record<string, unknown>,
  meta?: Omit<StreamMeta, "modelId">,
) {
  const models = resolveModels();

  if (models.length === 0) {
    throw new Error(
      "Configura GEMINI_API_KEY u OPENROUTER_API_KEY en el .env para usar el Copilot.",
    );
  }

  let lastError: unknown;

  for (const entry of models) {
    try {
      console.info(`[AI] Trying model: ${entry.id}`);
      const result = streamText({
        model: entry.model,
        messages,
        system,
        tools,
        maxRetries: 0,
        stopWhen: stepCountIs(5),
        maxOutputTokens: 1200,
      } as Parameters<typeof streamText>[0]);

      return await toTextResponseAfterFirstChunk(result.textStream, {
        modelId: entry.id,
        ...meta,
      });
    } catch (error) {
      lastError = error;
      console.warn(
        `[AI] Model failed (${entry.id}): ${shortError(error)} — trying next`,
      );
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error("No se pudo obtener respuesta de ningún proveedor de IA.");
}
