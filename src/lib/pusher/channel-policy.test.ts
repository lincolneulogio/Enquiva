import { describe, expect, it } from "vitest";
import { decidePusherChannelAccess } from "./channel-policy";
import { PUSHER_CHANNELS } from "./shared";

const ORG_A = "11111111-1111-4111-8111-111111111111";
const ORG_B = "22222222-2222-4222-8222-222222222222";
const EVENT_ID = "33333333-3333-4333-8333-333333333333";

describe("decidePusherChannelAccess", () => {
  it("solo permite el canal exacto del usuario", () => {
    expect(
      decidePusherChannelAccess({
        channelName: PUSHER_CHANNELS.userNotifications("user-1"),
        userId: "user-1",
        role: "member",
      }),
    ).toEqual({ kind: "allow" });

    expect(
      decidePusherChannelAccess({
        channelName: "private-user-attacker-user-1",
        userId: "user-1",
        role: "member",
      }),
    ).toEqual({ kind: "deny" });
  });

  it("reserva el dashboard global para super_admin", () => {
    expect(
      decidePusherChannelAccess({
        channelName: PUSHER_CHANNELS.platformDashboard,
        userId: "admin-1",
        role: "admin",
        organizationId: ORG_A,
      }),
    ).toEqual({ kind: "deny" });

    expect(
      decidePusherChannelAccess({
        channelName: PUSHER_CHANNELS.platformDashboard,
        userId: "super-1",
        role: "super_admin",
      }),
    ).toEqual({ kind: "allow" });
  });

  it("limita dashboards de organización y organizador a su scope exacto", () => {
    expect(
      decidePusherChannelAccess({
        channelName: PUSHER_CHANNELS.organizationDashboard(ORG_A),
        userId: "admin-1",
        role: "admin",
        organizationId: ORG_A,
      }),
    ).toEqual({ kind: "allow" });

    expect(
      decidePusherChannelAccess({
        channelName: PUSHER_CHANNELS.organizationDashboard(ORG_B),
        userId: "admin-1",
        role: "admin",
        organizationId: ORG_A,
      }),
    ).toEqual({ kind: "deny" });

    expect(
      decidePusherChannelAccess({
        channelName: PUSHER_CHANNELS.organizerDashboard("other"),
        userId: "organizer-1",
        role: "organizer",
      }),
    ).toEqual({ kind: "deny" });
  });

  it("delega solo canales de evento privados exactos y deniega desconocidos", () => {
    expect(
      decidePusherChannelAccess({
        channelName: PUSHER_CHANNELS.presence(EVENT_ID),
        userId: "member-1",
        role: "member",
      }),
    ).toEqual({ kind: "event", eventId: EVENT_ID });

    expect(
      decidePusherChannelAccess({
        channelName: PUSHER_CHANNELS.event(EVENT_ID),
        userId: "member-1",
        role: "member",
      }),
    ).toEqual({ kind: "event", eventId: EVENT_ID });

    expect(
      decidePusherChannelAccess({
        channelName: "private-arbitrary-channel",
        userId: "member-1",
        role: "member",
      }),
    ).toEqual({ kind: "deny" });
    expect(
      decidePusherChannelAccess({
        channelName: "private-event-not-a-uuid",
        userId: "member-1",
        role: "member",
      }),
    ).toEqual({ kind: "deny" });
  });

  it("no confunde prefijos ni roles en canales de tenant", () => {
    expect(
      decidePusherChannelAccess({
        channelName: `${PUSHER_CHANNELS.organizationDashboard(ORG_A)}-extra`,
        userId: "admin-1",
        role: "admin",
        organizationId: ORG_A,
      }),
    ).toEqual({ kind: "deny" });
    expect(
      decidePusherChannelAccess({
        channelName: PUSHER_CHANNELS.organizerDashboard("organizer-1"),
        userId: "organizer-1",
        role: "admin",
        organizationId: ORG_A,
      }),
    ).toEqual({ kind: "deny" });
  });
});
