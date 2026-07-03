import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { ticketVerifyRatelimit } from "@/lib/redis";
import { assertCanManageEvent } from "@/lib/organizations/admin-scope";
import { db } from "@/lib/db";
import { tickets, registrations, events } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { TicketCheckInService } from "@/lib/tickets/check-in";

export async function POST(req: Request) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const role = session.user.role;
    if (role !== "admin" && role !== "super_admin" && role !== "organizer") {
      return NextResponse.json(
        { success: false, error: "Forbidden: No tienes permisos para escanear tickets" },
        { status: 403 },
      );
    }

    const body = await req.json().catch(() => ({}));
    const code = String(body.code ?? "").trim();
    const providedSignature = String(body.signature ?? body.s ?? "").trim();

    const hdrs = await headers();
    const ip = hdrs.get("x-forwarded-for") ?? hdrs.get("x-real-ip") ?? "unknown";
    try {
      const { success } = await ticketVerifyRatelimit.limit(ip);
      if (!success) {
        return NextResponse.json({ success: false, error: "Too many requests" }, { status: 429 });
      }
    } catch (error) {
      console.error("Ticket verify rate limit unavailable, continuing without enforcement", error);
    }

    if (code) {
      const [ticket] = await db.select().from(tickets).where(eq(tickets.code, code)).limit(1);
      if (ticket) {
        const [registration] = await db
          .select()
          .from(registrations)
          .where(eq(registrations.id, ticket.registrationId))
          .limit(1);

        if (registration) {
          const [eventRecord] = await db
            .select()
            .from(events)
            .where(eq(events.id, registration.eventId))
            .limit(1);

          if (eventRecord) {
            try {
              await assertCanManageEvent(
                {
                  id: eventRecord.id,
                  organizerId: eventRecord.organizerId,
                  organizationId: eventRecord.organizationId,
                },
                session.user.id,
                role,
              );
            } catch {
              return NextResponse.json(
                {
                  success: false,
                  error: "Forbidden: No tienes permisos para verificar tickets de este evento",
                },
                { status: 403 },
              );
            }
          }
        }
      }
    }

    const result = await TicketCheckInService.checkInByTicketCode(
      { code, signature: providedSignature },
      {
        scannedByUserId: session.user.id,
        scanLog: {
          ipAddress: ip,
          userAgent: hdrs.get("user-agent") ?? undefined,
        },
      },
    );

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error,
          code: result.code,
          status: result.ticketStatus,
        },
        { status: result.httpStatus },
      );
    }

    return NextResponse.json({
      success: true,
      ticket: result.ticket,
      event: result.event,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}
