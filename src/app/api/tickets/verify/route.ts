import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { tickets, registrations, events, scanLogs } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import crypto from "crypto";
import { env } from "@/env";
import { ticketVerifyRatelimit } from "@/lib/redis";
import { headers } from "next/headers";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const code = String(body.code ?? "").trim();
    const providedSignature = String(body.signature ?? body.s ?? "").trim();
    if (!code) return NextResponse.json({ success: false, error: "Missing code" }, { status: 400 });

    const hdrs = await headers();
    const ip = hdrs.get("x-forwarded-for") ?? hdrs.get("x-real-ip") ?? "unknown";
    const { success } = await ticketVerifyRatelimit.limit(ip);
    if (!success) return NextResponse.json({ success: false, error: "Too many requests" }, { status: 429 });

    const [ticket] = await db.select().from(tickets).where(eq(tickets.code, code)).limit(1);
    if (!ticket) return NextResponse.json({ success: false, error: "Ticket not found" }, { status: 404 });

    const [registration] = await db
      .select()
      .from(registrations)
      .where(eq(registrations.id, ticket.registrationId))
      .limit(1);

    if (!registration) {
      return NextResponse.json({ success: false, error: "Registration not found" }, { status: 404 });
    }

    if (!providedSignature) {
      return NextResponse.json({ success: false, error: "Missing signature" }, { status: 400 });
    }

    const payloadToSign = `${ticket.code}|${ticket.registrationId}|${new Date(ticket.issuedAt).toISOString()}`;
    const expected = crypto.createHmac("sha256", env.TICKET_SIGNING_KEY).update(payloadToSign).digest("hex");
    if (expected !== providedSignature) {
      await db.insert(scanLogs).values({ ticketId: ticket.id, result: "signature_mismatch" }).returning();
      return NextResponse.json({ success: false, error: "Invalid signature" }, { status: 400 });
    }

    if (ticket.status !== "active") {
      await db.insert(scanLogs).values({ ticketId: ticket.id, result: `invalid_status:${ticket.status}` }).returning();
      return NextResponse.json({ success: false, error: "Ticket not valid", status: ticket.status }, { status: 400 });
    }

    const now = new Date();
    const [updatedTicket] = await db
      .update(tickets)
      .set({ status: "used", checkedInAt: now })
      .where(eq(tickets.id, ticket.id))
      .returning();

    await db
      .update(registrations)
      .set({ status: "checked_in", checkedInAt: now })
      .where(eq(registrations.id, ticket.registrationId));

    await db.insert(scanLogs).values({ ticketId: ticket.id, result: "ok" }).returning();

    const [eventRecord] = await db.select().from(events).where(eq(events.id, registration.eventId)).limit(1);

    return NextResponse.json({ success: true, ticket: updatedTicket, event: eventRecord ?? null });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}
