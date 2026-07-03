import "server-only";

import PusherServer from "pusher";
import { env } from "@/env";
import { isPusherServerConfigured } from "./config";
import { PUSHER_CHANNELS, PUSHER_EVENTS } from "./shared";

let pusherInstance: PusherServer | null = null;

function getPusherServer(): PusherServer | null {
  if (!isPusherServerConfigured()) return null;
  if (!pusherInstance) {
    pusherInstance = new PusherServer({
      appId: env.PUSHER_APP_ID,
      key: env.NEXT_PUBLIC_PUSHER_KEY,
      secret: env.PUSHER_SECRET,
      cluster: env.NEXT_PUBLIC_PUSHER_CLUSTER,
      useTLS: true,
    });
  }
  return pusherInstance;
}

/** @deprecated Use triggerPusher() — kept for auth route compatibility */
export const pusherServer = {
  authorizeChannel(
    socketId: string,
    channelName: string,
    presenceData?: PusherServer.PresenceChannelData,
  ) {
    const pusher = getPusherServer();
    if (!pusher) {
      throw new Error("Pusher is not configured");
    }
    return presenceData
      ? pusher.authorizeChannel(socketId, channelName, presenceData)
      : pusher.authorizeChannel(socketId, channelName);
  },
  async trigger(channel: string, event: string, data: unknown) {
    return triggerPusher(channel, event, data);
  },
};

export async function triggerPusher(channel: string, event: string, data: unknown) {
  const pusher = getPusherServer();
  if (!pusher) return;
  try {
    await pusher.trigger(channel, event, data);
  } catch (error) {
    console.warn("[Pusher] trigger failed:", error);
  }
}

export { PUSHER_CHANNELS, PUSHER_EVENTS };
