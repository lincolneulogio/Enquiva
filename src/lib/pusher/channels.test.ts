import { describe, expect, it } from "vitest";
import { collectEventRealtimeChannels } from "./channels";
import { PUSHER_CHANNELS } from "./shared";

const EVENT_ID = "33333333-3333-4333-8333-333333333333";
const ORG_ID = "11111111-1111-4111-8111-111111111111";
const ORGANIZER_ID = "organizer-1";

describe("collectEventRealtimeChannels", () => {
  it("fanea dashboards y el canal privado del evento, no el conteo público", () => {
    expect(
      collectEventRealtimeChannels({
        eventId: EVENT_ID,
        organizationId: ORG_ID,
        organizerId: ORGANIZER_ID,
        includePrivateEvent: true,
      }),
    ).toEqual([
      PUSHER_CHANNELS.platformDashboard,
      PUSHER_CHANNELS.organizationDashboard(ORG_ID),
      PUSHER_CHANNELS.organizerDashboard(ORGANIZER_ID),
      PUSHER_CHANNELS.event(EVENT_ID),
    ]);
  });

  it("solo añade el canal público cuando se pide explícitamente", () => {
    const channels = collectEventRealtimeChannels({
      eventId: EVENT_ID,
      includeDashboards: false,
      includePublicCount: true,
    });

    expect(channels).toEqual([PUSHER_CHANNELS.publicEventCount(EVENT_ID)]);
  });
});
