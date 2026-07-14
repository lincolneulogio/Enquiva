/**
 * Eval automática del RAG Evora (groundedness de retrieval).
 * Ejecutar: pnpm exec tsx --env-file=.env scripts/eval-copilot-rag.ts
 */

import { hybridRetrieveAsync } from "../src/lib/chat/rag";

type Case = {
  id: string;
  query: string;
  intent: string;
  expectAnyId: string[];
};

const CASES: Case[] = [
  {
    id: "modules-count",
    query: "¿Cuántos módulos tiene Evora?",
    intent: "modules_overview",
    expectAnyId: ["overview-modules-list", "overview-core"],
  },
  {
    id: "checkout",
    query: "¿Cómo pago con Culqi?",
    intent: "module_detail",
    expectAnyId: ["howto-checkout", "module-5", "faq-5-1"],
  },
  {
    id: "checkin",
    query: "¿Cómo hago check-in con QR?",
    intent: "module_detail",
    expectAnyId: ["howto-scan", "module-10"],
  },
  {
    id: "transport",
    query: "¿Cómo funciona el transporte y los asientos?",
    intent: "transport",
    expectAnyId: ["module-6"],
  },
  {
    id: "register",
    query: "¿Cómo me inscribo a un evento?",
    intent: "module_detail",
    expectAnyId: ["howto-register", "module-4"],
  },
  {
    id: "policy-stats",
    query: "¿De dónde salen las estadísticas de usuarios?",
    intent: "live_stats",
    expectAnyId: ["policy-no-hallucinate"],
  },
  {
    id: "auth",
    query: "¿Cómo funciona el login y verificación de cuenta?",
    intent: "module_detail",
    expectAnyId: ["module-2"],
  },
  {
    id: "billing",
    query: "explícame los planes y billing de la plataforma",
    intent: "module_detail",
    expectAnyId: ["module-8"],
  },
];

function scoreCase(hitIds: string[], expectAnyId: string[]): number {
  if (expectAnyId.some((id) => hitIds.includes(id))) return 1;
  // soft: prefix match (faq-5-* vs module-5)
  for (const exp of expectAnyId) {
    const prefix = exp.split("-").slice(0, 2).join("-");
    if (hitIds.some((h) => h.startsWith(prefix))) return 0.5;
  }
  return 0;
}

async function main() {
  let total = 0;
  const rows: Array<{ id: string; score: number; hits: string }> = [];

  for (const c of CASES) {
    const rag = await hybridRetrieveAsync(c.query, {
      topK: 5,
      intent: c.intent,
      usePgvector: false, // eval local reproducible
    });
    const hitIds = rag.hits.map((h) => h.chunk.id);
    const s = scoreCase(hitIds, c.expectAnyId);
    total += s;
    rows.push({ id: c.id, score: s, hits: hitIds.join(", ") });
    console.log(`${s === 1 ? "OK" : s === 0.5 ? "SOFT" : "FAIL"} ${c.id} → ${hitIds.slice(0, 3).join(", ")}`);
  }

  const groundedness = total / CASES.length;
  console.log("\n---");
  console.log(`Cases: ${CASES.length}`);
  console.log(`Groundedness score: ${(groundedness * 100).toFixed(1)}%`);
  if (groundedness < 0.7) {
    console.error("Below threshold 70%");
    process.exitCode = 1;
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
