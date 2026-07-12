"use server";

import { z } from "zod";
import { requireAuth } from "@/lib/auth/guards";
import {
  isWebPushConfigured,
  removePushSubscription,
  savePushSubscription,
} from "@/lib/push/web-push";
import { env } from "@/env";

const subscriptionSchema = z.object({
  endpoint: z.string().url(),
  keys: z.object({
    p256dh: z.string().min(1),
    auth: z.string().min(1),
  }),
});

export async function getWebPushPublicKeyAction() {
  if (!isWebPushConfigured()) return { enabled: false as const, publicKey: null };
  return { enabled: true as const, publicKey: env.VAPID_PUBLIC_KEY! };
}

export async function subscribeWebPushAction(input: unknown) {
  const user = await requireAuth();
  if (!isWebPushConfigured()) {
    throw new Error("Web Push no está configurado en el servidor");
  }
  const parsed = subscriptionSchema.parse(input);
  await savePushSubscription(user.id, parsed);
  return { success: true as const };
}

export async function unsubscribeWebPushAction(endpoint: string) {
  const user = await requireAuth();
  const url = z.string().url().parse(endpoint);
  await removePushSubscription(user.id, url);
  return { success: true as const };
}
