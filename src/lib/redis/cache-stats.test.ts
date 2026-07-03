import { describe, expect, it } from "vitest";
import { getCacheStats, resetCacheStats } from "@/lib/redis";

describe("redis cache stats", () => {
  it("tracks and resets observability counters", () => {
    resetCacheStats();
    const initial = getCacheStats();
    expect(initial.hits).toBe(0);
    expect(initial.misses).toBe(0);
    expect(initial.getErrors).toBe(0);
    expect(initial.setErrors).toBe(0);
    expect(initial.delErrors).toBe(0);
  });
});
