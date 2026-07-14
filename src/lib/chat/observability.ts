import { env } from "@/env";
import type { RetrievedContext } from "@/lib/chat/retrieve-context";

export type CopilotTrace = {
  at: string;
  userId?: string;
  intent: string;
  ragMode: string;
  citations: string[];
  requiredTools: string[];
  modelId?: string;
  latencyMs?: number;
  empty?: boolean;
  path?: string;
  queryPreview?: string;
  error?: string;
};

export function logCopilotTrace(trace: CopilotTrace) {
  const payload = {
    ...trace,
    queryPreview: trace.queryPreview?.slice(0, 160),
  };
  console.info("[Copilot]", JSON.stringify(payload));
}

export function traceFromRetrieved(
  retrieved: RetrievedContext,
  extra: Partial<CopilotTrace> = {},
): CopilotTrace {
  return {
    at: new Date().toISOString(),
    intent: retrieved.intent,
    ragMode: retrieved.ragMode,
    citations: retrieved.citations,
    requiredTools: retrieved.requiredTools,
    ...extra,
  };
}

export function isProdStablePreferred(): boolean {
  return env.AI_PROVIDER === "google" || Boolean(env.GEMINI_API_KEY);
}
