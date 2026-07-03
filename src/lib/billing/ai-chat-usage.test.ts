import { describe, expect, it } from "vitest";
import { buildAiChatUsageRedisKey } from "@/lib/billing/ai-chat-usage";

describe("ai-chat-usage", () => {
  it("builds scoped monthly redis keys", () => {
    expect(buildAiChatUsageRedisKey("org:abc-123", "2026-07")).toBe(
      "ai:chat:usage:org:abc-123:2026-07",
    );
    expect(buildAiChatUsageRedisKey("user:u1", "2026-12")).toBe(
      "ai:chat:usage:user:u1:2026-12",
    );
  });
});
