import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createOpenAI } from "@ai-sdk/openai";
import { streamText, type LanguageModel } from "ai";
import { env } from "@/env";

type StreamMessages = NonNullable<Parameters<typeof streamText>[0]["messages"]>;

function getGeminiModel(): LanguageModel | null {
  if (!env.GEMINI_API_KEY) return null;
  const google = createGoogleGenerativeAI({ apiKey: env.GEMINI_API_KEY });
  return google(env.GEMINI_MODEL || "gemini-2.5-flash");
}

function getOpenRouterModel(): LanguageModel | null {
  if (!env.OPENROUTER_API_KEY) return null;
  const openrouter = createOpenAI({
    baseURL: "https://openrouter.ai/api/v1",
    apiKey: env.OPENROUTER_API_KEY,
  });
  return openrouter(env.OPENROUTER_MODEL || "meta-llama/llama-3.1-8b-instruct:free");
}

function resolveModels(): LanguageModel[] {
  const preferred =
    env.AI_PROVIDER === "openrouter"
      ? [getOpenRouterModel(), getGeminiModel()]
      : [getGeminiModel(), getOpenRouterModel()];

  return preferred.filter((model): model is LanguageModel => model !== null);
}

export function isAiConfigured(): boolean {
  return resolveModels().length > 0;
}

/** Stream de respuesta con fallback Gemini ↔ OpenRouter según AI_PROVIDER */
export async function streamWithFallback(
  messages: StreamMessages,
  system: string,
  tools: Record<string, unknown>,
) {
  const models = resolveModels();

  if (models.length === 0) {
    throw new Error(
      "Configura GEMINI_API_KEY u OPENROUTER_API_KEY en el .env para usar el Copilot.",
    );
  }

  let lastError: unknown;

  for (const model of models) {
    try {
      return streamText({
        model,
        messages,
        system,
        tools,
        maxRetries: 1,
        maxSteps: 5,
        maxTokens: 1000,
      } as Parameters<typeof streamText>[0]).toTextStreamResponse();
    } catch (error) {
      lastError = error;
      console.warn("[AI] Provider failed, trying fallback if available:", error);
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error("No se pudo obtener respuesta de ningún proveedor de IA.");
}
