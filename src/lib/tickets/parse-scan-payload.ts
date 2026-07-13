/**
 * Normalizes raw QR / scanner payload into ticket code + optional signature.
 * Accepts: ticket URL, JSON, or plain TKT-XXXX code.
 */
export function parseTicketScanPayload(raw: string): {
  code: string;
  signature: string;
} {
  const detectedText = raw.trim();
  if (!detectedText) return { code: "", signature: "" };

  let code = "";
  let signature = "";

  if (detectedText.includes("/ticket/")) {
    const ticketIndex = detectedText.indexOf("/ticket/");
    const pathAndQuery = detectedText.substring(ticketIndex);
    const [path, queryStr] = pathAndQuery.split("?");
    const cleanSegments = path.split("/").filter(Boolean);
    code = cleanSegments[cleanSegments.length - 1] || "";

    if (queryStr) {
      const searchParams = new URLSearchParams(queryStr);
      signature = searchParams.get("s") || searchParams.get("signature") || "";
    }
  } else {
    try {
      const parsed = JSON.parse(detectedText) as {
        code?: string;
        signature?: string;
        s?: string;
      };
      code = parsed.code || "";
      signature = parsed.signature || parsed.s || "";
    } catch {
      code = detectedText;
    }
  }

  return { code: code.trim(), signature: signature.trim() };
}
