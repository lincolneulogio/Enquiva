import { z } from "zod";
import { buildPlatformKnowledgePayload } from "@/lib/chat/platform-knowledge";
import { hybridRetrieve, getCorpusSize } from "@/lib/chat/rag";

/**
 * Tool de conocimiento: Hybrid RAG sobre el corpus Evora.
 */
export function createGetPlatformKnowledge() {
  return {
    description:
      "Busca en la base de conocimiento interna de Evora (Hybrid RAG: semántica + palabras clave). Úsala para módulos, cómo funciona X, rutas, pagos, tickets, transporte, auth, etc. Devuelve fragmentos relevantes con citas. No inventes: usa solo lo recuperado.",
    parameters: z.object({
      topic: z
        .string()
        .describe(
          "Pregunta o tema del usuario, tal cual (ej. 'cómo funciona el checkout Culqi', 'módulos de la app', 'transporte').",
        ),
    }),
    execute: async ({ topic }: { topic: string }) => {
      const query = topic?.trim() || "módulos evora";
      const rag = hybridRetrieve(query, 5);
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
          "Responde SOLO con passages + inventario. No inventes. Si la pregunta pide conteos de BD, indica que debe usarse getEventStats u otra tool SQL.",
      };
    },
  };
}
