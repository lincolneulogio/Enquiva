import crypto from "crypto";
import { env } from "@/env";
import { absoluteUrl } from "@/lib/url";

export function computeTicketSignature(
  code: string,
  registrationId: string,
  issuedAt: Date,
): string {
  const payloadToSign = `${code}|${registrationId}|${issuedAt.toISOString()}`;
  return crypto.createHmac("sha256", env.TICKET_SIGNING_KEY).update(payloadToSign).digest("hex");
}

export function buildTicketPublicUrl(code: string, signature: string): string {
  return absoluteUrl(`/ticket/${code}?s=${signature}`);
}

type TicketSignatureFields = {
  code: string;
  registrationId: string;
  issuedAt: Date;
  signature?: string | null;
};

/** Verifica firma HMAC o coincidencia con la guardada en BD (compatibilidad legacy). */
export function verifyTicketSignature(
  ticket: TicketSignatureFields,
  providedSignature: string,
): boolean {
  if (!providedSignature?.trim()) return false;

  const provided = providedSignature.trim();
  if (ticket.signature && ticket.signature === provided) return true;

  const expected = computeTicketSignature(ticket.code, ticket.registrationId, ticket.issuedAt);
  return expected === provided;
}
