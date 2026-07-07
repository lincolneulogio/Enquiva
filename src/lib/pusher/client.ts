"use client";

import PusherClient from "pusher-js";
import { isPusherClientConfigured } from "./config";
import { PUSHER_CHANNELS, PUSHER_EVENTS } from "./shared";

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

        if (!isPusherClientConfigured() || !key || !cluster) {
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
export type { TableRefreshPayload, TableResource } from "./shared";
