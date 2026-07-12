import { NextRequest, NextResponse } from "next/server";
import { pusherServer } from "@/lib/pusher/server";
import { isPusherServerConfigured } from "@/lib/pusher/config";
import { requireApiSession, apiAuthErrorResponse } from "@/lib/auth/api-guards";

export async function POST(request: NextRequest) {
  try {
    if (!isPusherServerConfigured()) {
      return NextResponse.json({ error: "Pusher not configured" }, { status: 503 });
    }

    const { user } = await requireApiSession();

    const body = await request.text();
    const params = new URLSearchParams(body);
    const socketId = params.get("socket_id");
    const channelName = params.get("channel_name");

    if (!socketId || !channelName) {
      return NextResponse.json({ error: "socket_id y channel_name son requeridos" }, { status: 400 });
    }

    // 1. Only allow users to subscribe to their own private user channels
    if (channelName.startsWith("private-user-") && !channelName.includes(user.id)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // 2. Restrict the private admin dashboard channel to admin/super_admin/organizer roles
    if (
      channelName === "private-admin-dashboard" &&
      user.role !== "admin" &&
      user.role !== "super_admin" &&
      user.role !== "organizer"
    ) {
      return NextResponse.json(
        { error: "Forbidden: No tienes permisos para este canal" },
        { status: 403 },
      );
    }

    const presenceData = channelName.startsWith("presence-")
      ? {
          user_id: user.id,
          user_info: {
            name: user.name,
            image: user.image,
          },
        }
      : undefined;

    const authResponse = presenceData
      ? pusherServer.authorizeChannel(socketId, channelName, presenceData)
      : pusherServer.authorizeChannel(socketId, channelName);

    return NextResponse.json(authResponse);
  } catch (error) {
    const authResponse = apiAuthErrorResponse(error);
    if (authResponse) return authResponse;
    console.error("[pusher/auth]", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
