import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { getCategories, getEventBySlug } from "@/actions/events";
import { getRegistrationForEvent } from "@/actions/registrations";
import { getUserPayments } from "@/actions/payments";
import { RegisterButton } from "@/components/events/RegisterButton";
import { TicketCard } from "@/components/tickets/TicketCard";
import { PublicHeader } from "@/components/shared/PublicHeader";
import Link from "next/link";
import Image from "next/image";
import { categoryColor, categoryLabel, cn, formatEventDate } from "@/lib/utils";
import { getI18n } from "@/lib/i18n/server";
import { getIntlLocale } from "@/lib/i18n/core";

interface EventPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export default async function EventDetailPage({ params }: EventPageProps) {
  const { t, locale } = await getI18n();
  const { slug } = await params;
  const [event, categories] = await Promise.all([
    getEventBySlug(slug),
    getCategories(),
  ]);

  if (!event) {
    return notFound();
  }

  const categoryMeta = categories.find((category) => category.slug === event.category);

  const sessionHeaders = await headers();
  const session = await auth.api.getSession({ headers: sessionHeaders });

  let registrationData = null;
  try {
    registrationData = await getRegistrationForEvent(event.id);
  } catch {
    registrationData = null;
  }

  const isAuthenticated = Boolean(session?.user);
  const registration = registrationData?.registration;
  const ticket = registrationData?.ticket;
  const payments = session?.user ? await getUserPayments().catch(() => []) : [];
  const paymentForRegistration = registration
    ? payments.find(({ registration: item }) => item.id === registration.id)
    : null;
  const isFull =
    typeof event.capacity === "number" &&
    (event.attendeeCount ?? 0) >= event.capacity;
  const isEventExpired = new Date(event.date).getTime() <= Date.now();
  const isRegistrationClosed = isEventExpired || Boolean(isFull) || event.status !== "published";
  const registrationClosedReason = isEventExpired
    ? t("register.eventExpired")
    : isFull
      ? t("register.eventFull")
      : event.status !== "published"
        ? t("register.registrationUnavailable")
        : null;
  const eventStatusLabel =
    event.status === "published"
      ? "Publicado"
      : event.status === "draft"
        ? "Borrador"
        : event.status === "cancelled"
          ? "Cancelado"
          : event.status;

  return (
    <div className="min-h-screen bg-background">
      <PublicHeader />

      <section className="relative overflow-hidden border-b border-border bg-card px-6 py-16 shadow-sm">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
            <div className="space-y-4">
              <div>
                <span
                  className={cn(
                    "inline-flex rounded-full px-3 py-1 text-xs font-medium",
                    categoryMeta?.colorClass || categoryColor(event.category)
                  )}
                >
                  {categoryMeta?.label || categoryLabel(event.category)}
                </span>
              </div>

              <h1 className="text-4xl font-semibold leading-tight text-foreground">
                {event.title}
              </h1>

              {event.coverImage && (
                <div className="overflow-hidden rounded-3xl border border-border bg-muted shadow-sm">
                  <Image
                    src={event.coverImage}
                    alt={event.title}
                    width={1200}
                    height={675}
                    className="h-auto w-full object-cover"
                    priority
                  />
                </div>
              )}

              <p className="text-lg text-muted-foreground">{event.description}</p>

              <div className="space-y-2 text-sm text-muted-foreground">
                <p>
                  <span className="font-semibold text-foreground">Fecha:</span> {formatEventDate(event.date)}
                </p>
                <p>
                  <span className="font-semibold text-foreground">Ubicación:</span>{" "}
                  {event.location ?? (event.isVirtual ? t("common.virtualEvent") : t("common.locationTbd"))}
                </p>
                <p>
                  <span className="font-semibold text-foreground">Capacidad:</span> {event.capacity ?? t("public.eventDetail.unlimited")}
                </p>
                <p>
                  <span className="font-semibold text-foreground">Estado:</span>{" "}
                  <span>{eventStatusLabel}</span>
                </p>
              </div>
            </div>

            <div className="w-full max-w-sm space-y-4 lg:justify-self-end">
              <RegisterButton
                eventId={event.id}
                isAuthenticated={isAuthenticated}
                isRegistrationClosed={isRegistrationClosed}
                closedReason={registrationClosedReason}
                hasTransport={event.hasTransport}
                currentStatus={registration?.status}
                registrationId={registration?.id}
              />

              <div className="rounded-3xl border border-border bg-card p-5 shadow-sm">
                <p className="text-xs uppercase tracking-[0.4em] text-muted-foreground">{t("public.eventDetail.attendeesLabel")}</p>
                <p className="mt-3 text-3xl font-semibold text-foreground">
                  {(event.attendeeCount ?? 0).toLocaleString(getIntlLocale(locale))}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">{t("public.eventDetail.attendingSuffix")}</p>
              </div>

              <div className="rounded-3xl border border-border bg-card p-5 shadow-sm">
                <h3 className="text-xs uppercase tracking-[0.4em] text-muted-foreground">{t("common.organizer")}</h3>
                <p className="mt-3 text-lg font-semibold text-foreground">{t("public.eventDetail.organizerName")}</p>
                <p className="mt-1 text-sm text-muted-foreground">{t("public.eventDetail.organizerDescription")}</p>
              </div>

              {isAuthenticated && (
                <div className="rounded-3xl border border-border bg-card p-5 shadow-sm">
                  <h3 className="text-lg font-semibold text-foreground">{t("public.eventDetail.quickLinksTitle")}</h3>
                  <div className="mt-4 space-y-2 text-sm">
                    <Link href="/member/events" className="block text-primary hover:underline">
                      {t("public.eventDetail.reviewRegistrations")}
                    </Link>
                    <Link href="/member/payments" className="block text-primary hover:underline">
                      {t("public.eventDetail.checkPaymentHistory")}
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {registration && (
        <section className="mx-auto max-w-6xl px-6 py-12">
          <TicketCard
            ticket={ticket}
            event={event}
            registration={registration}
            paymentStatus={paymentForRegistration?.payment.status}
          />
        </section>
      )}
    </div>
  );
}
