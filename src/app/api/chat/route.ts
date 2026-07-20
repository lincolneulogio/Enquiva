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
import {
  appendRetrievedContextToSystem,
  retrieveChatContext,
  type PageContext,
} from "@/lib/chat/retrieve-context";
import { logCopilotTrace, traceFromRetrieved } from "@/lib/chat/observability";
import { persistChatTurn } from "@/lib/chat/history";

export const maxDuration = 60;

export async function POST(req: Request) {
  const started = Date.now();
  try {
    const { user } = await requireApiSession();

    const body = (await req.json()) as {
      messages?: unknown;
      pageContext?: PageContext;
      conversationId?: string;
    };
    const { messages, pageContext, conversationId } = body;
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

    const basePrompt = buildSystemPrompt(userName, userRole);
    const retrieved = await retrieveChatContext(messages, userRole, pageContext ?? null);
    const systemPrompt = appendRetrievedContextToSystem(basePrompt, retrieved, userRole);

    const tools = await buildTools(userRole, userId, userName);
    const convertedMessages = await convertToModelMessages(messages as never);

    const lastUser =
      Array.isArray(messages) && messages.length > 0
        ? String(
            (messages as Array<{ role?: string; content?: string }>)
              .filter((m) => m.role === "user")
              .at(-1)?.content ?? "",
          ).slice(0, 200)
        : "";

    logCopilotTrace(
      traceFromRetrieved(retrieved, {
        userId,
        path: pageContext?.pathname,
        queryPreview: lastUser,
        latencyMs: Date.now() - started,
      }),
    );

    const persisted = await persistChatTurn({
      userId,
      conversationId,
      pathContext: pageContext?.pathname,
      userMessage: lastUser,
      intent: retrieved.intent,
      citations: retrieved.citations,
      requiredTools: retrieved.requiredTools,
    }).catch((err) => {
      console.warn("[Copilot] persist turn:", err);
      return null;
    });

    const response = await streamWithFallback(convertedMessages, systemPrompt, tools, {
      citations: retrieved.citations,
      intent: retrieved.intent,
      ragMode: retrieved.ragMode,
      statusHint: retrieved.statusHint,
    });

    if (persisted?.conversationId) {
      response.headers.set("X-Enquiva-Conversation-Id", persisted.conversationId);
      const expose = response.headers.get("Access-Control-Expose-Headers") ?? "";
      if (!expose.includes("X-Enquiva-Conversation-Id")) {
        response.headers.set(
          "Access-Control-Expose-Headers",
          `${expose}, X-Enquiva-Conversation-Id`.replace(/^,\s*/, ""),
        );
      }
    }

    logCopilotTrace(
      traceFromRetrieved(retrieved, {
        userId,
        path: pageContext?.pathname,
        latencyMs: Date.now() - started,
        modelId: response.headers.get("X-Enquiva-Model") ?? undefined,
      }),
    );

    return response;
  } catch (error: unknown) {
    const authResponse = apiAuthErrorResponse(error);
    if (authResponse) return authResponse;
    console.error("Error in Chat API Route:", error);
    logCopilotTrace({
      at: new Date().toISOString(),
      intent: "error",
      ragMode: "hybrid_docs",
      citations: [],
      requiredTools: [],
      latencyMs: Date.now() - started,
      error: error instanceof Error ? error.message : "unknown",
      empty: true,
    });
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
