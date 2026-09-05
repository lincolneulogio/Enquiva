import type { jsPDF } from "jspdf";

export interface CertificatePdfData {
  certificateCode: string;
  attendeeName: string;
  eventTitle: string;
  certificateTitle?: string | null;
  eventDate: Date | string;
  eventLocation?: string | null;
  isVirtual?: boolean;
  organizationName?: string | null;
  issuedAt?: Date | string | null;
}

export async function generateCertificatePdf(data: CertificatePdfData) {
  const [{ jsPDF }, QRCode] = await Promise.all([
    import("jspdf"),
    import("qrcode"),
  ]);

  const doc = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: "a4", // 297 x 210 mm
  });

  const pageWidth = 297;
  const pageHeight = 210;

  // Build verification URL for QR
  const appUrl =
    (process.env.NEXT_PUBLIC_APP_URL ?? "").replace(/\/$/, "") ||
    (typeof window !== "undefined" ? window.location.origin : "https://enquiva.site");
  const verifyUrl = `${appUrl}/verify/${encodeURIComponent(data.certificateCode)}`;

  // Generate QR Code data URL
  const qrDataUrl = await QRCode.toDataURL(verifyUrl, {
    width: 240,
    margin: 1,
    color: {
      dark: "#0f172a",
      light: "#ffffff",
    },
  });

  // --- 1. Background Fill ---
  doc.setFillColor(252, 252, 253);
  doc.rect(0, 0, pageWidth, pageHeight, "F");

  // Subtle background pattern / tint top and bottom
  doc.setFillColor(241, 245, 249);
  doc.rect(0, 0, pageWidth, 6, "F");
  doc.rect(0, pageHeight - 6, pageWidth, 6, "F");

  // --- 2. Ornamental Borders ---
  // Outer Border (Navy)
  doc.setDrawColor(15, 23, 42); // slate-900
  doc.setLineWidth(1.2);
  doc.rect(10, 10, pageWidth - 20, pageHeight - 20);

  // Inner Accent Border (Gold)
  doc.setDrawColor(217, 119, 6); // amber-600
  doc.setLineWidth(0.4);
  doc.rect(13, 13, pageWidth - 26, pageHeight - 26);

  // Corner Accent Brackets
  const cornerSize = 8;
  doc.setDrawColor(217, 119, 6);
  doc.setLineWidth(1.0);
  // Top-left
  doc.line(9, 9, 9 + cornerSize, 9);
  doc.line(9, 9, 9, 9 + cornerSize);
  // Top-right
  doc.line(pageWidth - 9, 9, pageWidth - 9 - cornerSize, 9);
  doc.line(pageWidth - 9, 9, pageWidth - 9, 9 + cornerSize);
  // Bottom-left
  doc.line(9, pageHeight - 9, 9 + cornerSize, pageHeight - 9);
  doc.line(9, pageHeight - 9, 9, pageHeight - 9 - cornerSize);
  // Bottom-right
  doc.line(pageWidth - 9, pageHeight - 9, pageWidth - 9 - cornerSize, pageHeight - 9);
  doc.line(pageWidth - 9, pageHeight - 9, pageWidth - 9, pageHeight - 9 - cornerSize);

  // --- 3. Header: Brand & Certificate Title ---
  // Brand Header
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139); // slate-500
  doc.text("ENQUIVA OFFICIAL CREDENTIALS", pageWidth / 2, 24, { align: "center" });

  // Main Ribbon Title
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.setTextColor(15, 23, 42); // slate-900
  const mainTitle = data.certificateTitle
    ? data.certificateTitle.toUpperCase()
    : "CERTIFICADO DE ASISTENCIA Y PARTICIPACIÓN";
  doc.text(mainTitle, pageWidth / 2, 36, { align: "center" });

  // Subtitle
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.setTextColor(100, 116, 139);
  doc.text("Se otorga la presente certificación oficial a:", pageWidth / 2, 47, { align: "center" });

  // --- 4. Recipient Name ---
  doc.setFont("helvetica", "bold");
  doc.setFontSize(26);
  doc.setTextColor(15, 23, 42);
  const cleanName = (data.attendeeName || "Participante").trim().toUpperCase();
  doc.text(cleanName, pageWidth / 2, 64, { align: "center" });

  // Decorative Golden Underline below attendee name
  const nameWidth = Math.min(doc.getTextWidth(cleanName) + 20, 180);
  doc.setDrawColor(217, 119, 6); // amber-600
  doc.setLineWidth(0.8);
  doc.line((pageWidth - nameWidth) / 2, 69, (pageWidth + nameWidth) / 2, 69);

  // --- 5. Event Context & Participation Text ---
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.setTextColor(71, 85, 105); // slate-600
  doc.text(
    "Por haber participado y completado exitosamente las sesiones programadas del evento:",
    pageWidth / 2,
    79,
    { align: "center" }
  );

  // Event Title
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(15, 23, 42); // slate-900
  const maxTitleWidth = 200;
  const splitEventTitle = doc.splitTextToSize(data.eventTitle, maxTitleWidth);
  doc.text(splitEventTitle, pageWidth / 2, 89, { align: "center" });

  // Event Details (Date & Location)
  let dateText = "";
  try {
    const d = new Date(data.eventDate);
    dateText = d.toLocaleDateString("es-PE", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  } catch {
    dateText = String(data.eventDate);
  }

  const locationText = data.isVirtual
    ? "Modalidad Virtual / Online"
    : data.eventLocation
    ? `Sede: ${data.eventLocation}`
    : "Sede Oficial del Evento";

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139);
  doc.text(`Realizado el ${dateText} • ${locationText}`, pageWidth / 2, 107, { align: "center" });

  // Organization acknowledgement
  const orgName = data.organizationName || "Operaciones Enquiva";
  doc.setFont("helvetica", "italic");
  doc.setFontSize(9.5);
  doc.setTextColor(100, 116, 139);
  doc.text(`Organizado e impartido por: ${orgName}`, pageWidth / 2, 115, { align: "center" });

  // Decorative divider
  doc.setDrawColor(226, 232, 240); // slate-200
  doc.setLineWidth(0.4);
  doc.line(30, 124, pageWidth - 30, 124);

  // --- 6. Bottom Signatures & Anti-Fraud Section ---
  const bottomY = 145;

  // Left Column: Organizer Signature & Verification
  doc.setDrawColor(71, 85, 105);
  doc.setLineWidth(0.5);
  doc.line(35, bottomY + 16, 105, bottomY + 16);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text(orgName, 70, bottomY + 22, { align: "center" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text("Entidad Organizadora Responsable", 70, bottomY + 27, { align: "center" });

  // Center Column: Official Enquiva Anti-Fraud Seal
  const sealCenterX = pageWidth / 2;
  const sealCenterY = bottomY + 14;

  // Draw circular seal
  doc.setDrawColor(217, 119, 6); // amber-600
  doc.setLineWidth(0.7);
  doc.circle(sealCenterX, sealCenterY, 14, "S");
  doc.setLineWidth(0.3);
  doc.circle(sealCenterX, sealCenterY, 12.5, "S");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(6.5);
  doc.setTextColor(217, 119, 6);
  doc.text("ENQUIVA VERIFIED", sealCenterX, sealCenterY - 4, { align: "center" });
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text("AUTÉNTICO", sealCenterX, sealCenterY + 1, { align: "center" });
  doc.setFontSize(5.5);
  doc.setTextColor(100, 116, 139);
  doc.text("SEGURIDAD DIGITAL", sealCenterX, sealCenterY + 6, { align: "center" });

  // Right Column: QR Code & Verification Data
  const qrX = pageWidth - 70;
  const qrY = bottomY - 5;
  const qrSize = 30; // 30 x 30 mm

  if (qrDataUrl) {
    doc.addImage(qrDataUrl, "PNG", qrX, qrY, qrSize, qrSize);
  }

  // QR Labeling
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(15, 23, 42);
  doc.text("VALIDACIÓN ANTI-FRAUDE", qrX + qrSize / 2, qrY + qrSize + 4.5, { align: "center" });

  doc.setFont("courier", "bold");
  doc.setFontSize(8);
  doc.setTextColor(217, 119, 6);
  doc.text(data.certificateCode, qrX + qrSize / 2, qrY + qrSize + 9, { align: "center" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.5);
  doc.setTextColor(100, 116, 139);
  doc.text("Escanea el QR para verificar", qrX + qrSize / 2, qrY + qrSize + 13, { align: "center" });

  // Footer Disclaimer
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(148, 163, 184); // slate-400
  doc.text(
    `Este documento digital cuenta con firma y código de verificación criptográfica emitido por la plataforma Enquiva (${verifyUrl}).`,
    pageWidth / 2,
    pageHeight - 13,
    { align: "center" }
  );

  return {
    doc,
    download: (filename?: string) => {
      const cleanSlug = data.eventTitle.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 30);
      const name = filename || `Certificado_${cleanSlug}_${data.certificateCode}.pdf`;
      doc.save(name);
    },
    getDataUri: () => doc.output("datauristring"),
    getBlob: () => doc.output("blob"),
  };
}
