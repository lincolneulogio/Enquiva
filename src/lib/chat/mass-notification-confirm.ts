import { randomUUID } from "node:crypto";
import { redis } from "@/lib/redis";

const CONFIRM_PREFIX = "chat:mass-confirm:";
const CONFIRM_TTL_SECONDS = 10 * 60;

export type MassNotificationConfirmPayload = {
  userId: string;
  eventId: string;
  eventTitle: string;
  target: "all_attendees" | "route_passengers";
  routeId?: string;
  title: string;
  body: string;
  recipientCount: number;
};

export async function storeMassNotificationConfirmation(
  payload: MassNotificationConfirmPayload,
): Promise<string> {
  const confirmationId = randomUUID();
  await redis.setex(`${CONFIRM_PREFIX}${confirmationId}`, CONFIRM_TTL_SECONDS, payload);
  return confirmationId;
}

export async function consumeMassNotificationConfirmation(
  confirmationId: string,
  userId: string,
): Promise<MassNotificationConfirmPayload | null> {
  const key = `${CONFIRM_PREFIX}${confirmationId}`;
  const payload = await redis.get<MassNotificationConfirmPayload>(key);
  if (!payload || payload.userId !== userId) {
    return null;
  }
  await redis.del(key);
  return payload;
}
