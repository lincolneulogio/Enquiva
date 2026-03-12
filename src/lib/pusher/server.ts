import "server-only";

import PusherServer from "pusher";
import { env } from "@/env";
import { PUSHER_CHANNELS, PUSHER_EVENTS } from "./shared";

export const pusherServer = new PusherServer({
    appId: env.PUSHER_APP_ID,
    key: env.NEXT_PUBLIC_PUSHER_KEY,
    secret: env.PUSHER_SECRET,
    cluster: env.NEXT_PUBLIC_PUSHER_CLUSTER,
    useTLS: true,
});

export { PUSHER_CHANNELS, PUSHER_EVENTS };
