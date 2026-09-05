import { Metadata } from "next";
import Link from "next/link";
import { db } from "@/lib/db";
import { registrations, events, users, registrationGuests, organizations } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { 
  ShieldCheck, 
  AlertTriangle, 
  Award, 
  Calendar, 
  MapPin, 
  Building2, 
  CheckCircle2, 
  ArrowLeft,
  ExternalLink,
  Sparkles
} from "lucide-react";
import { DownloadCertificateButton } from "@/components/certificates/DownloadCertificateButton";

interface VerifyPageProps {
  params: Promise<{ code: string }>;
}

export async function generateMetadata({ params }: VerifyPageProps): Promise<Metadata> {
  const { code } = await params;
  return {
    title: `Verificación Oficial de Certificado — ${code} | Enquiva`,
    description: `Portal oficial de validación y autenticidad de certificaciones emitidas por Enquiva. Código: ${code}`,
  };
}

export default async function CertificateVerifyPage({ params }: VerifyPageProps) {
  const { code } = await params;
  const decodedCode = decodeURIComponent(code).trim().toUpperCase();

  const [record] = await db
    .select({
      registration: registrations,
      event: events,
      userName: users.name,
      userEmail: users.email,
      guestName: registrationGuests.name,
      organizationName: organizations.name,
      organizationLogo: organizations.logoUrl,
    })
    .from(registrations)
    .innerJoin(events, eq(registrations.eventId, events.id))
    .leftJoin(users, eq(registrations.userId, users.id))
    .leftJoin(registrationGuests, eq(registrations.guestId, registrationGuests.id))
    .leftJoin(organizations, eq(events.organizationId, organizations.id))
    .where(eq(registrations.certificateCode, decodedCode))
    .limit(1);

  const [organizerUser] = record?.event?.organizerId
    ? await db
        .select({
          name: users.name,
          image: users.image,
          signatureUrl: users.signatureUrl,
          signatureTitle: users.signatureTitle,
        })
        .from(users)
        .where(eq(users.id, record.event.organizerId))
        .limit(1)
    : [null];

  const isValid = Boolean(
    record &&
    record.registration.wantsCertificate &&
    record.registration.status !== "cancelled" &&
    record.event.hasCertificate
  );

  const attendeeName = record?.guestName ?? record?.userName ?? "Asistente Oficial";
  const orgName = record?.organizationName || "Operaciones Enquiva";

  let eventDateFormatted = "";
  if (record?.event?.date) {
    try {
      eventDateFormatted = new Date(record.event.date).toLocaleDateString("es-PE", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      });
    } catch {
      eventDateFormatted = String(record.event.date);
    }
  }

  const certificateTitle =
    record?.event?.certificateTitle || "Certificado Oficial de Aprobación y Asistencia";

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-muted/30 to-background flex flex-col justify-between py-12 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-2xl space-y-8">
        
        {/* Brand Header */}
        <div className="flex items-center justify-between border-b border-border/60 pb-6">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="h-9 w-9 rounded-xl bg-primary text-primary-foreground flex items-center justify-center font-black shadow-md shadow-primary/25">
              E
            </div>
            <span className="text-xl font-black tracking-tight text-foreground">
              Enquiva<span className="text-primary">.</span>
            </span>
          </Link>
          <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground bg-muted/60 px-3 py-1.5 rounded-full border border-border/80">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
            <span>Portal de Verificación</span>
          </div>
        </div>

        {/* Verification Status Card */}
        {isValid ? (
          <div className="space-y-6">
            {/* Top Green Banner */}
            <div className="rounded-3xl border border-emerald-500/30 bg-emerald-500/10 dark:bg-emerald-950/20 p-6 sm:p-8 text-center space-y-4 shadow-xl shadow-emerald-500/5 relative overflow-hidden">
              <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
              
              <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-emerald-500 text-white shadow-lg shadow-emerald-500/30">
                <CheckCircle2 className="h-8 w-8" />
              </div>

              <div className="space-y-1.5">
                <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs font-extrabold uppercase tracking-widest">
                  <Sparkles className="h-3.5 w-3.5" />
                  Certificado Auténtico y Válido
                </span>
                <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
                  Acreditación Verificada
                </h1>
                <p className="text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
                  Este certificado fue emitido legítimamente por la plataforma Enquiva y cumple con los estándares de autenticidad y registro oficial.
                </p>
              </div>

              <div className="pt-2">
                <div className="inline-block rounded-xl bg-card/80 backdrop-blur-xs border border-border px-4 py-2 text-center shadow-xs">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground block">
                    CÓDIGO ÚNICO DE REGISTRO
                  </span>
                  <span className="font-mono text-sm sm:text-base font-bold text-emerald-600 dark:text-emerald-400">
                    {decodedCode}
                  </span>
                </div>
              </div>
            </div>

            {/* Certificate Details Card */}
            <div className="rounded-3xl border border-border bg-card p-6 sm:p-8 shadow-sm space-y-6">
              <div className="flex items-center gap-3 border-b border-border/60 pb-4">
                <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                  <Award className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-foreground">Detalles de la Certificación</h2>
                  <p className="text-xs text-muted-foreground">Datos del asistente y del programa oficial completado</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-sm">
                <div className="space-y-1">
                  <span className="text-xs font-semibold text-muted-foreground block">
                    Persona Acreditada
                  </span>
                  <p className="text-base font-bold text-foreground">
                    {attendeeName}
                  </p>
                </div>

                <div className="space-y-1">
                  <span className="text-xs font-semibold text-muted-foreground block">
                    Título del Certificado
                  </span>
                  <p className="text-base font-bold text-foreground">
                    {certificateTitle}
                  </p>
                </div>

                <div className="space-y-1 sm:col-span-2">
                  <span className="text-xs font-semibold text-muted-foreground block">
                    Evento Oficial
                  </span>
                  <p className="text-base font-semibold text-foreground">
                    {record.event.title}
                  </p>
                </div>

                <div className="space-y-1">
                  <span className="text-xs font-semibold text-muted-foreground block flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5 text-primary" />
                    Fecha del Evento
                  </span>
                  <p className="text-sm font-medium text-foreground capitalize">
                    {eventDateFormatted || "—"}
                  </p>
                </div>

                <div className="space-y-1">
                  <span className="text-xs font-semibold text-muted-foreground block flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5 text-primary" />
                    Sede / Modalidad
                  </span>
                  <p className="text-sm font-medium text-foreground">
                    {record.event.isVirtual ? "Virtual / Online" : (record.event.location || "Presencial")}
                  </p>
                </div>

                <div className="space-y-1 sm:col-span-2">
                  <span className="text-xs font-semibold text-muted-foreground block flex items-center gap-1.5">
                    <Building2 className="h-3.5 w-3.5 text-primary" />
                    Entidad Organizadora
                  </span>
                  <p className="text-sm font-medium text-foreground">
                    {orgName}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-border flex flex-col sm:flex-row gap-3">
                <DownloadCertificateButton
                  data={{
                    certificateCode: decodedCode,
                    attendeeName,
                    eventTitle: record.event.title,
                    certificateTitle,
                    eventDate: record.event.date,
                    eventLocation: record.event.location,
                    isVirtual: record.event.isVirtual,
                    organizationName: orgName,
                    organizationLogo: record.organizationLogo,
                    organizerName: organizerUser?.name,
                    organizerImage: organizerUser?.signatureUrl || organizerUser?.image,
                    organizerTitle: organizerUser?.signatureTitle,
                  }}
                  className="flex-1 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground py-3.5 px-6 text-sm font-bold shadow-md shadow-primary/25 hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
                  label="Descargar Copia Oficial (PDF)"
                />

                <Link
                  href={`/events/${record.event.slug}`}
                  className="rounded-xl border border-border hover:bg-muted/80 text-foreground py-3 px-5 text-sm font-semibold transition flex items-center justify-center gap-2 text-center"
                >
                  <span>Ver Evento</span>
                  <ExternalLink className="h-4 w-4 opacity-70" />
                </Link>
              </div>
            </div>
          </div>
        ) : (
          /* Invalid / Not Found Certificate Warning */
          <div className="rounded-3xl border border-destructive/30 bg-destructive/5 dark:bg-destructive/10 p-8 text-center space-y-5 shadow-lg shadow-destructive/5">
            <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-destructive text-destructive-foreground shadow-lg shadow-destructive/30">
              <AlertTriangle className="h-8 w-8" />
            </div>

            <div className="space-y-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-destructive/15 border border-destructive/30 text-destructive text-xs font-extrabold uppercase tracking-widest">
                Validación Fallida
              </span>
              <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
                Certificado No Encontrado o Inválido
              </h1>
              <p className="text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
                El código <span className="font-mono font-bold text-foreground">{decodedCode}</span> no coincide con ninguna certificación activa y aprobada en nuestra base de datos oficial.
              </p>
            </div>

            <div className="rounded-2xl bg-card border border-border p-4 text-xs text-muted-foreground text-left max-w-md mx-auto space-y-2">
              <p className="font-bold text-foreground">Posibles causas:</p>
              <ul className="list-disc list-inside space-y-1 leading-relaxed">
                <li>El código fue ingresado con algún error tipográfico.</li>
                <li>La inscripción fue cancelada o el pago no fue completado.</li>
                <li>El documento presentado podría ser fraudulento o adulterado.</li>
              </ul>
            </div>

            <div className="pt-2">
              <Link
                href="/"
                className="inline-flex items-center gap-2 rounded-xl bg-foreground text-background hover:bg-foreground/90 py-2.5 px-5 text-xs font-bold transition cursor-pointer"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Volver al Inicio</span>
              </Link>
            </div>
          </div>
        )}

        {/* Trust Footer */}
        <div className="text-center text-xs text-muted-foreground space-y-1 border-t border-border/40 pt-6">
          <p>© {new Date().getFullYear()} Enquiva. Todos los derechos reservados.</p>
          <p>Sistema de emisión de certificados con verificación criptográfica y anti-fraude.</p>
        </div>

      </div>
    </div>
  );
}
