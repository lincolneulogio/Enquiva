import QRCode from "qrcode";
import crypto from "crypto";
import { db } from "@/lib/db";
import { tickets, registrations } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { generateTicketCode } from "@/lib/utils";
import { env } from "@/env";

export async function generateTicketForRegistration(registrationId: string, eventId: string, userId: string) {
  const ticketCode = generateTicketCode();
  const appUrl = env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "");
  const issuedAt = new Date();
  const payloadToSign = `${ticketCode}|${registrationId}|${issuedAt.toISOString()}`;
  const signingKey = env.TICKET_SIGNING_KEY;
  const signature = crypto.createHmac("sha256", signingKey).update(payloadToSign).digest("hex");

  const qrPayload = `${appUrl}/ticket/${ticketCode}?s=${signature}`;
  const qrDataUrl = await QRCode.toDataURL(qrPayload);

  const ticketMetadata = { eventId, userId };

  const [ticket] = await db
    .insert(tickets)
    .values({
      registrationId,
      code: ticketCode,
      qrCode: qrDataUrl,
      signature,
      status: "active",
      metadata: ticketMetadata,
    })
    .onConflictDoUpdate({
      target: [tickets.registrationId],
      set: {
        qrCode: qrDataUrl,
        status: "active",
        issuedAt,
        signature,
        metadata: ticketMetadata,
      },
    })
    .returning();

  await db
    .update(registrations)
    .set({ qrCode: qrDataUrl })
    .where(eq(registrations.id, registrationId));

  return ticket;
}
