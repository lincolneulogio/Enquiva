import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { streamText } from "ai";
import { env } from "@/env";

type StreamMessages = NonNullable<Parameters<typeof streamText>[0]["messages"]>;

// Inicialización de Google Gemini directo
const googleProvider = env.GEMINI_API_KEY
  ? createGoogleGenerativeAI({ apiKey: env.GEMINI_API_KEY })
  : null;

/** Genera el stream de respuesta utilizando únicamente Google Gemini */
export async function streamWithFallback(
  messages: StreamMessages,
  system: string,
  tools: Record<string, any>,
) {
  if (!googleProvider) {
    throw new Error("La API Key de Gemini (GEMINI_API_KEY) no está configurada en el .env.");
  }

  const geminiModel = env.GEMINI_MODEL || "gemini-2.5-flash";

  return streamText({
    model: googleProvider(geminiModel),
    messages,
    system,
    tools,
    maxRetries: 0,
    maxSteps: 5,
    maxTokens: 1000,
  } as any).toTextStreamResponse();
}
