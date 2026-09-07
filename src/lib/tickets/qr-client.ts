"use client";

import { absoluteUrl } from "@/lib/url";

/** Genera QR on-demand en el cliente (misma URL firmada que el servidor). */
export async function buildTicketQrDataUrlClient(
  code: string,
  signature: string | null | undefined,
): Promise<string | null> {
  if (!code || !signature) return null;

  const QRCode = await import("qrcode");
  return QRCode.toDataURL(absoluteUrl(`/ticket/${code}?s=${signature}`));
}
