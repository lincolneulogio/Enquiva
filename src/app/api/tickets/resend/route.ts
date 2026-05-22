import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { tickets, registrations, users, events } from "@/lib/db/schema";
import { auth } from "@/lib/auth";
import { eq } from "drizzle-orm";
import { sendTicketEmailWithPdf } from "@/lib/mail";
import { env } from "@/env";
import { headers } from "next/headers";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const registrationId = String(body.registrationId ?? "");
    if (!registrationId) return NextResponse.json({ success: false, error: "Missing registrationId" }, { status: 400 });

    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    const [registration] = await db.select().from(registrations).where(eq(registrations.id, registrationId)).limit(1);
    if (!registration) return NextResponse.json({ success: false, error: "Registration not found" }, { status: 404 });

    const userId = session.user.id;
    if (registration.userId !== userId && session.user.role !== "admin" && session.user.role !== "organizer" && session.user.role !== "super_admin") {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    const [ticket] = await db.select().from(tickets).where(eq(tickets.registrationId, registrationId)).limit(1);
    if (!ticket) return NextResponse.json({ success: false, error: "Ticket not found" }, { status: 404 });

    const [attendee] = await db.select({ email: users.email, name: users.name }).from(users).where(eq(users.id, registration.userId)).limit(1);
    const [eventRecord] = await db.select({ id: events.id, title: events.title }).from(events).where(eq(events.id, registration.eventId)).limit(1);

    try {
      await sendTicketEmailWithPdf({
        email: attendee.email,
        name: attendee.name,
        eventTitle: eventRecord?.title ?? "Evento",
        ticketUrl: `${env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "")}/ticket/${ticket.code}`,
        qrDataUrl: ticket.qrCode,
        code: ticket.code,
      });
    } catch (err) {
      console.error("Failed to resend ticket email:", err);
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}
