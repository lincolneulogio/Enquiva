import { describe, it, expect } from "vitest";
import { EventSpotlightService } from "./event-spotlight.service";
import type { SystemSettings } from "@/lib/settings";
import { DEFAULT_SETTINGS } from "@/lib/settings";

describe("EventSpotlightService", () => {
  it("should return null if eventBannerEnabled is false", async () => {
    const settings: SystemSettings = {
      ...DEFAULT_SETTINGS,
      eventBannerEnabled: false,
    };

    const result = await EventSpotlightService.getSpotlightEvent(settings);
    expect(result).toBeNull();
  });
});
