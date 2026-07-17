import { normalizeRole } from "@/lib/auth/rbac";
import { PUSHER_CHANNELS } from "./shared";

const UUID_PATTERN =
  "[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}";
const ORGANIZATION_DASHBOARD_PATTERN = new RegExp(
  `^private-org-(${UUID_PATTERN})-dashboard$`,
);
const EVENT_PRESENCE_PATTERN = new RegExp(`^presence-event-(${UUID_PATTERN})$`);
const PRIVATE_EVENT_PATTERN = new RegExp(`^private-event-(${UUID_PATTERN})$`);

export type PusherChannelDecision =
  | { kind: "allow" }
  | { kind: "event"; eventId: string }
  | { kind: "deny" };

export function decidePusherChannelAccess(input: {
  channelName: string;
  userId: string;
  role?: string | null;
  organizationId?: string | null;
}): PusherChannelDecision {
  const role = normalizeRole(input.role);

  if (input.channelName === PUSHER_CHANNELS.userNotifications(input.userId)) {
    return { kind: "allow" };
  }
  if (input.channelName === PUSHER_CHANNELS.platformDashboard) {
    return role === "super_admin" ? { kind: "allow" } : { kind: "deny" };
  }
  if (input.channelName === PUSHER_CHANNELS.organizerDashboard(input.userId)) {
    return role === "organizer" ? { kind: "allow" } : { kind: "deny" };
  }

  const organizationMatch = ORGANIZATION_DASHBOARD_PATTERN.exec(input.channelName);
  if (organizationMatch) {
    return role === "admin" && input.organizationId === organizationMatch[1]
      ? { kind: "allow" }
      : { kind: "deny" };
  }

  const eventMatch =
    EVENT_PRESENCE_PATTERN.exec(input.channelName) ??
    PRIVATE_EVENT_PATTERN.exec(input.channelName);
  if (eventMatch) {
    return { kind: "event", eventId: eventMatch[1] };
  }

  return { kind: "deny" };
}
