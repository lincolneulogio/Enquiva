import type { RagHit } from "./types";

type IntentLike = string;

/**
 * Rerank por reglas de intención (advanced RAG sin LLM extra).
 */
export function rerankHits(hits: RagHit[], intent: IntentLike, topK = 5): RagHit[] {
  const boosted = hits.map((hit) => {
    let boost = 0;
    const kind = hit.chunk.kind;
    const id = hit.chunk.id;

    switch (intent) {
      case "modules_overview":
      case "general_platform":
        if (kind === "overview") boost += 0.2;
        if (id.startsWith("module-")) boost += 0.05;
        break;
      case "module_detail":
      case "transport":
        if (kind === "module" || kind === "faq" || kind === "howto") boost += 0.15;
        break;
      case "live_stats":
      case "live_users":
      case "live_registrations":
        if (kind === "policy") boost += 0.25;
        break;
      case "notifications":
        if (hit.chunk.moduleId === 9 || /notific|broadcast/i.test(hit.chunk.text)) {
          boost += 0.2;
        }
        break;
      case "my_tickets":
        if (kind === "howto" || hit.chunk.moduleId === 4) boost += 0.18;
        break;
      default:
        break;
    }

    return { ...hit, score: hit.score + boost };
  });

  boosted.sort((a, b) => b.score - a.score);
  return boosted.slice(0, topK);
}
