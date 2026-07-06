import { describe, expect, it } from "vitest";
import {
  chunkRecipients,
  DEFAULT_BROADCAST_BATCH_SIZE,
  resolveBroadcastBatchSize,
} from "@/lib/notifications/broadcast-batch";

describe("broadcast-batch", () => {
  it("chunks recipients evenly", () => {
    expect(chunkRecipients([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]]);
  });

  it("returns empty array for empty input", () => {
    expect(chunkRecipients([], 8)).toEqual([]);
  });

  it("resolves batch size with bounds", () => {
    expect(resolveBroadcastBatchSize(undefined)).toBe(DEFAULT_BROADCAST_BATCH_SIZE);
    expect(resolveBroadcastBatchSize(0)).toBe(1);
    expect(resolveBroadcastBatchSize(100)).toBe(50);
  });

  it("rejects invalid batch size", () => {
    expect(() => chunkRecipients([1], 0)).toThrow();
  });
});
