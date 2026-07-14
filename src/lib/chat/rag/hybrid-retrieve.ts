import { buildEvoraCorpus } from "./corpus";
import { cosineSimilarity, embedText, tokenize } from "./embed";
import { rewriteQuery } from "./query-rewrite";
import { rerankHits } from "./rerank";
import { embedQuery } from "./remote-embed";
import { ensureKnowledgeSynced, pgvectorSearch } from "./pgvector-store";
import type { RagChunk, RagHit, RagRetrievalResult } from "./types";

type IndexedChunk = {
  chunk: RagChunk;
  vector: Float32Array;
  tokenSet: Set<string>;
};

let INDEX: IndexedChunk[] | null = null;

function getIndex(): IndexedChunk[] {
  if (INDEX) return INDEX;
  const corpus = buildEvoraCorpus();
  INDEX = corpus.map((chunk) => {
    const blob = `${chunk.title}\n${chunk.text}\n${chunk.tags.join(" ")}`;
    return {
      chunk,
      vector: embedText(blob),
      tokenSet: new Set(tokenize(blob)),
    };
  });
  return INDEX;
}

function lexicalScore(queryTokens: string[], docTokens: Set<string>): number {
  if (queryTokens.length === 0) return 0;
  let hit = 0;
  for (const t of queryTokens) {
    if (docTokens.has(t)) hit += 1;
    for (const d of docTokens) {
      if (d.startsWith(t) || t.startsWith(d)) {
        hit += 0.35;
        break;
      }
    }
  }
  return hit / queryTokens.length;
}

function scoreInMemory(query: string): RagHit[] {
  const index = getIndex();
  const qTokens = tokenize(query);
  const qVec = embedText(query);

  return index.map((row) => {
    const vectorScore = cosineSimilarity(qVec, row.vector);
    const lex = lexicalScore(qTokens, row.tokenSet);
    let tagBoost = 0;
    const qLower = query.toLowerCase();
    for (const tag of row.chunk.tags) {
      if (qLower.includes(tag.toLowerCase()) || tag.toLowerCase().includes(qTokens[0] ?? "___")) {
        tagBoost += 0.08;
      }
    }
    const score = 0.55 * vectorScore + 0.35 * lex + Math.min(tagBoost, 0.25);
    return { chunk: row.chunk, score, lexicalScore: lex, vectorScore };
  });
}

export type HybridRetrieveOptions = {
  topK?: number;
  intent?: string;
  /** Si true, intenta sync + pgvector (más lento la 1ª vez). */
  usePgvector?: boolean;
};

/**
 * Hybrid RAG avanzado:
 * 1) query rewrite
 * 2) lexical + local vector
 * 3) opcional pgvector (Gemini embeddings)
 * 4) rerank por intención
 */
export async function hybridRetrieveAsync(
  query: string,
  options: HybridRetrieveOptions = {},
): Promise<RagRetrievalResult> {
  const topK = options.topK ?? 5;
  const intent = options.intent ?? "unknown";
  const { original, rewritten } = rewriteQuery(query || "evora modulos");

  let scored = scoreInMemory(rewritten);

  if (options.usePgvector !== false) {
    const emb = await embedQuery(rewritten);
    const sync = await ensureKnowledgeSynced(false);
    if (sync.ok) {
      const pv = await pgvectorSearch(emb.vector, 12);
      if (pv.length > 0) {
        const byId = new Map(scored.map((h) => [h.chunk.id, h]));
        for (const row of pv) {
          const existing = byId.get(row.id);
          // cosine distance -> similarity ~ 1 - distance (para vectores normalizados)
          const sim = Math.max(0, 1 - Number(row.distance));
          if (existing) {
            existing.vectorScore = Math.max(existing.vectorScore, sim);
            existing.score = 0.45 * existing.score + 0.55 * (0.6 * sim + 0.4 * existing.lexicalScore);
          }
        }
        scored = [...byId.values()];
      }
    }
  }

  scored.sort((a, b) => b.score - a.score);
  const candidates = scored.filter((h) => h.score >= 0.1).slice(0, Math.max(12, topK * 2));
  const pool = candidates.length > 0 ? candidates : scored.slice(0, 12);
  const hits = rerankHits(pool, intent, topK);

  const citations = hits.map((h) => `${h.chunk.id} (${h.chunk.title})`);
  const contextBlock = hits
    .map(
      (h, i) =>
        `[Fuente ${i + 1}: ${h.chunk.title} | id=${h.chunk.id} | score=${h.score.toFixed(3)}]\n${h.chunk.text}`,
    )
    .join("\n\n");

  return {
    query: original,
    hits,
    contextBlock,
    citations,
  };
}

/** Sync wrapper para código legado / smoke tests. */
export function hybridRetrieve(query: string, topK = 6): RagRetrievalResult {
  const { original, rewritten } = rewriteQuery(query || "evora modulos");
  let scored = scoreInMemory(rewritten);
  scored.sort((a, b) => b.score - a.score);
  const minScore = 0.12;
  let hits = scored.filter((h) => h.score >= minScore).slice(0, Math.max(10, topK));
  if (hits.length === 0) hits = scored.slice(0, 4);
  hits = rerankHits(hits, "unknown", topK);

  const citations = hits.map((h) => `${h.chunk.id} (${h.chunk.title})`);
  const contextBlock = hits
    .map(
      (h, i) =>
        `[Fuente ${i + 1}: ${h.chunk.title} | id=${h.chunk.id} | score=${h.score.toFixed(3)}]\n${h.chunk.text}`,
    )
    .join("\n\n");

  return { query: original, hits, contextBlock, citations };
}

export function getCorpusSize(): number {
  return getIndex().length;
}

export function findChunksByModule(moduleId: number): RagChunk[] {
  return getIndex()
    .filter((r) => r.chunk.moduleId === moduleId)
    .map((r) => r.chunk);
}
