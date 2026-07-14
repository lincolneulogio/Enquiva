import { requireApiSession, apiAuthErrorResponse } from "@/lib/auth/api-guards";
import { NextResponse } from "next/server";
import { convertToModelMessages } from "ai";
import { normalizeRole } from "@/lib/auth/rbac";
import { buildSystemPrompt } from "./prompts";
import { buildTools } from "./tools";
import { streamWithFallback } from "./providers";
import { requirePlanFeature, PlanLimitError } from "@/lib/billing/enforce";
import { assertAiChatMessageAllowed } from "@/lib/billing/ai-chat-usage";
import { chatRatelimit, enforceRateLimit } from "@/lib/redis";
export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const { user } = await requireApiSession();

    const { messages } = await req.json();
    const userRole = normalizeRole(user.role ?? "member");
    const userName = user.name ?? "Usuario";
    const userId = user.id;

    await requirePlanFeature(userId, userRole, "ai");

    const rate = await enforceRateLimit(chatRatelimit, userId);
    if (!rate.ok) {
      return NextResponse.json(
        {
          error:
            rate.reason === "unavailable"
              ? "El servicio de Copilot no está disponible temporalmente. Intenta de nuevo en unos minutos."
              : "Has alcanzado el límite de mensajes del Copilot. Espera unos minutos antes de continuar.",
        },
        { status: 429 },
      );
    }

    await assertAiChatMessageAllowed(userId, userRole);

    // 2. System prompt dinámico según rol
    const systemPrompt = buildSystemPrompt(userName, userRole);

    // 3. Herramientas dinámicas según rol y alcance de entidad
    const tools = await buildTools(userRole, userId, userName);

    // 4. Stream con cadena de fallback
    const convertedMessages = await convertToModelMessages(messages);

    const response = await streamWithFallback(
      convertedMessages,
      systemPrompt,
      tools,
    );
    return response;
  } catch (error: unknown) {
    const authResponse = apiAuthErrorResponse(error);
    if (authResponse) return authResponse;
    console.error("Error in Chat API Route:", error);
    if (error instanceof PlanLimitError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: 429 },
      );
    }
    const message =
      error instanceof Error ? error.message : "Error interno del servidor al procesar la conversación.";
    const status = message.includes("GEMINI_API_KEY") || message.includes("OPENROUTER_API_KEY") ? 503 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
