import QRCode from "qrcode";
import type { Ticket } from "@/lib/db/schema";
import { buildTicketPublicUrl } from "@/lib/tickets/signature";

type TicketQrFields = Pick<Ticket, "code" | "registrationId" | "issuedAt" | "signature">;

/** Genera data URL del QR apuntando a la URL pública firmada del ticket. */
export async function generateTicketQrDataUrl(
  code: string,
  registrationId: string,
  issuedAt: Date,
  signature: string,
): Promise<string> {
  const qrPayload = buildTicketPublicUrl(code, signature);
  return QRCode.toDataURL(qrPayload);
}

/** Resuelve QR on-demand a partir de la firma HMAC del ticket. */
export async function resolveTicketQrDataUrl(ticket: TicketQrFields): Promise<string | null> {
  if (!ticket.signature) return null;

  return generateTicketQrDataUrl(
    ticket.code,
    ticket.registrationId,
    ticket.issuedAt,
    ticket.signature,
  );
}
