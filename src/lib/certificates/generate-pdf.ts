import { BRAND } from "@/lib/brand";
import type { CertificatePdfData } from "./pdf/types";
import { PAGE_WIDTH, PAGE_HEIGHT } from "./pdf/types";
import { loadCertificateImages } from "./pdf/image-loader";
import { drawCertificateBorders } from "./pdf/decorations";
import { drawCertificateHeaderAndBody } from "./pdf/body-renderer";
import { drawSignaturesAndQr } from "./pdf/signatures-qr";

export type { CertificatePdfData } from "./pdf/types";

export async function generateCertificatePdf(data: CertificatePdfData) {
  const [{ jsPDF }, QRCode] = await Promise.all([
    import("jspdf"),
    import("qrcode"),
  ]);

  const doc = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: "a4",
  });

  const images = await loadCertificateImages(data);

  const publicDomain =
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ||
    (typeof window !== "undefined" && !window.location.host.includes("localhost")
      ? window.location.origin
      : `https://${BRAND.domain}`);
  const verifyUrl = `${publicDomain}/verify/${encodeURIComponent(data.certificateCode)}`;

  const qrDataUrl = await QRCode.toDataURL(verifyUrl, {
    width: 280,
    margin: 1,
    color: {
      dark: "#0f172a",
      light: "#ffffff",
    },
  });

  // 1. Fondo y marcos
  drawCertificateBorders(doc, PAGE_WIDTH, PAGE_HEIGHT);

  // 2. Cabecera y cuerpo (asistente, evento, fecha)
  drawCertificateHeaderAndBody(doc, data, images, PAGE_WIDTH);

  // 3. Firma, sello oficial y QR anti-fraude
  drawSignaturesAndQr(doc, data, images, qrDataUrl, verifyUrl, PAGE_WIDTH, PAGE_HEIGHT);

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
