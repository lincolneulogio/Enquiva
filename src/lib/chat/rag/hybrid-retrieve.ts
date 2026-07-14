import { buildEvoraCorpus } from "./corpus";
import { cosineSimilarity, embedText, tokenize } from "./embed";
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

/** BM25-lite sobre tokens del corpus cerrado */
function lexicalScore(queryTokens: string[], docTokens: Set<string>): number {
  if (queryTokens.length === 0) return 0;
  let hit = 0;
  for (const t of queryTokens) {
    if (docTokens.has(t)) hit += 1;
    // prefijo parcial
    for (const d of docTokens) {
      if (d.startsWith(t) || t.startsWith(d)) {
        hit += 0.35;
        break;
      }
    }
  }
  return hit / queryTokens.length;
}

/**
 * Hybrid RAG: semántica (embeddings locales) + lexical (BM25-lite) + boost por tags.
 * Equivalent a Advanced/Hybrid RAG sin infra externa.
 */
export function hybridRetrieve(query: string, topK = 6): RagRetrievalResult {
  const index = getIndex();
  const qTokens = tokenize(query);
  const qVec = embedText(query);

  const scored: RagHit[] = index.map((row) => {
    const vectorScore = cosineSimilarity(qVec, row.vector);
    const lex = lexicalScore(qTokens, row.tokenSet);

    let tagBoost = 0;
    const qLower = query.toLowerCase();
    for (const tag of row.chunk.tags) {
      if (qLower.includes(tag.toLowerCase()) || tag.toLowerCase().includes(qTokens[0] ?? "___")) {
        tagBoost += 0.08;
      }
    }

    // Pesos típicos Hybrid RAG
    const score = 0.55 * vectorScore + 0.35 * lex + Math.min(tagBoost, 0.25);

    return {
      chunk: row.chunk,
      score,
      lexicalScore: lex,
      vectorScore,
    };
  });

  scored.sort((a, b) => b.score - a.score);
  const minScore = 0.12;
  let hits = scored.filter((h) => h.score >= minScore).slice(0, topK);

  // Fallback: si nada supera umbral, devolver overview + top módulos
  if (hits.length === 0) {
    hits = scored.slice(0, Math.min(4, scored.length));
  }

  const citations = hits.map(
    (h) => `${h.chunk.id} (${h.chunk.title})`,
  );

  const contextBlock = hits
    .map(
      (h, i) =>
        `[Fuente ${i + 1}: ${h.chunk.title} | id=${h.chunk.id} | score=${h.score.toFixed(3)}]\n${h.chunk.text}`,
    )
    .join("\n\n");

  return { query, hits, contextBlock, citations };
}

export function getCorpusSize(): number {
  return getIndex().length;
}

export function findChunksByModule(moduleId: number): RagChunk[] {
  return getIndex()
    .filter((r) => r.chunk.moduleId === moduleId)
    .map((r) => r.chunk);
}
