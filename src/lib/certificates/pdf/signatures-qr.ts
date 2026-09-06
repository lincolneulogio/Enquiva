import type { jsPDF } from "jspdf";
import type { CertificatePdfData, LoadedCertificateImages } from "./types";
import { detectImageFormat } from "./image-loader";
import { drawVectorSealFallback } from "./decorations";

export function drawSignaturesAndQr(
  doc: jsPDF,
  data: CertificatePdfData,
  images: LoadedCertificateImages,
  qrDataUrl: string,
  verifyUrl: string,
  pageWidth: number,
  pageHeight: number,
): void {
  const orgName = data.organizationName || "Organización Responsable";

  // [A] FLECHA 1 (IZQUIERDA): FIRMA Y AUTORIDAD RESPONSABLE
  const sigCenterX = 65;
  const sigLineY = 160;

  if (images.organizerImageDataUrl) {
    try {
      const avatarSize = 18;
      doc.addImage(
        images.organizerImageDataUrl,
        detectImageFormat(images.organizerImageDataUrl),
        sigCenterX - avatarSize / 2,
        sigLineY - avatarSize - 4,
        avatarSize,
        avatarSize
      );
      doc.setDrawColor(217, 119, 6);
      doc.setLineWidth(0.4);
      doc.rect(
        sigCenterX - avatarSize / 2 - 0.5,
        sigLineY - avatarSize - 4.5,
        avatarSize + 1,
        avatarSize + 1
      );
    } catch {
      doc.setFont("courier", "italic");
      doc.setFontSize(13);
      doc.setTextColor(30, 41, 59);
      doc.text("Firma Digital Registrada", sigCenterX, sigLineY - 4, { align: "center" });
    }
  } else {
    doc.setFont("courier", "italic");
    doc.setFontSize(12);
    doc.setTextColor(30, 41, 59);
    doc.text("Firma Digital Verificada", sigCenterX, sigLineY - 4, { align: "center" });
  }

  doc.setDrawColor(71, 85, 105);
  doc.setLineWidth(0.6);
  doc.line(sigCenterX - 35, sigLineY, sigCenterX + 35, sigLineY);

  const organizerDisplay = data.organizerName || "Dirección de Organización";
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.setTextColor(15, 23, 42);
  doc.text(organizerDisplay, sigCenterX, sigLineY + 5.5, { align: "center" });

  if (data.organizerTitle) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(71, 85, 105);
    doc.text(data.organizerTitle, sigCenterX, sigLineY + 9.5, { align: "center" });

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184);
    doc.text(orgName, sigCenterX, sigLineY + 13.5, { align: "center" });
  } else {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(71, 85, 105);
    doc.text(orgName, sigCenterX, sigLineY + 9.5, { align: "center" });

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184);
    doc.text("Firma y Sello de Autoridad Certificadora", sigCenterX, sigLineY + 13.5, { align: "center" });
  }

  // [B] FLECHA 2 (CENTRO): SELLO HOLOGRÁFICO OFICIAL ENQUIVA
  const sealCenterX = pageWidth / 2;
  const sealCenterY = 152;
  const sealRadius = 16.5;

  if (images.sealImageDataUrl) {
    try {
      const sealDiameter = sealRadius * 2;
      doc.addImage(
        images.sealImageDataUrl,
        detectImageFormat(images.sealImageDataUrl),
        sealCenterX - sealDiameter / 2,
        sealCenterY - sealDiameter / 2,
        sealDiameter,
        sealDiameter
      );
    } catch {
      drawVectorSealFallback(doc, sealCenterX, sealCenterY, sealRadius);
    }
  } else {
    drawVectorSealFallback(doc, sealCenterX, sealCenterY, sealRadius);
  }

  // [C] FLECHA 3 (DERECHA): QR CODE + BADGE DE CÓDIGO ANTI-FRAUDE
  const qrCenterX = pageWidth - 65;
  const qrY = 131;
  const qrSize = 28;

  if (qrDataUrl) {
    doc.setFillColor(255, 255, 255);
    doc.rect(qrCenterX - qrSize / 2 - 1.5, qrY - 1.5, qrSize + 3, qrSize + 3, "F");
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.3);
    doc.rect(qrCenterX - qrSize / 2 - 1.5, qrY - 1.5, qrSize + 3, qrSize + 3, "S");

    doc.addImage(qrDataUrl, "PNG", qrCenterX - qrSize / 2, qrY, qrSize, qrSize);
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(15, 23, 42);
  doc.text("VALIDACIÓN ANTI-FRAUDE", qrCenterX, qrY + qrSize + 4.5, { align: "center" });

  const chipWidth = 52;
  const chipHeight = 7;
  const chipX = qrCenterX - chipWidth / 2;
  const chipY = qrY + qrSize + 6;

  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(217, 119, 6);
  doc.setLineWidth(0.4);
  doc.roundedRect(chipX, chipY, chipWidth, chipHeight, 1.8, 1.8, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text(data.certificateCode, qrCenterX, chipY + 4.8, { align: "center" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.5);
  doc.setTextColor(100, 116, 139);
  doc.text("Escanea el código QR para verificar autenticidad", qrCenterX, chipY + 11, { align: "center" });

  // [D] FLECHA 4 (PIE DE PÁGINA): DISCLAIMER LEGAL
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  doc.text(
    `Documento oficial con validez digital emitido por la plataforma Enquiva • Verificación pública: ${verifyUrl}`,
    pageWidth / 2,
    pageHeight - 19,
    { align: "center" }
  );
}
