import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { tickets, registrations, events, scanLogs } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import crypto from "crypto";
import { env } from "@/env";
import { ticketVerifyRatelimit } from "@/lib/redis";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    // 1. Authenticate the user performing the scan
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    // 2. Authorize the user (must be admin, super_admin, or organizer)
    const role = session.user.role;
    if (role !== "admin" && role !== "super_admin" && role !== "organizer") {
      return NextResponse.json({ success: false, error: "Forbidden: No tienes permisos para escanear tickets" }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
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

    const [eventRecord] = await db.select().from(events).where(eq(events.id, registration.eventId)).limit(1);

    // 3. For organizers, enforce event ownership
    if (role === "organizer" && eventRecord && eventRecord.organizerId !== session.user.id) {
      return NextResponse.json({ success: false, error: "Forbidden: No puedes verificar tickets de un evento que no organizas" }, { status: 403 });
    }

    if (!providedSignature) {
      return NextResponse.json({ success: false, error: "Missing signature" }, { status: 400 });
    }

    const provided = providedSignature;
    const dbSignature = ticket.signature;

    // Verificar firma comparando con la guardada en BD, con fallback criptográfico para compatibilidad legacy
    let isSignatureValid = false;
    if (dbSignature && dbSignature === provided) {
      isSignatureValid = true;
    } else {
      const payloadToSign = `${ticket.code}|${ticket.registrationId}|${new Date(ticket.issuedAt).toISOString()}`;
      const expected = crypto.createHmac("sha256", env.TICKET_SIGNING_KEY).update(payloadToSign).digest("hex");
      isSignatureValid = (expected === provided);
    }

    if (!isSignatureValid) {
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

    return NextResponse.json({ success: true, ticket: updatedTicket, event: eventRecord ?? null });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}
