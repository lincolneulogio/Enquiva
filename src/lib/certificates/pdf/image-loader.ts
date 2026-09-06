import { BRAND } from "@/lib/brand";
import type { CertificatePdfData, LoadedCertificateImages } from "./types";

export async function fetchImageAsDataUrl(src?: string | null): Promise<string | null> {
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

export function detectImageFormat(dataUrl: string): "PNG" | "JPEG" {
  if (dataUrl.startsWith("data:image/jpeg") || dataUrl.startsWith("data:image/jpg")) {
    return "JPEG";
  }
  return "PNG";
}

export async function loadCertificateImages(data: CertificatePdfData): Promise<LoadedCertificateImages> {
  const sealUrlToFetch = data.certificateSealUrl || "/images/enquiva-verified-seal.png";
  const [platformLogoDataUrl, organizationLogoDataUrl, organizerImageDataUrl, sealImageDataUrl] =
    await Promise.all([
      fetchImageAsDataUrl(data.platformLogo || BRAND.logo.source || BRAND.logo.markLg),
      fetchImageAsDataUrl(data.organizationLogo),
      fetchImageAsDataUrl(data.organizerImage),
      fetchImageAsDataUrl(sealUrlToFetch),
    ]);

  return {
    platformLogoDataUrl,
    organizationLogoDataUrl,
    organizerImageDataUrl,
    sealImageDataUrl,
  };
}
