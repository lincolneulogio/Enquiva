import { NextResponse } from "next/server";
import { requireApiSession, apiAuthErrorResponse } from "@/lib/auth/api-guards";
import { db } from "@/lib/db";
import { chatFeedback } from "@/lib/db/schema";
import { z } from "zod";

const bodySchema = z.object({
  messageId: z.string().min(1),
  rating: z.union([z.literal(1), z.literal(-1)]),
  conversationId: z.string().uuid().optional(),
  query: z.string().optional(),
  citations: z.array(z.string()).optional(),
  intent: z.string().optional(),
  toolsUsed: z.array(z.string()).optional(),
  modelId: z.string().optional(),
  note: z.string().max(500).optional(),
});

export async function POST(req: Request) {
  try {
    const { user } = await requireApiSession();
    const parsed = bodySchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Payload inválido" }, { status: 400 });
    }

    const data = parsed.data;
    await db.insert(chatFeedback).values({
      userId: user.id,
      messageId: data.messageId,
      rating: data.rating,
      conversationId: data.conversationId,
      query: data.query,
      citations: data.citations,
      intent: data.intent,
      toolsUsed: data.toolsUsed,
      modelId: data.modelId,
      note: data.note,
    });

    console.info(
      "[Copilot feedback]",
      JSON.stringify({
        userId: user.id,
        rating: data.rating,
        intent: data.intent,
        citations: data.citations,
        modelId: data.modelId,
      }),
    );

    return NextResponse.json({ ok: true });
  } catch (error) {
    const auth = apiAuthErrorResponse(error);
    if (auth) return auth;
    console.warn("[feedback] insert failed (¿migración 0017?):", error);
    return NextResponse.json({ error: "No se pudo guardar el feedback." }, { status: 500 });
  }
}
