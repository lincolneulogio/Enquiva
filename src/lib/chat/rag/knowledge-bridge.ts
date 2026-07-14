import { buildPlatformKnowledgePayload } from "@/lib/chat/platform-knowledge";
import { hybridRetrieve } from "@/lib/chat/rag";

/**
 * Expone el mismo Hybrid RAG también vía buildPlatformKnowledgePayload
 * cuando se pide un topic (compatibilidad con código previo).
 */
export function retrieveKnowledgeForTopic(topic?: string) {
  const query = topic?.trim() || "módulos evora";
  const rag = hybridRetrieve(query, 6);
  const inventory = buildPlatformKnowledgePayload(query);
  return { rag, inventory };
}
