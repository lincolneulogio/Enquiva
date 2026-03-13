import { createOpenAI } from "@ai-sdk/openai";
import { generateText } from "ai";
import { env } from "@/env";
import type { GenerateDescriptionInput } from "@/lib/validations";

const OPENROUTER_MODEL_CANDIDATES = [
  "google/gemma-3-4b-it:free",
  "google/gemma-3-12b-it:free",
  "meta-llama/llama-3.2-3b-instruct:free",
] as const;

type SupportedModel = (typeof OPENROUTER_MODEL_CANDIDATES)[number];
type ProviderName = "openrouter";

const openrouter = env.OPENROUTER_API_KEY
  ? createOpenAI({
    apiKey: env.OPENROUTER_API_KEY,
    baseURL: "https://openrouter.ai/api/v1",
  })
  : null;

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message.toLowerCase();
  return String(error).toLowerCase();
}

function isQuotaError(message: string): boolean {
  return (
    message.includes("quota") ||
    message.includes("rate limit") ||
    message.includes("too many requests") ||
    message.includes("resource exhausted")
  );
}

function isModelAvailabilityError(message: string): boolean {
  return (
    message.includes("not found") ||
    message.includes("unsupported") ||
    message.includes("not available") ||
    message.includes("invalid model") ||
    message.includes("no endpoints found") ||
    message.includes("is not a valid model id")
  );
}

function isRetryableProviderError(message: string): boolean {
  return (
    message.includes("provider returned error") ||
    message.includes("temporarily rate-limited") ||
    message.includes("no endpoints available") ||
    message.includes("guardrail restrictions") ||
    message.includes("data policy")
  );
}

function generateLocalEventDescription(input: GenerateDescriptionInput): string {
  const toneLead = {
    formal: "Te invitamos cordialmente",
    casual: "Te esperamos",
    inspirational: "Únete con nosotros",
  };

  const categoryLabel = input.category.replace("_", " ");
  const points = input.bulletPoints.filter(Boolean).map((p) => p.trim()).filter(Boolean);

  const intro = `${toneLead[input.tone]} a "${input.title}", un encuentro de ${categoryLabel} pensado para fortalecer la comunidad y vivir una experiencia significativa.`;
  const details =
    points.length > 0
      ? `Durante el evento abordaremos temas clave como ${points.join(", ")}, creando un espacio participativo, cercano y de crecimiento para todos los asistentes.`
      : "Durante el evento compartiremos actividades enfocadas en el crecimiento espiritual, la conexión comunitaria y el acompañamiento mutuo.";
  const closing =
    "Será una excelente oportunidad para conectar, aprender y renovar la fe en un ambiente acogedor. ¡Te animamos a participar e invitar a más personas!";

  return `${intro}\n\n${details}\n\n${closing}`;
}

async function generateTextWithFallback(params: {
  system: string;
  prompt: string;
  temperature?: number;
  preferredModel?: "auto" | SupportedModel;
}) {
  if (!openrouter) {
    throw new Error("AI_PROVIDER_CONFIG_ERROR");
  }

  let lastError: unknown;
  let hasQuotaErrors = false;
  let hadRetryableProviderIssues = false;

  const selectedOrder: SupportedModel[] =
    params.preferredModel && params.preferredModel !== "auto"
      ? [
        params.preferredModel,
        ...OPENROUTER_MODEL_CANDIDATES.filter((m) => m !== params.preferredModel),
      ]
      : [...OPENROUTER_MODEL_CANDIDATES];

  const openrouterCandidates: Array<{
    provider: ProviderName;
    modelName: string;
  }> = selectedOrder.map((modelName) => ({
    provider: "openrouter" as const,
    modelName,
  }));

  for (const candidate of openrouterCandidates) {
    try {
      const result = await generateText({
        model: openrouter(candidate.modelName),
        system: params.system,
        prompt: params.prompt,
        temperature: params.temperature,
      });

      return {
        result,
        modelName: candidate.modelName,
        provider: candidate.provider,
      };
    } catch (error) {
      lastError = error;
      const message = getErrorMessage(error);

      if (isQuotaError(message)) {
        hasQuotaErrors = true;
        continue;
      }

      if (isModelAvailabilityError(message)) {
        continue;
      }

      if (isRetryableProviderError(message)) {
        hadRetryableProviderIssues = true;
        continue;
      }

      throw error;
    }
  }

  if (hasQuotaErrors) {
    throw new Error("AI_QUOTA_EXCEEDED");
  }

  if (hadRetryableProviderIssues) {
    throw new Error("AI_PROVIDER_TEMPORARILY_UNAVAILABLE");
  }

  if (lastError instanceof Error) {
    throw lastError;
  }

  throw new Error("AI_PROVIDER_ERROR");
}

