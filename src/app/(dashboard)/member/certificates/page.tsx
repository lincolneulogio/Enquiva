import { getUserRegistrations } from "@/actions/registrations";
import { getI18n } from "@/lib/i18n/server";
import { getSystemSettings } from "@/lib/settings";
import { getRequestSession } from "@/lib/request-context";
import { db } from "@/lib/db";
import { organizations, users } from "@/lib/db/schema";
import { inArray } from "drizzle-orm";
import {
  MemberCertificatesClient,
  type MemberCertificateItem,
} from "@/components/certificates/MemberCertificatesClient";
import { Award } from "lucide-react";

export const metadata = {
  title: "Mis Certificados Oficiales | Enquiva",
  description: "Consulta, valida y descarga tus certificados y diplomas de eventos en Enquiva.",
};

export default async function MemberCertificatesPage() {
  const { locale } = await getI18n();
  const session = await getRequestSession();
  const userName = session?.user?.name ?? "Asistente";
  const platformSettings = await getSystemSettings().catch(() => null);

  const registrations = await getUserRegistrations(100);

  // Filter only registrations where the participant requested/purchased a certificate
  const certRegistrations = registrations.filter(
    (r) => r.registration.wantsCertificate && r.registration.certificateCode
  );

  // Collect unique organization IDs to get their official names
  const orgIds = Array.from(
    new Set(
      certRegistrations
        .map((r) => r.event.organizationId)
        .filter((id): id is string => Boolean(id))
    )
  );

  const orgMap = new Map<string, { name: string; logoUrl: string | null }>();
  if (orgIds.length > 0) {
    const orgs = await db
      .select({
        id: organizations.id,
        name: organizations.name,
        logoUrl: organizations.logoUrl,
      })
      .from(organizations)
      .where(inArray(organizations.id, orgIds));

    for (const org of orgs) {
      orgMap.set(org.id, { name: org.name, logoUrl: org.logoUrl });
    }
  }

  // Collect unique organizer IDs to get profile image & name
  const organizerIds = Array.from(
    new Set(
      certRegistrations
        .map((r) => r.event.organizerId)
        .filter((id): id is string => Boolean(id))
    )
  );

  const organizerMap = new Map<
    string,
    { name: string; image: string | null; title: string | null }
  >();
  if (organizerIds.length > 0) {
    const orgUsers = await db
      .select({
        id: users.id,
        name: users.name,
        image: users.image,
        signatureUrl: users.signatureUrl,
        signatureTitle: users.signatureTitle,
      })
      .from(users)
      .where(inArray(users.id, organizerIds));

    for (const u of orgUsers) {
      organizerMap.set(u.id, {
        name: u.name ?? "Organizador Responsable",
        image: u.signatureUrl || u.image,
        title: u.signatureTitle ?? null,
      });
    }
  }

  const items: MemberCertificateItem[] = certRegistrations.map(({ registration, event }) => {
    const orgInfo = event.organizationId ? orgMap.get(event.organizationId) : null;
    const organizerInfo = organizerMap.get(event.organizerId);

    return {
      registrationId: registration.id,
      eventId: event.id,
      eventTitle: event.title,
      eventSlug: event.slug,
      eventDate: event.date,
      eventEndDate: event.endDate,
      eventLocation: event.location,
      isVirtual: event.isVirtual,
      hasCertificate: event.hasCertificate,
      certificateTitle: event.certificateTitle || "Certificado Oficial de Participación",
      certificatePrice: event.certificatePrice,
      wantsCertificate: registration.wantsCertificate ?? false,
      certificateCode: registration.certificateCode!,
      registrationStatus: registration.status,
      organizationName: orgInfo?.name ?? null,
      organizationLogo: orgInfo?.logoUrl ?? null,
      organizerName: organizerInfo?.name ?? null,
      organizerImage: organizerInfo?.image ?? null,
      organizerTitle: organizerInfo?.title ?? null,
      attendeeName: userName,
      certificateSealUrl: platformSettings?.certificateSealUrl,
    };
  });

  return (
    <div className="space-y-6 sm:space-y-8">
      <div>
        <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary mb-2">
          <Award className="h-3.5 w-3.5" />
          <span>{locale === "en" ? "Academic & Professional Credentials" : "Acreditación y Credenciales"}</span>
        </div>
        <h1 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          {locale === "en" ? "My Official Certificates" : "Mis Certificados Oficiales"}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground max-w-2xl">
          {locale === "en"
            ? "Access, verify and download your verified diplomas and completion credentials earned in your events on Enquiva."
            : "Consulta, verifica públicamente y descarga tus diplomas y constancias oficiales obtenidas en los eventos de Enquiva."}
        </p>
      </div>

      <MemberCertificatesClient items={items} locale={locale as "es" | "en"} />
    </div>
  );
}
