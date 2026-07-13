import type { jsPDF } from "jspdf";
import { BRAND } from "@/lib/brand";

export const TICKET_PDF_SIZE = { width: 320, height: 520 } as const;

export type TicketPdfLocale = "es" | "en";

/** Mirrors AccentColorInitializer light primaries (settings → brand-accent). */
const SETTINGS_ACCENT_PRIMARY_HSL: Record<string, string> = {
  amber: "32 91% 44%",
  emerald: "142 70% 36%",
  rose: "330 81% 52%",
  blue: "217 91% 56%",
};

export interface TicketPdfContent {
  eventTitle: string;
  eventDateLabel?: string;
  locationLabel?: string;
  attendeeName?: string | null;
  statusLabel: string;
  ticketCode?: string;
  qrDataUrl?: string | null;
  locale?: TicketPdfLocale;
}

export interface TicketPdfTheme {
  primary: [number, number, number];
  logoDataUrl?: string | null;
  brandName?: string;
}

/** Default accent (amber) — matches globals.css / settings default. */
export const DEFAULT_TICKET_PRIMARY: [number, number, number] = [214, 119, 10];

function clampByte(n: number) {
  return Math.max(0, Math.min(255, Math.round(n)));
}

export function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  const sat = s / 100;
  const light = l / 100;
  const a = sat * Math.min(light, 1 - light);
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    return light - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
  };
  return [clampByte(f(0) * 255), clampByte(f(8) * 255), clampByte(f(4) * 255)];
}

export function parseHslCss(value: string): [number, number, number] | null {
  const parts = value.trim().split(/\s+/);
  if (parts.length < 3) return null;
  const h = Number.parseFloat(parts[0]);
  const s = Number.parseFloat(parts[1]);
  const l = Number.parseFloat(parts[2]);
  if ([h, s, l].some((n) => Number.isNaN(n))) return null;
  return hslToRgb(h, s, l);
}

export function accentKeyToRgb(key: string) {
  const hsl = SETTINGS_ACCENT_PRIMARY_HSL[key];
  if (!hsl) return DEFAULT_TICKET_PRIMARY;
  return parseHslCss(hsl) ?? DEFAULT_TICKET_PRIMARY;
}

/** Client: active settings accent → RGB for PDF. */
export function getActiveTicketPrimaryRgb(): [number, number, number] {
  if (typeof window === "undefined") return DEFAULT_TICKET_PRIMARY;

  try {
    const saved = localStorage.getItem("brand-accent");
    if (saved && SETTINGS_ACCENT_PRIMARY_HSL[saved]) {
      return accentKeyToRgb(saved);
    }
  } catch {
    /* ignore */
  }

  const css = getComputedStyle(document.documentElement)
    .getPropertyValue("--primary")
    .trim();
  return parseHslCss(css) ?? DEFAULT_TICKET_PRIMARY;
}

