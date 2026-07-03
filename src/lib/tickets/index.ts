import { db, type DBClient } from "@/lib/db";import { tickets, registrations } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { generateTicketCode } from "@/lib/utils";
import { computeTicketSignature } from "@/lib/tickets/signature";

export { computeTicketSignature, buildTicketPublicUrl, verifyTicketSignature } from "@/lib/tickets/signature";
export { generateTicketQrDataUrl, resolveTicketQrDataUrl } from "@/lib/tickets/qr";
export { TicketCheckInService } from "@/lib/tickets/check-in";

export async function generateTicketForRegistration(
  registrationId: string,
  eventId: string,
  userId: string,
  tx: DBClient = db,
) {
  const ticketCode = generateTicketCode();
  const issuedAt = new Date();
  const signature = computeTicketSignature(ticketCode, registrationId, issuedAt);
  const ticketMetadata = { eventId, userId };

  const [existingTicket] = await tx
    .select()
    .from(tickets)
    .where(eq(tickets.registrationId, registrationId))
    .limit(1);

  const ticket = existingTicket
    ? (
        await tx
          .update(tickets)
          .set({
            status: "active",
            issuedAt,
            signature,
            metadata: ticketMetadata,
          })
          .where(eq(tickets.id, existingTicket.id))
          .returning()
      )[0]
    : (
        await tx
          .insert(tickets)
          .values({
            registrationId,
            code: ticketCode,
            signature,
            status: "active",
            metadata: ticketMetadata,
          })
          .returning()
      )[0];

  return ticket;
}
