import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { pusherServer } from "@/lib/pusher/server";
import { isPusherServerConfigured } from "@/lib/pusher/config";
import { requireApiSession, apiAuthErrorResponse } from "@/lib/auth/api-guards";
import { db } from "@/lib/db";
import { events, registrations } from "@/lib/db/schema";
import { normalizeRole } from "@/lib/auth/rbac";
import { resolveAdminScopeForUser } from "@/lib/organizations/admin-scope";
import { canAccessEventRealtime } from "@/lib/organizations/event-access-policy";
import { decidePusherChannelAccess } from "@/lib/pusher/channel-policy";

import { getRequestSession } from "@/lib/request-context";

async function canAccessEventChannel(
  eventId: string,
  user: { id: string; role?: string | null },
) {
  const [event] = await db
    .select({
      organizerId: events.organizerId,
      organizationId: events.organizationId,
    })
    .from(events)
    .where(eq(events.id, eventId))
    .limit(1);
  if (!event) return false;

    const role = normalizeRole(user.role);
    const scope =
      role === "admin" || role === "scanner"
        ? await resolveAdminScopeForUser(user.id, user.role)
        : null;
    let registered = false;
    if (!["super_admin", "organizer", "admin", "scanner"].includes(role)) {
    const [registration] = await db
      .select({ id: registrations.id })
      .from(registrations)
      .where(
        and(
          eq(registrations.eventId, eventId),
          eq(registrations.userId, user.id),
        ),
      )
      .limit(1);
    registered = Boolean(registration);
  }

  return canAccessEventRealtime(
    { ...event, registeredUserIds: registered ? [user.id] : [] },
    {
      id: user.id,
      role,
      organizationId: scope?.mode === "org" ? scope.organizationId : null,
    },
  );
}

export async function POST(request: NextRequest) {
  try {
    if (!isPusherServerConfigured()) {
      return NextResponse.json({ error: "Pusher not configured" }, { status: 503 });
    }

    const body = await request.text();
    const params = new URLSearchParams(body);
    const socketId = params.get("socket_id");
    const channelName = params.get("channel_name");

    if (!socketId || !channelName) {
      return NextResponse.json({ error: "socket_id y channel_name son requeridos" }, { status: 400 });
    }

    if (!/^\d+\.\d+$/.test(socketId)) {
      return NextResponse.json({ error: "socket_id inválido" }, { status: 400 });
    }

    const session = await getRequestSession();
    const user = session?.user;

    // Si es un visitante anónimo en el canal de presencia de un evento público
    if (!user) {
      if (channelName.startsWith("presence-event-")) {
        const eventId = channelName.replace("presence-event-", "");
        const [event] = await db
          .select({ id: events.id, status: events.status })
          .from(events)
          .where(eq(events.id, eventId))
          .limit(1);

        if (event && event.status === "published") {
          const anonId = "guest_" + socketId.replace(".", "_");
          const presenceData = {
            user_id: anonId,
            user_info: {
              name: "Visitante",
              image: null,
              role: "guest",
            },
          };
          const authResponse = pusherServer.authorizeChannel(socketId, channelName, presenceData);
          return NextResponse.json(authResponse);
        }
      }

      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const role = normalizeRole(user.role);
    const adminScope =
      role === "admin" || role === "scanner"
        ? await resolveAdminScopeForUser(user.id, user.role)
        : null;
    const decision = decidePusherChannelAccess({
      channelName,
      userId: user.id,
      role: user.role,
      organizationId: adminScope?.mode === "org" ? adminScope.organizationId : null,
    });
    const allowed =
      decision.kind === "allow" ||
      (decision.kind === "event" &&
        (await canAccessEventChannel(decision.eventId, user)));

    if (!allowed) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const presenceData = channelName.startsWith("presence-")
      ? {
          user_id: user.id,
          user_info: {
            name: user.name ?? "Participante",
            image: user.image ?? null,
            role,
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
