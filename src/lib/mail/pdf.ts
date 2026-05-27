import { jsPDF } from "jspdf";

export async function generatePdfBuffer(opts: {
  eventTitle: string;
  code?: string;
  qrDataUrl?: string;
  attendeeName?: string | null;
}) {
  // Create a compact ticket-sized document (width: 320pt, height: 520pt)
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "pt",
    format: [320, 520],
  });

  // --- 1. CABECERA PREMIUM (BANNER SUPERIOR) ---
  doc.setFillColor(109, 76, 217); // Violet
  doc.rect(0, 0, 320, 95, "F");

  // Decorative circles in banner
  doc.setFillColor(124, 93, 230);
  doc.circle(280, 20, 40, "F");
  doc.setFillColor(93, 58, 208);
  doc.circle(30, 80, 25, "F");

  // App Title
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text("ENCUENTRO DE FE", 160, 40, { align: "center" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(215, 205, 255);
  doc.text("Entrada Oficial del Evento", 160, 58, { align: "center" });

  // --- 2. DETALLES DEL EVENTO ---
  doc.setTextColor(30, 30, 30);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);

  const splitTitle = doc.splitTextToSize(opts.eventTitle, 280);
  doc.text(splitTitle, 20, 130);

  const titleHeight = splitTitle.length * 18;
  let currentY = 130 + titleHeight + 5;

  // Thin dividing line
  doc.setDrawColor(230, 230, 230);
  doc.setLineWidth(1);
  doc.line(20, currentY, 300, currentY);
  currentY += 20;

  // Attendee details
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(120, 120, 120);
  doc.text("ASISTENTE", 20, currentY);
  doc.text("ESTADO", 165, currentY);

  currentY += 14;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(40, 40, 40);
  doc.text(opts.attendeeName || "—", 20, currentY);
  doc.text("Activo / Registrado", 165, currentY);

  currentY += 20;

  // --- 3. TICKET STUB (TEAR-OFF / SECCIÓN QR) ---
  doc.setDrawColor(180, 180, 180);
  doc.setLineDashPattern([4, 4], 0);
  doc.line(15, currentY, 305, currentY);
  doc.setLineDashPattern([], 0); // reset

  // Border notches
  doc.setFillColor(250, 252, 255);
  doc.circle(0, currentY, 8, "F");
  doc.circle(320, currentY, 8, "F");

  currentY += 25;

  // Draw the QR Code image
  if (opts.qrDataUrl) {
    try {
      const qrSize = 100;
      const qrX = (320 - qrSize) / 2;
      doc.addImage(opts.qrDataUrl, "PNG", qrX, currentY, qrSize, qrSize);
      currentY += qrSize + 15;
    } catch (err) {
      console.error("Failed to add QR image in PDF generator:", err);
      currentY += 15;
    }
  }

  // Ticket Code
  if (opts.code) {
    doc.setTextColor(80, 80, 80);
    doc.setFont("courier", "bold");
    doc.setFontSize(12);
    doc.text(opts.code, 160, currentY, { align: "center" });
    
    currentY += 15;
  }

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(140, 140, 140);
  doc.text(
    "Por favor, presente este código en el ingreso al evento.",
    160,
    currentY,
    { align: "center" }
  );

  const pdfArrayBuffer = doc.output("arraybuffer");
  return Buffer.from(pdfArrayBuffer);
}
