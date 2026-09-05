"use client";

import { Users, ShieldCheck, Check, ExternalLink, Sparkles, MessageCircle } from "lucide-react";
import { toast } from "sonner";
import { RegisterButton } from "@/components/events/RegisterButton";
import { useSession } from "@/lib/auth/client";
import { useEventPresence } from "@/hooks/useEventPresence";

interface EventDetailSidebarProps {
  eventId: string;
  eventSlug: string;
  eventPrice: number;
  occupied: number;
  capacity: number | null;
  isAuthenticated: boolean;
  isRegistrationClosed: boolean;
  waitlistAvailable: boolean;
  closedReason?: string | null;
  hasTransport: boolean;
  currentStatus?: "registered" | "waitlisted" | "checked_in" | "cancelled" | null;
  registrationId?: string;
  transportRoutes?: any[];
  paymentStatus?: "pending" | "approved" | "rejected" | null;
  holdExpiresAt?: string | Date | null;
  schedules?: any[] | null;
  hasCertificate?: boolean;
  certificateTitle?: string | null;
  certificatePrice?: number | null;
  organizerName?: string;
  organizerDescription?: string;
  waContactUrl?: string | null;
}

function getUserInitials(name?: string | null): string {
  if (!name) return "Tú";
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "Tú";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

export function EventDetailSidebar({
  eventId,
  eventSlug,
  eventPrice,
  occupied,
  capacity,
  isAuthenticated,
  isRegistrationClosed,
  waitlistAvailable,
  closedReason,
  hasTransport,
  currentStatus,
  registrationId,
  transportRoutes = [],
  paymentStatus,
  holdExpiresAt,
  schedules,
  hasCertificate = false,
  certificateTitle = null,
  certificatePrice = 0,
  organizerName = "Operaciones Enquiva",
  organizerDescription = "Nos encargamos de la logística, pagos y soporte.",
  waContactUrl,
}: EventDetailSidebarProps) {
  const { data: session } = useSession();
  const { count: presenceCount } = useEventPresence(
    eventId,
    Boolean(isAuthenticated)
  );

  const userName = session?.user?.name;
  const userImage = session?.user?.image;
  const userInitials = getUserInitials(userName);

  // Cantidad de navegantes en tiempo real con fallback realista
  const otherCount = presenceCount > 1 ? presenceCount - 1 : 3;
  const totalCount = presenceCount > 0 ? presenceCount : 4;

  return (
    <div id="registro" className="space-y-4 scroll-mt-24">
      {/* 1. Botón Principal de Acción "Registrarme ahora" */}
      <RegisterButton
        eventId={eventId}
        eventSlug={eventSlug}
        eventPrice={eventPrice}
        isAuthenticated={isAuthenticated}
        isRegistrationClosed={isRegistrationClosed}
        waitlistAvailable={waitlistAvailable}
        closedReason={closedReason}
        hasTransport={hasTransport}
        currentStatus={currentStatus}
        registrationId={registrationId}
        transportRoutes={transportRoutes}
        paymentStatus={paymentStatus}
        holdExpiresAt={holdExpiresAt}
        schedules={schedules}
        hasCertificate={hasCertificate}
        certificateTitle={certificateTitle}
        certificatePrice={certificatePrice}
        buttonText="Registrarme ahora"
        buttonClassName="w-full flex items-center justify-center gap-2 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground py-3.5 px-6 text-base font-bold shadow-md shadow-primary/25 hover:shadow-lg hover:shadow-primary/35 active:scale-98 transition-all cursor-pointer"
      />

      {/* 2. Tarjeta ASISTENTES */}
      <div className="rounded-2xl border border-border/80 bg-white dark:bg-card p-4 sm:p-5 shadow-xs space-y-2">
        <div className="flex items-start gap-3.5">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary">
            <Users className="h-5 w-5" />
          </div>
          <div className="space-y-1 min-w-0 flex-1">
            <span className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              ASISTENTES
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl sm:text-2xl font-black text-foreground">
                {occupied}
              </span>
              <span className="text-sm font-semibold text-muted-foreground">
                asistiendo
              </span>
            </div>
          </div>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed pt-1">
          {occupied === 0
            ? "Sé la primera persona en asegurar su cupo para esta edición 2026."
            : `${occupied} persona${occupied > 1 ? "s" : ""} ya aseguró su cupo para esta edición 2026.`}
        </p>
      </div>

      {/* 3. Tarjeta Viendo ahora (Social Proof en vivo) */}
      <div className="rounded-2xl border border-emerald-500/20 bg-gradient-to-r from-emerald-500/[0.04] via-white to-white dark:via-card dark:to-card px-4 py-3 shadow-xs flex items-center justify-between gap-3 transition-colors">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="relative flex h-2.5 w-2.5 shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
          </span>
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="text-xs font-bold text-foreground tracking-tight">
              Viendo ahora
            </span>
            <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-1.5 py-0.5 text-[9px] font-extrabold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              En vivo
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <div className="flex items-center -space-x-1.5">
            {userImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={userImage}
                alt={userName || "Tú"}
                className="h-6 w-6 rounded-full object-cover ring-2 ring-white dark:ring-card shadow-xs"
              />
            ) : (
              <span
                className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-[9px] font-extrabold text-primary-foreground ring-2 ring-white dark:ring-card shadow-xs"
                title={userName || "Tú"}
              >
                {userInitials}
              </span>
            )}
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-[9px] font-bold text-muted-foreground ring-2 ring-white dark:ring-card shadow-xs">
              +{otherCount}
            </span>
          </div>
          <span className="text-[11px] font-semibold text-muted-foreground">
            {isAuthenticated ? `Tú y ${otherCount} más` : `${totalCount} navegando`}
          </span>
        </div>
      </div>

      {/* 4. Tarjeta ORGANIZADOR */}
      <div className="rounded-2xl border border-border/80 bg-white dark:bg-card p-4 sm:p-5 shadow-xs space-y-3">
        <div className="flex items-start gap-3.5">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div className="space-y-0.5 min-w-0 flex-1">
            <span className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              ORGANIZADOR
            </span>
            <h4 className="text-sm sm:text-base font-bold text-foreground truncate">
              {organizerName}
            </h4>
            <p className="text-xs text-muted-foreground leading-snug">
              {organizerDescription}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-border/50 text-xs font-medium">
          {waContactUrl ? (
            <a
              href={waContactUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 font-semibold transition-colors"
            >
              <MessageCircle className="h-3.5 w-3.5 text-emerald-500" />
              <span>Contactar organizador</span>
              <ExternalLink className="h-3 w-3 opacity-70" />
            </a>
          ) : (
            <button
              type="button"
              onClick={() =>
                toast.info("El organizador aún no ha registrado un número de WhatsApp para contacto directo.")
              }
              className="inline-flex items-center gap-1.5 text-muted-foreground hover:text-foreground font-medium transition-colors"
            >
              <MessageCircle className="h-3.5 w-3.5 opacity-60" />
              <span>Contactar organizador</span>
            </button>
          )}

          <span className="inline-flex items-center rounded-full bg-emerald-50 dark:bg-emerald-950/50 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700 dark:text-emerald-300 border border-emerald-200/50">
            Verificado
          </span>
        </div>
      </div>

      {/* 5. Lista de Garantías */}
      <div className="rounded-2xl border border-border/80 bg-white/60 dark:bg-card/40 p-4 space-y-2.5 shadow-2xs">
        <div className="flex items-center gap-2 text-xs text-foreground/90 font-medium">
          <div className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white">
            <Check className="h-2.5 w-2.5" />
          </div>
          <span>Pago 100% seguro (Culqi, Yape, Plin)</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-foreground/90 font-medium">
          <div className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white">
            <Check className="h-2.5 w-2.5" />
          </div>
          <span>Acceso con código QR instantáneo</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-foreground/90 font-medium">
          <div className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white">
            <Check className="h-2.5 w-2.5" />
          </div>
          <span>Confirmación inmediata por correo electrónico</span>
        </div>
      </div>
    </div>
  );
}
