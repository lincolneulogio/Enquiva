/**
 * Fuente única de verdad + chunks recuperables para el Copilot (RAG liviano).
 */

import {
  PlatformModule,
  PLATFORM_MODULE_COUNT,
  PLATFORM_OVERVIEW,
  CORE_MODULES,
  EXTENDED_MODULES,
  normalizeQuery,
  scoreModules as scoreModulesFn,
  buildPlatformKnowledgePayload as buildPayload,
  formatPlatformKnowledgeForPrompt as formatPrompt,
} from "./knowledge";

export type { PlatformModule };
export { PLATFORM_MODULE_COUNT, PLATFORM_OVERVIEW, normalizeQuery };

export const PLATFORM_MODULES: PlatformModule[] = [
  ...CORE_MODULES,
  ...EXTENDED_MODULES,
];

export function buildPlatformKnowledgePayload(topic?: string) {
  return buildPayload(PLATFORM_MODULES, topic);
}

export function formatPlatformKnowledgeForPrompt(): string {
  return formatPrompt(PLATFORM_MODULES);
}

export function scoreModules(query: string): Array<{ module: PlatformModule; score: number }> {
  return scoreModulesFn(query, PLATFORM_MODULES);
}
