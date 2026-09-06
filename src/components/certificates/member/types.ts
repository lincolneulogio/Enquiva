import type { CertificateStatusDetails } from "@/lib/certificates/eligibility";

export interface MemberCertificateItem {
  registrationId: string;
  eventId: string;
  eventTitle: string;
  eventSlug: string;
  eventDate: string | Date;
  eventEndDate?: string | Date | null;
  eventLocation?: string | null;
  isVirtual: boolean;
  hasCertificate: boolean;
  certificateTitle?: string | null;
  certificatePrice?: string | null;
  wantsCertificate: boolean;
  certificateCode: string;
  registrationStatus: string;
  organizationName?: string | null;
  organizationLogo?: string | null;
  organizerName?: string | null;
  organizerImage?: string | null;
  organizerTitle?: string | null;
  attendeeName: string;
  certificateSealUrl?: string | null;
}

export interface ProcessedCertificateItem extends MemberCertificateItem {
  statusDetails: CertificateStatusDetails;
}

export interface MemberCertificatesClientProps {
  items: MemberCertificateItem[];
  locale?: "es" | "en";
}
