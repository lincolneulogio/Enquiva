import type { jsPDF } from "jspdf";
import { BRAND } from "@/lib/brand";

export interface CertificatePdfData {
  certificateCode: string;
  attendeeName: string;
  eventTitle: string;
  certificateTitle?: string | null;
  eventDate: Date | string;
  eventLocation?: string | null;
  isVirtual?: boolean;
  organizationName?: string | null;
  organizationLogo?: string | null;
  organizerName?: string | null;
  organizerImage?: string | null;
  organizerTitle?: string | null;
  platformLogo?: string | null;
  issuedAt?: Date | string | null;
}

/**
 * Convierte de forma segura una URL de imagen (relativa o absoluta) a DataURL base64.
 * Funciona de manera tolerante a fallos: si la imagen no carga, retorna null sin lanzar excepción.
 */
async function fetchImageAsDataUrl(src?: string | null): Promise<string | null> {
  if (!src) return null;
  if (src.startsWith("data:")) return src;
  if (typeof window === "undefined") return null;
  try {
    const res = await fetch(src, { mode: "cors" });
    if (!res.ok) return null;
    const blob = await res.blob();
    return await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

function detectImageFormat(dataUrl: string): "PNG" | "JPEG" {
  if (dataUrl.startsWith("data:image/jpeg") || dataUrl.startsWith("data:image/jpg")) {
    return "JPEG";
  }
  return "PNG";
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

  // Cargar imágenes de forma concurrente con fallback seguro
  const [platformLogoDataUrl, organizationLogoDataUrl, organizerImageDataUrl] =
    await Promise.all([
      fetchImageAsDataUrl(data.platformLogo || BRAND.logo.source || BRAND.logo.markLg),
      fetchImageAsDataUrl(data.organizationLogo),
      fetchImageAsDataUrl(data.organizerImage),
    ]);

  // URL de verificación oficial
  const publicDomain =
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ||
    (typeof window !== "undefined" && !window.location.host.includes("localhost")
      ? window.location.origin
      : `https://${BRAND.domain}`);
  const verifyUrl = `${publicDomain}/verify/${encodeURIComponent(data.certificateCode)}`;

  // Generar Código QR de alta densidad
  const qrDataUrl = await QRCode.toDataURL(verifyUrl, {
    width: 280,
    margin: 1,
    color: {
      dark: "#0f172a",
      light: "#ffffff",
    },
  });

  // --- 1. FONDO Y MARCO DE SEGURIDAD LUXURY ---
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

  // --- 2. CABECERA INSTITUCIONAL (ENQUIVA + ENTIDAD ORGANIZADORA) ---
  const headerY = 16;
  const enquivaLogoSize = 13.5; // 13.5 x 13.5 mm (proporción natural 1:1 nítida y estilizada)

  // [IZQUIERDA]: Logo Oficial de ENQUIVA
  if (platformLogoDataUrl) {
    try {
      doc.addImage(
        platformLogoDataUrl,
        detectImageFormat(platformLogoDataUrl),
        18,
        headerY,
        enquivaLogoSize,
        enquivaLogoSize
      );

      // Nombre de marca Enquiva al costado del isotipo
      doc.setFont("helvetica", "bold");
      doc.setFontSize(13);
      doc.setTextColor(15, 23, 42); // slate-900
      doc.text("ENQUIVA", 34, headerY + 6.5);

      doc.setFont("helvetica", "bold");
      doc.setFontSize(6.5);
      doc.setTextColor(217, 119, 6); // amber-600
      doc.text("SISTEMA DE CERTIFICACIÓN", 34, headerY + 10.5);
    } catch {
      // Fallback tipográfico si la imagen falla
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
  if (organizationLogoDataUrl) {
    try {
      doc.addImage(
        organizationLogoDataUrl,
        detectImageFormat(organizationLogoDataUrl),
        pageWidth - 46,
        headerY,
        28,
        13.5
      );
    } catch {
      // Fallback
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(15, 23, 42);
      doc.text(data.organizationName || "ENTIDAD", pageWidth - 18, headerY + 7, {
        align: "right",
      });
    }
  } else if (data.organizationName) {
    // Insignia formal con el nombre de la organización
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10.5);
    doc.setTextColor(15, 23, 42);
    doc.text(data.organizationName.toUpperCase(), pageWidth - 18, headerY + 6.5, {
      align: "right",
    });
    doc.setFont("helvetica", "bold");
    doc.setFontSize(6.5);
    doc.setTextColor(100, 116, 139);
    doc.text("ENTIDAD CERTIFICADORA", pageWidth - 18, headerY + 10.5, { align: "right" });
  }

  // Subtítulo central de cabecera
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184); // slate-400
  doc.text("SISTEMA DE ACREDITACIÓN & CREDENCIALES DIGITALES", pageWidth / 2, 22, {
    align: "center",
  });

  // --- 3. TÍTULO PRINCIPAL DE LA CERTIFICACIÓN ---
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.setTextColor(15, 23, 42); // slate-900
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
  doc.text("Se otorga con pleno reconocimiento oficial a:", pageWidth / 2, 46, {
    align: "center",
  });

  // --- 4. NOMBRE DEL ASISTENTE / DESTINATARIO ---
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

  // Pequeño diamante / acento dorado en el centro de la línea
  doc.setFillColor(217, 119, 6);
  const diamondX = pageWidth / 2;
  doc.triangle(
    diamondX,
    lineY - 1.5,
    diamondX - 2,
    lineY,
    diamondX + 2,
    lineY,
    "F"
  );
  doc.triangle(
    diamondX,
    lineY + 1.5,
    diamondX - 2,
    lineY,
    diamondX + 2,
    lineY,
    "F"
  );

  // --- 5. TEXTO DE PARTICIPACIÓN Y DETALLES DEL EVENTO ---
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10.5);
  doc.setTextColor(71, 85, 105);
  doc.text(
    "Por haber participado y completado satisfactoriamente las sesiones y horas académicas del evento:",
    pageWidth / 2,
    78,
    { align: "center" }
  );

  // Nombre del Evento (en negrita, destacado)
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(15, 23, 42);
  const maxTitleWidth = 210;
  const splitEventTitle = doc.splitTextToSize(data.eventTitle, maxTitleWidth);
  doc.text(splitEventTitle, pageWidth / 2, 88, { align: "center" });

  // Fecha y Sede Oficial
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
    ? "Modalidad Virtual / En Línea"
    : data.eventLocation
      ? `Sede: ${data.eventLocation}`
      : "Sede Oficial del Evento";

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  doc.setTextColor(100, 116, 139);
  doc.text(`Realizado el ${dateText} • ${locationText}`, pageWidth / 2, 104, {
    align: "center",
  });

  // Entidad Organizadora
  const orgName = data.organizationName || "Organización Responsable";
  doc.setFont("helvetica", "italic");
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.text(`Organizado e impartido por: ${orgName}`, pageWidth / 2, 111, {
    align: "center",
  });

  // Divisor ornamental
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.4);
  doc.line(30, 119, pageWidth - 30, 119);

  // --- 6. SECCIÓN INFERIOR: AUTORIDAD, SELLO OFICIAL Y QR ANTI-FRAUDE ---
  // [A] FLECHA 1 (IZQUIERDA): FIRMA Y AUTORIDAD RESPONSABLE
  const sigCenterX = 65;
  const sigLineY = 160;

  // Si tiene foto de perfil o firma del organizador, la mostramos elegantemente
  if (organizerImageDataUrl) {
    try {
      // Marco circular/cuadrado con avatar
      const avatarSize = 18;
      doc.addImage(
        organizerImageDataUrl,
        detectImageFormat(organizerImageDataUrl),
        sigCenterX - avatarSize / 2,
        sigLineY - avatarSize - 4,
        avatarSize,
        avatarSize
      );
      // Borde suave para el avatar
      doc.setDrawColor(217, 119, 6);
      doc.setLineWidth(0.4);
      doc.rect(
        sigCenterX - avatarSize / 2 - 0.5,
        sigLineY - avatarSize - 4.5,
        avatarSize + 1,
        avatarSize + 1
      );
    } catch {
      // Si falla, dibuja rúbrica manuscrita
      doc.setFont("courier", "italic");
      doc.setFontSize(13);
      doc.setTextColor(30, 41, 59);
      doc.text("Firma Digital Registrada", sigCenterX, sigLineY - 4, { align: "center" });
    }
  } else {
    // Rúbrica caligráfica elegante
    doc.setFont("courier", "italic");
    doc.setFontSize(12);
    doc.setTextColor(30, 41, 59);
    doc.text("Firma Digital Verificada", sigCenterX, sigLineY - 4, { align: "center" });
  }

  // Línea de firma
  doc.setDrawColor(71, 85, 105);
  doc.setLineWidth(0.6);
  doc.line(sigCenterX - 35, sigLineY, sigCenterX + 35, sigLineY);

  // Datos bajo la línea de firma
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
    doc.text("Firma y Sello de Autoridad Certificadora", sigCenterX, sigLineY + 13.5, {
      align: "center",
    });
  }

  // [B] FLECHA 2 (CENTRO): SELLO HOLOGRÁFICO OFICIAL ENQUIVA
  const sealCenterX = pageWidth / 2;
  const sealCenterY = 152;
  const sealRadius = 16.5;

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

  // Texto dentro del sello (perfectamente contenido con márgenes limpios)
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

  // [C] FLECHA 3 (DERECHA): QR CODE + BADGE DE CÓDIGO ANTI-FRAUDE
  const qrCenterX = pageWidth - 65;
  const qrY = 131;
  const qrSize = 28; // 28 x 28 mm

  if (qrDataUrl) {
    // Fondo blanco nítido con marco suave para el QR
    doc.setFillColor(255, 255, 255);
    doc.rect(qrCenterX - qrSize / 2 - 1.5, qrY - 1.5, qrSize + 3, qrSize + 3, "F");
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.3);
    doc.rect(qrCenterX - qrSize / 2 - 1.5, qrY - 1.5, qrSize + 3, qrSize + 3, "S");

    doc.addImage(qrDataUrl, "PNG", qrCenterX - qrSize / 2, qrY, qrSize, qrSize);
  }

  // Título sobre el QR
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(15, 23, 42);
  doc.text("VALIDACIÓN ANTI-FRAUDE", qrCenterX, qrY + qrSize + 4.5, { align: "center" });

  // Badge tipo chip de seguridad para el Código (Nueva tipografía Helvetica Bold moderna y legible)
  const chipWidth = 52;
  const chipHeight = 7;
  const chipX = qrCenterX - chipWidth / 2;
  const chipY = qrY + qrSize + 6;

  doc.setFillColor(248, 250, 252); // slate-50
  doc.setDrawColor(217, 119, 6); // amber-600
  doc.setLineWidth(0.4);
  doc.roundedRect(chipX, chipY, chipWidth, chipHeight, 1.8, 1.8, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42); // slate-900 nítido y de alto contraste
  doc.text(data.certificateCode, qrCenterX, chipY + 4.8, { align: "center" });

  // Subtexto explicativo debajo del chip
  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.5);
  doc.setTextColor(100, 116, 139);
  doc.text("Escanea el código QR para verificar autenticidad", qrCenterX, chipY + 11, {
    align: "center",
  });

  // [D] FLECHA 4 (PIE DE PÁGINA): DISCLAIMER LEGAL Y URL OFICIAL SUBIDO PARA VISIBILIDAD
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105); // slate-600 mucho más legible y nítido
  doc.text(
    `Documento oficial con validez digital emitido por la plataforma Enquiva • Verificación pública: ${verifyUrl}`,
    pageWidth / 2,
    pageHeight - 19,
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
