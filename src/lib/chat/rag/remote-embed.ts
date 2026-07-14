import { env } from "@/env";
import { embedText as localEmbed, cosineSimilarity } from "./embed";

export const GEMINI_EMBEDDING_DIMS = 768;
export const GEMINI_EMBEDDING_MODEL = "text-embedding-004";

export type EmbeddingResult = {
  vector: number[];
  model: string;
  provider: "gemini" | "local";
};

/**
 * Expande/reduce un vector local (256) a 768 con repetición padded + normalización,
 * para poder coexistir en la misma columna pgvector cuando no hay Gemini.
 */
function expandLocalTo768(local: Float32Array): number[] {
  const out = new Array<number>(GEMINI_EMBEDDING_DIMS).fill(0);
  for (let i = 0; i < GEMINI_EMBEDDING_DIMS; i += 1) {
    out[i] = local[i % local.length] ?? 0;
  }
  let sum = 0;
  for (const v of out) sum += v * v;
  const norm = Math.sqrt(sum) || 1;
  return out.map((v) => v / norm);
}

async function embedWithGemini(text: string): Promise<EmbeddingResult | null> {
  if (!env.GEMINI_API_KEY) return null;
  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_EMBEDDING_MODEL}:embedContent?key=${env.GEMINI_API_KEY}`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        content: { parts: [{ text: text.slice(0, 8000) }] },
        taskType: "RETRIEVAL_DOCUMENT",
      }),
    });
    if (!res.ok) {
      console.warn(`[RAG] Gemini embedding HTTP ${res.status}`);
      return null;
    }
    const json = (await res.json()) as {
      embedding?: { values?: number[] };
    };
    const values = json.embedding?.values;
    if (!values?.length) return null;
    return {
      vector: values,
      model: GEMINI_EMBEDDING_MODEL,
      provider: "gemini",
    };
  } catch (err) {
    console.warn("[RAG] Gemini embedding failed:", err);
    return null;
  }
}

export async function embedQuery(text: string): Promise<EmbeddingResult> {
  const remote = await embedWithGemini(text);
  if (remote) return remote;
  return {
    vector: expandLocalTo768(localEmbed(text)),
    model: "local-hash-256x3",
    provider: "local",
  };
}

export async function embedDocument(text: string): Promise<EmbeddingResult> {
  return embedQuery(text);
}

export { cosineSimilarity };
