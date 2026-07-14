import { db } from "@/lib/db";
import { chatConversations, chatMessages } from "@/lib/db/schema";
import { and, desc, eq } from "drizzle-orm";

export async function persistChatTurn(input: {
  userId: string;
  conversationId?: string;
  pathContext?: string;
  userMessage: string;
  intent?: string;
  citations?: string[];
  requiredTools?: string[];
}): Promise<{ conversationId: string } | null> {
  try {
    let conversationId = input.conversationId;

    if (conversationId) {
      const [owned] = await db
        .select({ id: chatConversations.id })
        .from(chatConversations)
        .where(
          and(
            eq(chatConversations.id, conversationId),
            eq(chatConversations.userId, input.userId),
          ),
        )
        .limit(1);
      if (!owned) conversationId = undefined;
    }

    if (!conversationId) {
      const title =
        input.userMessage.trim().slice(0, 80) ||
        `Chat ${new Date().toLocaleString("es-PE")}`;
      const [created] = await db
        .insert(chatConversations)
        .values({
          userId: input.userId,
          title,
          pathContext: input.pathContext,
        })
        .returning({ id: chatConversations.id });
      conversationId = created?.id;
    } else {
      await db
        .update(chatConversations)
        .set({
          updatedAt: new Date(),
          pathContext: input.pathContext ?? undefined,
        })
        .where(eq(chatConversations.id, conversationId));
    }

    if (!conversationId || !input.userMessage.trim()) {
      return conversationId ? { conversationId } : null;
    }

    await db.insert(chatMessages).values({
      conversationId,
      role: "user",
      content: input.userMessage,
      intent: input.intent,
      citations: input.citations,
      toolsUsed: input.requiredTools,
    });

    return { conversationId };
  } catch (err) {
    console.warn("[history] persist failed (¿migración 0017?):", err);
    return null;
  }
}

export async function appendAssistantMessage(input: {
  conversationId: string;
  userId: string;
  content: string;
  citations?: string[];
  intent?: string;
  modelId?: string;
}) {
  try {
    const [owned] = await db
      .select({ id: chatConversations.id })
      .from(chatConversations)
      .where(
        and(
          eq(chatConversations.id, input.conversationId),
          eq(chatConversations.userId, input.userId),
        ),
      )
      .limit(1);
    if (!owned) return;

    await db.insert(chatMessages).values({
      conversationId: input.conversationId,
      role: "assistant",
      content: input.content,
      citations: input.citations,
      intent: input.intent,
      modelId: input.modelId,
    });
    await db
      .update(chatConversations)
      .set({ updatedAt: new Date() })
      .where(eq(chatConversations.id, input.conversationId));
  } catch (err) {
    console.warn("[history] append assistant failed:", err);
  }
}

export async function listConversations(userId: string, limit = 20) {
  return db
    .select({
      id: chatConversations.id,
      title: chatConversations.title,
      pathContext: chatConversations.pathContext,
      updatedAt: chatConversations.updatedAt,
    })
    .from(chatConversations)
    .where(eq(chatConversations.userId, userId))
    .orderBy(desc(chatConversations.updatedAt))
    .limit(limit);
}

export async function getConversationMessages(userId: string, conversationId: string) {
  const [owned] = await db
    .select({ id: chatConversations.id })
    .from(chatConversations)
    .where(
      and(eq(chatConversations.id, conversationId), eq(chatConversations.userId, userId)),
    )
    .limit(1);
  if (!owned) return [];

  return db
    .select({
      id: chatMessages.id,
      role: chatMessages.role,
      content: chatMessages.content,
      citations: chatMessages.citations,
      intent: chatMessages.intent,
      createdAt: chatMessages.createdAt,
    })
    .from(chatMessages)
    .where(eq(chatMessages.conversationId, conversationId))
    .orderBy(chatMessages.createdAt);
}
