import { PlatformModule, PLATFORM_MODULE_COUNT, PLATFORM_OVERVIEW } from "./types";
import { scoreModules } from "./search";

export function buildPlatformKnowledgePayload(
  allModules: PlatformModule[],
  topic?: string
) {
  const retrieved = topic?.trim()
    ? scoreModules(topic, allModules).slice(0, 4).map((r) => r.module)
    : allModules;

  const modules = retrieved.length > 0 ? retrieved : allModules;

  return {
    source: "platform_knowledge" as const,
    asOf: new Date().toISOString(),
    moduleCount: PLATFORM_MODULE_COUNT,
    overview: PLATFORM_OVERVIEW,
    modules: modules.map((m) => ({
      number: m.id,
      name: m.name,
      whatItDoes: m.summary,
      ...(m.details ? { extra: m.details } : {}),
      howItWorks: m.faqs,
    })),
    grounding:
      "Hay exactamente 11 módulos. Usa SOLO esta información. No inventes módulos ni cifras. Si la pregunta es sobre conteos de la BD, usa getEventStats u otra tool de datos.",
  };
}

export function formatPlatformKnowledgeForPrompt(allModules: PlatformModule[]): string {
  const lines = allModules.map(
    (m) =>
      `${m.id}. ${m.name}\n${m.summary}${m.details ? `\n${m.details}` : ""}`
  );
  return [
    `La plataforma Enquiva tiene ${PLATFORM_MODULE_COUNT} módulos principales.`,
    PLATFORM_OVERVIEW,
    ...lines,
  ].join("\n\n");
}
