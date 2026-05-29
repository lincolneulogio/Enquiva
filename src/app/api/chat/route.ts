import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { convertToModelMessages } from "ai";
import { normalizeRole } from "@/lib/auth/rbac";
import { buildSystemPrompt } from "./prompts";
import { buildTools } from "./tools";
import { streamWithFallback } from "./providers";
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

    // 2. System prompt dinámico según rol
    const systemPrompt = buildSystemPrompt(userName, userRole);

    // 3. Herramientas dinámicas según rol
    const tools = buildTools(userRole, userId, userName);

    // 4. Stream con cadena de fallback
    const convertedMessages = await convertToModelMessages(messages);

    const response = await streamWithFallback(
      convertedMessages,
      systemPrompt,
      tools,
    );
    return response;
  } catch (error: any) {
    console.error("Error in Chat API Route:", error);
    return NextResponse.json(
      { error: "Error interno del servidor al procesar la conversación." },
      { status: 500 },
    );
  }
}
