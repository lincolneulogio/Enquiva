import { readFileSync } from "fs";
import path from "path";
import { jsPDF } from "jspdf";
import { BRAND } from "@/lib/brand";
import {
  createTicketPdfDoc,
  DEFAULT_TICKET_PRIMARY,
  drawOfficialTicketPage,
} from "@/lib/tickets/render-ticket-pdf";

function loadServerLogoDataUrl(): string | null {
  try {
    const relativePath = BRAND.logo.markMd.replace(/^\//, "");
    const filePath = path.join(process.cwd(), "public", relativePath);
    const buf = readFileSync(filePath);
    return `data:image/png;base64,${buf.toString("base64")}`;
  } catch (error) {
    console.error("[mail] Failed to load brand logo for ticket PDF:", error);
    return null;
  }
}

export async function generatePdfBuffer(opts: {
  eventTitle: string;
  code?: string;
  qrDataUrl?: string;
  attendeeName?: string | null;
  eventDateLabel?: string;
  locationLabel?: string;
  statusLabel?: string;
  locale?: "es" | "en";
}) {
  const doc = createTicketPdfDoc(jsPDF);
  const locale = opts.locale ?? "es";

  drawOfficialTicketPage(
    doc,
    {
      eventTitle: opts.eventTitle,
      eventDateLabel: opts.eventDateLabel,
      locationLabel: opts.locationLabel,
      attendeeName: opts.attendeeName,
      statusLabel:
        opts.statusLabel ??
        (locale === "en" ? "Active / Registered" : "Activo / Registrado"),
      ticketCode: opts.code,
      qrDataUrl: opts.qrDataUrl,
      locale,
    },
    {
      primary: DEFAULT_TICKET_PRIMARY,
      logoDataUrl: loadServerLogoDataUrl(),
    },
  );

  const pdfArrayBuffer = doc.output("arraybuffer");
  return Buffer.from(pdfArrayBuffer);
}
