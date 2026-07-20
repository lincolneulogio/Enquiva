import { db } from "@/lib/db";
import { knowledgeChunks } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { buildEnquivaCorpus } from "./corpus";
import { cosineSimilarity, embedDocument } from "./remote-embed";

let syncPromise: Promise<void> | null = null;
let lastSyncAt = 0;
const SYNC_TTL_MS = 1000 * 60 * 30;

function toFloat32(values: number[]): Float32Array {
  return Float32Array.from(values);
}

/**
 * Upsert del corpus a knowledge_chunks (+ embeddings Gemini o locales).
 */
export async function ensureKnowledgeSynced(force = false): Promise<{ ok: boolean; count: number }> {
  const now = Date.now();
  if (!force && syncPromise && now - lastSyncAt < SYNC_TTL_MS) {
    await syncPromise;
    return { ok: true, count: -1 };
  }

  syncPromise = (async () => {
    const corpus = buildEnquivaCorpus();
    for (const chunk of corpus) {
      const blob = `${chunk.title}\n${chunk.text}\n${chunk.tags.join(" ")}`;
      const emb = await embedDocument(blob);
      await db
        .insert(knowledgeChunks)
        .values({
          id: chunk.id,
          title: chunk.title,
          text: chunk.text,
          kind: chunk.kind,
          moduleId: chunk.moduleId ?? null,
          moduleName: chunk.moduleName ?? null,
          tags: chunk.tags,
          embedding: emb.vector,
          embeddingModel: emb.model,
          syncedAt: new Date(),
          active: true,
        })
        .onConflictDoUpdate({
          target: knowledgeChunks.id,
          set: {
            title: chunk.title,
            text: chunk.text,
            kind: chunk.kind,
            moduleId: chunk.moduleId ?? null,
            moduleName: chunk.moduleName ?? null,
            tags: chunk.tags,
            embedding: emb.vector,
            embeddingModel: emb.model,
            syncedAt: new Date(),
            active: true,
          },
        });
    }
    lastSyncAt = Date.now();
  })();

  try {
    await syncPromise;
    return { ok: true, count: buildEnquivaCorpus().length };
  } catch (err) {
    console.warn("[RAG] knowledge sync skipped (¿migración 0017?):", err);
    syncPromise = null;
    return { ok: false, count: 0 };
  }
}

/**
 * Búsqueda semántica sobre embeddings persistidos (jsonb).
 * Para corpus pequeño (~60) es suficiente; en prod grande migrar a pgvector.
 */
export async function pgvectorSearch(
  queryVector: number[],
  limit = 12,
): Promise<Array<{ id: string; distance: number }>> {
  try {
    const rows = await db
      .select({
        id: knowledgeChunks.id,
        embedding: knowledgeChunks.embedding,
      })
      .from(knowledgeChunks)
      .where(eq(knowledgeChunks.active, true));

    const q = toFloat32(queryVector);
    const scored = rows
      .filter((r) => Array.isArray(r.embedding) && r.embedding.length > 0)
      .map((r) => {
        const sim = cosineSimilarity(q, toFloat32(r.embedding as number[]));
        return { id: r.id, distance: 1 - sim };
      })
      .sort((a, b) => a.distance - b.distance)
      .slice(0, limit);

    return scored;
  } catch (err) {
    console.warn("[RAG] embedding store search unavailable:", err);
    return [];
  }
}
