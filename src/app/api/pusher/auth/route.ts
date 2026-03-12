import { NextRequest, NextResponse } from "next/server";
import { pusherServer } from "@/lib/pusher/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.text();
  const params = new URLSearchParams(body);
  const socketId = params.get("socket_id")!;
  const channelName = params.get("channel_name")!;

  // Only allow users to subscribe to their own private channels
  if (
    channelName.startsWith("private-user-") &&
    !channelName.includes(session.user.id)
  ) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const presenceData =
    channelName.startsWith("presence-") ?
      {
        user_id: session.user.id,
        user_info: {
          name: session.user.name,
          image: session.user.image,
        },
      }
      : undefined;

  const authResponse = presenceData
    ? pusherServer.authorizeChannel(socketId, channelName, presenceData)
    : pusherServer.authorizeChannel(socketId, channelName);

  return NextResponse.json(authResponse);
}
