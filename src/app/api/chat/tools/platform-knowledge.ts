import { z } from "zod";
import { buildPlatformKnowledgePayload } from "@/lib/chat/platform-knowledge";
import { hybridRetrieveAsync, getCorpusSize } from "@/lib/chat/rag";

export function createGetPlatformKnowledge() {
  return {
    description:
      "Busca en la base de conocimiento interna de Evora (Hybrid RAG: rewrite + semántica + lexical + rerank). Úsala para módulos, cómo funciona X, rutas, pagos, tickets, transporte, auth. Devuelve fragmentos con citas.",
    parameters: z.object({
      topic: z
        .string()
        .describe(
          "Pregunta o tema del usuario (ej. 'cómo funciona el checkout Culqi', 'módulos de la app').",
        ),
    }),
    execute: async ({ topic }: { topic: string }) => {
      const query = topic?.trim() || "módulos evora";
      const rag = await hybridRetrieveAsync(query, { topK: 5, intent: "module_detail" });
      const inventory = buildPlatformKnowledgePayload(query);

      return {
        source: "hybrid_rag",
        corpusSize: getCorpusSize(),
        asOf: new Date().toISOString(),
        query,
        citations: rag.citations,
        passages: rag.hits.map((h) => ({
          id: h.chunk.id,
          title: h.chunk.title,
          module: h.chunk.moduleName ?? null,
          kind: h.chunk.kind,
          score: Number(h.score.toFixed(4)),
          text: h.chunk.text,
        })),
        moduleInventoryFallback: inventory.modules,
        grounding:
          "Responde SOLO con passages + inventario. No inventes. Conteos de BD → getEventStats u otra tool SQL.",
      };
    },
  };
}
