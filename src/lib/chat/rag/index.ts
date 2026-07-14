/**
 * Evora Hybrid / Agentic RAG
 *
 * Flujo:
 *   Usuario → intenta (router) →
 *     A) Datos vivos (SQL tools): getEventStats, searchEvents, ...
 *     B) Conocimiento (Hybrid RAG): embeddings locales + lexical + tags
 *   → Contexto recuperado + pregunta → LLM → respuesta grounded
 *
 * Evolución: sustituir embedText local por Gemini/OpenAI embeddings
 * y persistir vectores en PostgreSQL (pgvector).
 */

export type { RagChunk, RagHit, RagRetrievalResult } from "./types";
export { buildEvoraCorpus } from "./corpus";
export { hybridRetrieve, getCorpusSize, findChunksByModule } from "./hybrid-retrieve";
export { embedText, cosineSimilarity } from "./embed";
export { retrieveKnowledgeForTopic } from "./knowledge-bridge";
