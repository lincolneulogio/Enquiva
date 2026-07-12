import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { tickets, registrations, users, events } from "@/lib/db/schema";
import { requireApiSession, apiAuthErrorResponse } from "@/lib/auth/api-guards";
import { eq } from "drizzle-orm";
import { sendTicketEmailWithPdf } from "@/lib/mail";
import { buildTicketPublicUrl, resolveTicketQrDataUrl } from "@/lib/tickets";
import { env } from "@/env";
import { z } from "zod";

const resendSchema = z.object({
  registrationId: z.string().uuid("Formato de UUID inválido"),
});

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    
    // 1. Validate request body input with Zod
    const validation = resendSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ success: false, error: validation.error.issues[0]?.message || "Invalid registrationId" }, { status: 400 });
    }
    const { registrationId } = validation.data;

    // 2. Authenticate the requester
    const { user } = await requireApiSession();

    const [registration] = await db.select().from(registrations).where(eq(registrations.id, registrationId)).limit(1);
    if (!registration) return NextResponse.json({ success: false, error: "Registration not found" }, { status: 404 });

    // 3. Authorize: el dueño del ticket o staff con permiso sobre el evento
    const userId = user.id;
    const role = user.role;

    if (registration.userId !== userId) {
      const { assertEventInAdminScope } = await import("@/lib/organizations/admin-scope");
      try {
        await assertEventInAdminScope(registration.eventId, userId, role);
      } catch {
        return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
      }
    }

    const [ticket] = await db.select().from(tickets).where(eq(tickets.registrationId, registrationId)).limit(1);
    if (!ticket) return NextResponse.json({ success: false, error: "Ticket not found" }, { status: 404 });

    const [attendee] = await db.select({ email: users.email, name: users.name }).from(users).where(eq(users.id, registration.userId)).limit(1);
    const [eventRecord] = await db.select({ id: events.id, title: events.title }).from(events).where(eq(events.id, registration.eventId)).limit(1);

    try {
      const ticketUrl =
        ticket.signature != null
          ? buildTicketPublicUrl(ticket.code, ticket.signature)
          : `${env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "")}/ticket/${ticket.code}`;
      const qrDataUrl = await resolveTicketQrDataUrl(ticket);

      await sendTicketEmailWithPdf({
        email: attendee.email,
        name: attendee.name,
        eventTitle: eventRecord?.title ?? "Evento",
        ticketUrl,
        qrDataUrl: qrDataUrl ?? undefined,
        code: ticket.code,
      });
    } catch (err) {
      console.error("Failed to resend ticket email:", err);
    }

    return NextResponse.json({ success: true });
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
