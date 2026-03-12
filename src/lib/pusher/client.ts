"use client";

import PusherClient from "pusher-js";
import { PUSHER_CHANNELS, PUSHER_EVENTS } from "./shared";

let pusherClientInstance: PusherClient | null = null;

export function getPusherClient(): PusherClient {
    if (!pusherClientInstance) {
        const key = process.env.NEXT_PUBLIC_PUSHER_KEY;
        const cluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER;

        if (!key || !cluster) {
            throw new Error("Missing NEXT_PUBLIC_PUSHER_KEY or NEXT_PUBLIC_PUSHER_CLUSTER");
        }

        pusherClientInstance = new PusherClient(key, {
            cluster,
            channelAuthorization: {
                endpoint: "/api/pusher/auth",
                transport: "ajax",
            },
        });
    }

    return pusherClientInstance;
}

export { PUSHER_CHANNELS, PUSHER_EVENTS };
