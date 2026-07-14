/**
 * Evora Hybrid / Agentic RAG
 *
 * Flujo:
 *   Usuario → query rewrite → hybrid (lexical + vectors + pgvector) → rerank →
 *     A) Datos vivos (SQL tools)
 *     B) Docs recuperados
 *   → LLM grounded
 */

export type { RagChunk, RagHit, RagRetrievalResult } from "./types";
export { buildEvoraCorpus } from "./corpus";
export {
  hybridRetrieve,
  hybridRetrieveAsync,
  getCorpusSize,
  findChunksByModule,
} from "./hybrid-retrieve";
export { embedText, cosineSimilarity } from "./embed";
export { rewriteQuery } from "./query-rewrite";
export { rerankHits } from "./rerank";
export { embedQuery, embedDocument } from "./remote-embed";
export { ensureKnowledgeSynced, pgvectorSearch } from "./pgvector-store";
export { retrieveKnowledgeForTopic } from "./knowledge-bridge";
