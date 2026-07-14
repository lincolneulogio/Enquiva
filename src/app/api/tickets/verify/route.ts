import { NextResponse } from "next/server";
import { requireApiRole, apiAuthErrorResponse } from "@/lib/auth/api-guards";
import { ticketVerifyRatelimit, enforceRateLimit } from "@/lib/redis";
import { assertCanScanEvent } from "@/lib/organizations/admin-scope";
import { db } from "@/lib/db";
import { tickets, registrations, events } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { TicketCheckInService } from "@/lib/tickets/check-in";

export async function POST(req: Request) {
  try {
    const { user, headers: hdrs } = await requireApiRole(
      ["admin", "super_admin", "organizer", "scanner"],
      "Forbidden: No tienes permisos para escanear tickets",
    );
    const role = user.role;

    const body = await req.json().catch(() => ({}));
    const code = String(body.code ?? "").trim();
    const providedSignature = String(body.signature ?? body.s ?? "").trim();

    const ip = hdrs.get("x-forwarded-for") ?? hdrs.get("x-real-ip") ?? "unknown";
    const rate = await enforceRateLimit(ticketVerifyRatelimit, ip);
    if (!rate.ok) {
      return NextResponse.json({ success: false, error: "Too many requests" }, { status: 429 });
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
              await assertCanScanEvent(
                {
                  id: eventRecord.id,
                  organizerId: eventRecord.organizerId,
                  organizationId: eventRecord.organizationId,
                },
                user.id,
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
        scannedByUserId: user.id,
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
    const authResponse = apiAuthErrorResponse(err);
    if (authResponse) {
      return NextResponse.json(
        { success: false, error: err instanceof Error ? err.message : "Unauthorized" },
        { status: authResponse.status },
      );
    }
    console.error(err);
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}
