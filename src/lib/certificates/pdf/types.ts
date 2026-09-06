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
  certificateSealUrl?: string | null;
  issuedAt?: Date | string | null;
}

export const PAGE_WIDTH = 297;
export const PAGE_HEIGHT = 210;

export interface LoadedCertificateImages {
  platformLogoDataUrl: string | null;
  organizationLogoDataUrl: string | null;
  organizerImageDataUrl: string | null;
  sealImageDataUrl: string | null;
}
