"use client";

/** Genera QR on-demand en el cliente (misma URL firmada que el servidor). */
export async function buildTicketQrDataUrlClient(
  code: string,
  signature: string | null | undefined,
): Promise<string | null> {
  if (!code || !signature) return null;

  const appUrl =
    (process.env.NEXT_PUBLIC_APP_URL ?? "").replace(/\/$/, "") ||
    (typeof window !== "undefined" ? window.location.origin : "");
  const QRCode = await import("qrcode");
  return QRCode.toDataURL(`${appUrl}/ticket/${code}?s=${signature}`);
}