/** Client: load brand mark as data URL for jsPDF. */
export async function loadBrandLogoDataUrl(
  src: string = BRAND.logo.markMd,
): Promise<string | null> {
  try {
    const res = await fetch(src);
    if (!res.ok) return null;
    const blob = await res.blob();
    return await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

function mixRgb(
  a: [number, number, number],
  b: [number, number, number],
  t: number,
): [number, number, number] {
  return [
    clampByte(a[0] + (b[0] - a[0]) * t),
    clampByte(a[1] + (b[1] - a[1]) * t),
    clampByte(a[2] + (b[2] - a[2]) * t),
  ];
}

function pageBg(): [number, number, number] {
  return [252, 252, 253];
}

/**
 * Draws one elegant official ticket page onto an existing jsPDF doc.
 * Callers create the document / addPage; this only paints the current page.
 */
export function drawOfficialTicketPage(
  doc: jsPDF,
  content: TicketPdfContent,
  theme: TicketPdfTheme = { primary: DEFAULT_TICKET_PRIMARY },
) {
  const W = TICKET_PDF_SIZE.width;
  const H = TICKET_PDF_SIZE.height;
  const locale = content.locale ?? "es";
  const brandName = theme.brandName ?? BRAND.name;
  const primary = theme.primary;
  const primarySoft = mixRgb(primary, [255, 255, 255], 0.22);
  const primaryDeep = mixRgb(primary, [0, 0, 0], 0.18);
  const ink: [number, number, number] = [28, 28, 30];
  const muted: [number, number, number] = [110, 110, 118];
  const line: [number, number, number] = [228, 228, 232];
  const bg = pageBg();

  // Page background
  doc.setFillColor(...bg);
  doc.rect(0, 0, W, H, "F");

  // --- Header ---
  const headerH = 92;
  doc.setFillColor(...primary);
  doc.rect(0, 0, W, headerH, "F");

  // Soft decorative orbs (subtle, not loud)
  doc.setFillColor(...primarySoft);
  doc.circle(W - 28, 18, 46, "F");
  doc.setFillColor(...primaryDeep);
  doc.circle(18, headerH - 6, 28, "F");

  // Brand lockup: logo + name centered
  const logoSize = 26;
  const brandGap = 8;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  const nameWidth = doc.getTextWidth(brandName);
  const lockupWidth = (theme.logoDataUrl ? logoSize + brandGap : 0) + nameWidth;
  const lockupX = (W - lockupWidth) / 2;
  const brandY = 38;

  if (theme.logoDataUrl) {
    // White disc behind logo so black-backed marks stay clean on any accent
    doc.setFillColor(255, 255, 255);
    doc.circle(lockupX + logoSize / 2, brandY - 2, logoSize / 2 + 3, "F");
    try {
      doc.addImage(
        theme.logoDataUrl,
        "PNG",
        lockupX,
        brandY - logoSize / 2 - 2,
        logoSize,
        logoSize,
      );
    } catch {
      /* logo optional */
    }
  }

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text(
    brandName,
    theme.logoDataUrl ? lockupX + logoSize + brandGap : lockupX,
    brandY + 5,
  );

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(255, 255, 255);
  // Slightly translucent feel via soft mix
  const subtitle = mixRgb([255, 255, 255], primary, 0.12);
  doc.setTextColor(...subtitle);
  doc.text(
    locale === "en" ? "Official Event Ticket" : "Entrada Oficial del Evento",
    W / 2,
    62,
    { align: "center" },
  );

  // Thin accent bar under header
  doc.setFillColor(...mixRgb(primary, [255, 255, 255], 0.35));
  doc.rect(0, headerH, W, 3, "F");

  // --- Body ---
  let y = headerH + 28;
  const mx = 22;

  doc.setTextColor(...ink);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  const splitTitle = doc.splitTextToSize(content.eventTitle, W - mx * 2);
  doc.text(splitTitle, mx, y);
  y += splitTitle.length * 17 + 10;

  doc.setDrawColor(...line);
  doc.setLineWidth(0.8);
  doc.line(mx, y, W - mx, y);
  y += 18;

  const col2 = 168;
  const label = (text: string, x: number, yy: number) => {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(...muted);
    doc.text(text.toUpperCase(), x, yy);
  };
  const value = (text: string, x: number, yy: number, maxW: number) => {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9.5);
    doc.setTextColor(...ink);
    const lines = doc.splitTextToSize(text, maxW);
    doc.text(lines, x, yy);
    return lines.length;
  };

  if (content.eventDateLabel || content.locationLabel) {
    label(locale === "en" ? "Date & Time" : "Fecha y hora", mx, y);
    label(locale === "en" ? "Location" : "Lugar / ubicación", col2, y);
    y += 12;
    const dLines = content.eventDateLabel
      ? value(content.eventDateLabel, mx, y, 130)
      : 1;
    const lLines = content.locationLabel
      ? value(content.locationLabel, col2, y, 130)
      : 1;
    y += Math.max(dLines, lLines) * 12 + 14;

    doc.setDrawColor(...line);
    doc.line(mx, y, W - mx, y);
    y += 18;
  }

  label(locale === "en" ? "Attendee" : "Asistente", mx, y);
  label(locale === "en" ? "Status" : "Estado", col2, y);
  y += 12;
  const aLines = value(content.attendeeName || "—", mx, y, 130);
  const sLines = value(content.statusLabel, col2, y, 130);
  y += Math.max(aLines, sLines) * 12 + 16;

  // --- Tear-off ---
  doc.setDrawColor(190, 190, 196);
  doc.setLineDashPattern([3.5, 3.5], 0);
  doc.setLineWidth(0.9);
  doc.line(14, y, W - 14, y);
  doc.setLineDashPattern([], 0);

  doc.setFillColor(...bg);
  doc.circle(0, y, 7, "F");
  doc.circle(W, y, 7, "F");
  y += 22;

  // --- QR block ---
  if (content.qrDataUrl) {
    const qrSize = 108;
    const framePad = 10;
    const frameW = qrSize + framePad * 2;
    const frameX = (W - frameW) / 2;

    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(...mixRgb(primary, [200, 200, 200], 0.55));
    doc.setLineWidth(1);
    doc.roundedRect(frameX, y, frameW, frameW, 10, 10, "FD");

    try {
      doc.addImage(
        content.qrDataUrl,
        "PNG",
        frameX + framePad,
        y + framePad,
        qrSize,
        qrSize,
      );
    } catch (err) {
      console.error("Failed to add QR to ticket PDF:", err);
    }
    y += frameW + 14;
  }

  if (content.ticketCode) {
    doc.setFont("courier", "bold");
    doc.setFontSize(12);
    doc.setTextColor(...ink);
    doc.text(content.ticketCode, W / 2, y, { align: "center" });
    y += 14;
  }

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(...muted);
  doc.text(
    locale === "en"
      ? "Please present this code at the event entrance."
      : "Por favor, presente este código en el ingreso al evento.",
    W / 2,
    y,
    { align: "center" },
  );

  // Footer brand whisper
  doc.setFontSize(7);
  doc.setTextColor(...mixRgb(muted, bg, 0.25));
  doc.text(brandName, W / 2, H - 16, { align: "center" });
}

export function createTicketPdfDoc(jsPDFCtor: typeof jsPDF) {
  return new jsPDFCtor({
    orientation: "portrait",
    unit: "pt",
    format: [TICKET_PDF_SIZE.width, TICKET_PDF_SIZE.height],
  });
}
