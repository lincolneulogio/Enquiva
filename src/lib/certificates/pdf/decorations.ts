import type { jsPDF } from "jspdf";

export function drawCertificateBorders(doc: jsPDF, pageWidth: number, pageHeight: number): void {
  // Fondo Marfil / Blanco Perla
  doc.setFillColor(254, 254, 255);
  doc.rect(0, 0, pageWidth, pageHeight, "F");

  // Franjas de acento superior e inferior
  doc.setFillColor(15, 23, 42); // Navy profundo
  doc.rect(0, 0, pageWidth, 5, "F");
  doc.rect(0, pageHeight - 5, pageWidth, 5, "F");

  doc.setFillColor(217, 119, 6); // Oro metálico
  doc.rect(0, 5, pageWidth, 1.5, "F");
  doc.rect(0, pageHeight - 6.5, pageWidth, 1.5, "F");

  // Marco exterior (Azul Noche Premium)
  doc.setDrawColor(15, 23, 42);
  doc.setLineWidth(1.2);
  doc.rect(10, 11, pageWidth - 20, pageHeight - 22);

  // Marco interior (Oro envejecido)
  doc.setDrawColor(217, 119, 6);
  doc.setLineWidth(0.4);
  doc.rect(13, 14, pageWidth - 26, pageHeight - 28);

  // Escuadras de esquina ornamentales
  const cornerSize = 9;
  doc.setDrawColor(217, 119, 6);
  doc.setLineWidth(0.9);
  // Top-left
  doc.line(9, 10, 9 + cornerSize, 10);
  doc.line(9, 10, 9, 10 + cornerSize);
  // Top-right
  doc.line(pageWidth - 9, 10, pageWidth - 9 - cornerSize, 10);
  doc.line(pageWidth - 9, 10, pageWidth - 9, 10 + cornerSize);
  // Bottom-left
  doc.line(9, pageHeight - 10, 9 + cornerSize, pageHeight - 10);
  doc.line(9, pageHeight - 10, 9, pageHeight - 10 - cornerSize);
  // Bottom-right
  doc.line(pageWidth - 9, pageHeight - 10, pageWidth - 9 - cornerSize, pageHeight - 10);
  doc.line(pageWidth - 9, pageHeight - 10, pageWidth - 9, pageHeight - 10 - cornerSize);
}

export function drawVectorSealFallback(
  doc: jsPDF,
  sealCenterX: number,
  sealCenterY: number,
  sealRadius: number,
): void {
  // Fondo sutil dorado del sello
  doc.setFillColor(254, 243, 199); // amber-100
  doc.circle(sealCenterX, sealCenterY, sealRadius, "F");

  // Anillos concéntricos dorados
  doc.setDrawColor(217, 119, 6); // amber-600
  doc.setLineWidth(0.8);
  doc.circle(sealCenterX, sealCenterY, sealRadius, "S");

  doc.setDrawColor(180, 83, 9); // amber-700
  doc.setLineWidth(0.3);
  doc.circle(sealCenterX, sealCenterY, sealRadius - 1.8, "S");

  // Texto dentro del sello
  doc.setFont("helvetica", "bold");
  doc.setFontSize(5.8);
  doc.setTextColor(180, 83, 9);
  doc.text("★ ENQUIVA VERIFIED ★", sealCenterX, sealCenterY - 5.5, { align: "center" });

  doc.setFontSize(9.5);
  doc.setTextColor(15, 23, 42);
  doc.text("AUTÉNTICO", sealCenterX, sealCenterY + 0.5, { align: "center" });

  doc.setFontSize(5.2);
  doc.setTextColor(100, 116, 139);
  doc.text("REGISTRO DIGITAL OFICIAL", sealCenterX, sealCenterY + 5.5, { align: "center" });

  doc.setFontSize(4.8);
  doc.setTextColor(180, 83, 9);
  doc.text("SEGURIDAD CRIPTOGRÁFICA", sealCenterX, sealCenterY + 8.8, { align: "center" });
}
