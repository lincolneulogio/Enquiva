import { NextResponse } from "next/server";
import { requireApiSession, apiAuthErrorResponse } from "@/lib/auth/api-guards";
import {
  listConversations,
  getConversationMessages,
  appendAssistantMessage,
} from "@/lib/chat/history";

export async function GET(req: Request) {
  try {
    const { user } = await requireApiSession();
    const url = new URL(req.url);
    const conversationId = url.searchParams.get("id");

    if (conversationId) {
      const messages = await getConversationMessages(user.id, conversationId);
      return NextResponse.json({ conversationId, messages });
    }

    const conversations = await listConversations(user.id);
    return NextResponse.json({ conversations });
  } catch (error) {
    const auth = apiAuthErrorResponse(error);
    if (auth) return auth;
    return NextResponse.json({ error: "No se pudo cargar el historial." }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { user } = await requireApiSession();
    const body = (await req.json()) as {
      conversationId?: string;
      content?: string;
      citations?: string[];
      intent?: string;
      modelId?: string;
    };

    if (!body.conversationId || !body.content?.trim()) {
      return NextResponse.json({ error: "conversationId y content requeridos" }, { status: 400 });
    }

    await appendAssistantMessage({
      conversationId: body.conversationId,
      userId: user.id,
      content: body.content,
      citations: body.citations,
      intent: body.intent,
      modelId: body.modelId,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    const auth = apiAuthErrorResponse(error);
    if (auth) return auth;
    return NextResponse.json({ error: "No se pudo guardar el mensaje." }, { status: 500 });
  }
}
