"use client";

import PusherClient from "pusher-js";
import { PUSHER_CHANNELS, PUSHER_EVENTS } from "./shared";

function isPlaceholder(val: string) {
    return val.startsWith("your-") || val.startsWith("replace-");
}

function createNoopChannel() {
    return { bind: function () { return this; }, unbind_all: function () {}, unbind: function () {} };
}

function createNoopClient() {
    return {
        subscribe: () => createNoopChannel(),
        unsubscribe: () => {},
        disconnect: () => {},
    } as unknown as PusherClient;
}

let pusherClientInstance: PusherClient | null = null;

export function getPusherClient(): PusherClient {
    if (!pusherClientInstance) {
        const key = process.env.NEXT_PUBLIC_PUSHER_KEY;
        const cluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER;

        if (!key || !cluster || isPlaceholder(key) || isPlaceholder(cluster)) {
            pusherClientInstance = createNoopClient();
            return pusherClientInstance;
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
