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
    role === "admin" ? await resolveAdminScopeForUser(user.id, user.role) : null;
  let registered = false;
  if (!["super_admin", "organizer", "admin"].includes(role)) {
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

    const { user } = await requireApiSession();

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

    const role = normalizeRole(user.role);
    const adminScope =
      role === "admin" ? await resolveAdminScopeForUser(user.id, user.role) : null;
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
