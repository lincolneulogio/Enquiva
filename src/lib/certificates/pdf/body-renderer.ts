import type { jsPDF } from "jspdf";
import type { CertificatePdfData, LoadedCertificateImages } from "./types";
import { detectImageFormat } from "./image-loader";

export function drawCertificateHeaderAndBody(
  doc: jsPDF,
  data: CertificatePdfData,
  images: LoadedCertificateImages,
  pageWidth: number,
): void {
  const headerY = 16;
  const enquivaLogoSize = 13.5;

  // [IZQUIERDA]: Logo Oficial de ENQUIVA
  if (images.platformLogoDataUrl) {
    try {
      doc.addImage(
        images.platformLogoDataUrl,
        detectImageFormat(images.platformLogoDataUrl),
        18,
        headerY,
        enquivaLogoSize,
        enquivaLogoSize
      );

      doc.setFont("helvetica", "bold");
      doc.setFontSize(13);
      doc.setTextColor(15, 23, 42);
      doc.text("ENQUIVA", 34, headerY + 6.5);

      doc.setFont("helvetica", "bold");
      doc.setFontSize(6.5);
      doc.setTextColor(217, 119, 6);
      doc.text("SISTEMA DE CERTIFICACIÓN", 34, headerY + 10.5);
    } catch {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(14);
      doc.setTextColor(217, 119, 6);
      doc.text("ENQUIVA", 18, headerY + 8);
    }
  } else {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.setTextColor(217, 119, 6);
    doc.text("ENQUIVA", 18, headerY + 8);
  }

  // [DERECHA]: Logo Oficial de la Entidad Organizadora
  if (images.organizationLogoDataUrl) {
    try {
      doc.addImage(
        images.organizationLogoDataUrl,
        detectImageFormat(images.organizationLogoDataUrl),
        pageWidth - 46,
        headerY,
        28,
        13.5
      );
    } catch {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(15, 23, 42);
      doc.text(data.organizationName || "ENTIDAD", pageWidth - 18, headerY + 7, { align: "right" });
    }
  } else if (data.organizationName) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10.5);
    doc.setTextColor(15, 23, 42);
    doc.text(data.organizationName.toUpperCase(), pageWidth - 18, headerY + 6.5, { align: "right" });
    doc.setFont("helvetica", "bold");
    doc.setFontSize(6.5);
    doc.setTextColor(100, 116, 139);
    doc.text("ENTIDAD CERTIFICADORA", pageWidth - 18, headerY + 10.5, { align: "right" });
  }

  // Subtítulo central de cabecera
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  doc.text("SISTEMA DE ACREDITACIÓN & CREDENCIALES DIGITALES", pageWidth / 2, 22, { align: "center" });

  // Título Principal
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.setTextColor(15, 23, 42);
  const mainTitle = data.certificateTitle
    ? data.certificateTitle.toUpperCase()
    : "CERTIFICADO DE ASISTENCIA Y PARTICIPACIÓN";
  doc.text(mainTitle, pageWidth / 2, 34, { align: "center" });

  // Línea dorada de distinción del título
  doc.setDrawColor(217, 119, 6);
  doc.setLineWidth(0.6);
  doc.line(pageWidth / 2 - 40, 37, pageWidth / 2 + 40, 37);

  // Subtítulo de otorgamiento
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10.5);
  doc.setTextColor(100, 116, 139);
  doc.text("Se otorga con pleno reconocimiento oficial a:", pageWidth / 2, 46, { align: "center" });

  // Nombre del Asistente
  doc.setFont("helvetica", "bold");
  doc.setFontSize(27);
  doc.setTextColor(15, 23, 42);
  const cleanName = (data.attendeeName || "Participante").trim().toUpperCase();
  doc.text(cleanName, pageWidth / 2, 63, { align: "center" });

  // Subrayado dorado con rombo central ornamental
  const nameWidth = Math.min(doc.getTextWidth(cleanName) + 24, 190);
  const lineStart = (pageWidth - nameWidth) / 2;
  const lineEnd = (pageWidth + nameWidth) / 2;
  const lineY = 68;

  doc.setDrawColor(217, 119, 6);
  doc.setLineWidth(0.8);
  doc.line(lineStart, lineY, lineEnd, lineY);

  doc.setFillColor(217, 119, 6);
  const diamondX = pageWidth / 2;
  doc.triangle(diamondX, lineY - 1.5, diamondX - 2, lineY, diamondX + 2, lineY, "F");
  doc.triangle(diamondX, lineY + 1.5, diamondX - 2, lineY, diamondX + 2, lineY, "F");

  // Texto de Participación
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10.5);
  doc.setTextColor(71, 85, 105);
  doc.text(
    "Por haber participado y completado satisfactoriamente las sesiones y horas académicas del evento:",
    pageWidth / 2,
    78,
    { align: "center" }
  );

  // Nombre del Evento
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(15, 23, 42);
  const maxTitleWidth = 210;
  const splitEventTitle = doc.splitTextToSize(data.eventTitle, maxTitleWidth);
  doc.text(splitEventTitle, pageWidth / 2, 88, { align: "center" });

  // Fecha y Sede
  let dateText = "";
  try {
    const d = new Date(data.eventDate);
    dateText = d.toLocaleDateString("es-PE", { day: "numeric", month: "long", year: "numeric" });
  } catch {
    dateText = String(data.eventDate);
  }

  const locationText = data.isVirtual
    ? "Modalidad Virtual / En Línea"
    : data.eventLocation ? `Sede: ${data.eventLocation}` : "Sede Oficial del Evento";

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  doc.setTextColor(100, 116, 139);
  doc.text(`Realizado el ${dateText} • ${locationText}`, pageWidth / 2, 104, { align: "center" });

  const orgName = data.organizationName || "Organización Responsable";
  doc.setFont("helvetica", "italic");
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.text(`Organizado e impartido por: ${orgName}`, pageWidth / 2, 111, { align: "center" });

  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.4);
  doc.line(30, 119, pageWidth - 30, 119);
}
