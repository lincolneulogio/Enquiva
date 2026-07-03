import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { convertToModelMessages } from "ai";
import { normalizeRole } from "@/lib/auth/rbac";
import { buildSystemPrompt } from "./prompts";
import { buildTools } from "./tools";
import { streamWithFallback } from "./providers";
import { requirePlanFeature } from "@/lib/billing/enforce";
import { chatRatelimit } from "@/lib/redis";
export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    // 1. Autenticación
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { messages } = await req.json();
    const userRole = normalizeRole(session.user.role ?? "member");
    const userName = session.user.name ?? "Usuario";
    const userId = session.user.id;

    await requirePlanFeature(userId, userRole, "ai");

    try {
      const { success } = await chatRatelimit.limit(userId);
      if (!success) {
        return NextResponse.json(
          {
            error:
              "Has alcanzado el límite de mensajes del Copilot. Espera unos minutos antes de continuar.",
          },
          { status: 429 },
        );
      }
    } catch (error) {
      console.error("Chat rate limit unavailable, continuing without enforcement", error);
    }

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
    console.error("Error in Chat API Route:", error);
    const message =
      error instanceof Error ? error.message : "Error interno del servidor al procesar la conversación.";
    const status = message.includes("GEMINI_API_KEY") || message.includes("OPENROUTER_API_KEY") ? 503 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