// Generate event description from bullet points
export async function generateEventDescription(
  input: GenerateDescriptionInput
): Promise<Response> {
  const toneGuide = {
    formal: "professional and authoritative",
    casual: "warm and approachable",
    inspirational: "uplifting, spiritual, and community-focused",
  };

  const systemPrompt = `You are a talented writer for a faith-based community platform.
Write engaging event descriptions that resonate with community members.
Keep descriptions between 150-300 words. Be ${toneGuide[input.tone]}.
Do not use markdown. Write in plain paragraphs.`;

  const userPrompt = `Write an event description for:
Title: ${input.title}
Category: ${input.category.replace("_", " ")}
Key points:
${input.bulletPoints.map((p, i) => `${i + 1}. ${p}`).join("\n")}`;

  const runGeneration = async (retry = false) => {
    const { result, modelName, provider } = await generateTextWithFallback({
      system: retry
        ? `${systemPrompt}\n\nImportant: Your response must include meaningful, non-empty text.`
        : systemPrompt,
      prompt: userPrompt,
      temperature: retry ? 0.8 : 0.7,
      preferredModel: input.model,
    });

    return {
      text: result.text.trim(),
      modelName,
      provider,
    };
  };

  try {
    let generatedResponse = await runGeneration(false);
    if (!generatedResponse.text) {
      generatedResponse = await runGeneration(true);
    }

    if (!generatedResponse.text) {
      const localText = generateLocalEventDescription(input);
      return new Response(localText, {
        status: 200,
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
          "Cache-Control": "no-store",
          "X-AI-Model": "local-template",
          "X-AI-Provider": "local-template",
          "X-AI-Fallback": "true",
        },
      });
    }

    return new Response(generatedResponse.text, {
      status: 200,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-store",
        "X-AI-Model": generatedResponse.modelName,
        "X-AI-Provider": generatedResponse.provider,
      },
    });
  } catch {
    const localText = generateLocalEventDescription(input);
    return new Response(localText, {
      status: 200,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-store",
        "X-AI-Model": "local-template",
        "X-AI-Provider": "local-template",
        "X-AI-Fallback": "true",
      },
    });
  }
}

// Generate post-event summary from organizer notes
export async function generateEventSummary(
  eventTitle: string,
  organizerNotes: string
): Promise<string> {
  const { result } = await generateTextWithFallback({
    system: `You are a community newsletter writer. Create warm, celebratory 
    post-event summaries from organizer notes. Keep it under 200 words.`,
    prompt: `Write a post-event summary for "${eventTitle}":
Organizer notes: ${organizerNotes}`,
    preferredModel: "auto",
  });

  return result.text;
}

// Get AI-powered event recommendations for a user
export async function getEventRecommendations(
  userHistory: Array<{ category: string; title: string }>,
  availableEvents: Array<{ id: string; title: string; category: string; description: string }>,
  limit: number = 5
): Promise<string[]> {
  if (availableEvents.length === 0) return [];

  const { result } = await generateTextWithFallback({
    system: `You are an event recommendation engine for a faith community platform.
    Return ONLY a JSON array of event IDs, ordered by relevance. No explanation.`,
    prompt: `User's past events: ${JSON.stringify(userHistory.slice(0, 10))}
    
Available upcoming events: ${JSON.stringify(availableEvents)}

Return the top ${limit} event IDs as a JSON array: ["id1", "id2", ...]`,
    preferredModel: "auto",
  });

  try {
    const ids = JSON.parse(result.text.trim()) as string[];
    return ids.slice(0, limit);
  } catch {
    return availableEvents.slice(0, limit).map((e) => e.id);
  }
}
