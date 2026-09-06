"use client";

import { RegisterButton } from "@/components/events/RegisterButton";
import { useSession } from "@/lib/auth/client";
import { useEventPresence } from "@/hooks/useEventPresence";
import {
  EventAttendeesCountCard,
  EventPresenceCard,
  EventOrganizerCard,
  EventGuaranteesCard,
} from "./sidebar";

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
  const { count: presenceCount } = useEventPresence(eventId, true);

  const userName = session?.user?.name;
  const userImage = session?.user?.image;
  const userInitials = getUserInitials(userName);

  // Cantidad de navegantes en tiempo real con presencia viva
  const otherCount = presenceCount > 1 ? presenceCount - 1 : 1;
  const totalCount = Math.max(1, presenceCount);

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
      <EventAttendeesCountCard eventId={eventId} occupied={occupied} capacity={capacity} />

      {/* 3. Tarjeta Viendo ahora (Social Proof en vivo) */}
      <EventPresenceCard
        userImage={userImage}
        userName={userName}
        userInitials={userInitials}
        isAuthenticated={isAuthenticated}
        otherCount={otherCount}
        totalCount={totalCount}
      />

      {/* 4. Tarjeta ORGANIZADOR */}
      <EventOrganizerCard
        organizerName={organizerName}
        organizerDescription={organizerDescription}
        waContactUrl={waContactUrl}
      />

      {/* 5. Lista de Garantías */}
      <EventGuaranteesCard />
    </div>
  );
}
