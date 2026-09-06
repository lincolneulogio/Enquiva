export interface OrganizerCertificateSignatureCardProps {
  initialSignatureUrl?: string | null;
  initialSignatureTitle?: string | null;
  organizerName: string;
  organizationName?: string | null;
  locale?: "es" | "en";
}

export type SignatureMode = "upload" | "draw";
