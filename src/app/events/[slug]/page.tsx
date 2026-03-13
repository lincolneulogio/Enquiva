import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { getCategories, getEventBySlug } from "@/actions/events";
import { getRegistrationForEvent } from "@/actions/registrations";
import { getUserPayments } from "@/actions/payments";
import { RegisterButton } from "@/components/events/RegisterButton";
import { TicketCard } from "@/components/tickets/TicketCard";
import { PublicHeader } from "@/components/shared/PublicHeader";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import Link from "next/link";
import { categoryColor, categoryLabel, cn, formatEventDate } from "@/lib/utils";
import { eq as drizzleEq } from "drizzle-orm";
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
  const [currentUser] = session?.user
    ? await db
      .select({ phone: users.phone })
      .from(users)
      .where(drizzleEq(users.id, session.user.id))
      .limit(1)
    : [null];

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

  return (
    <div className="min-h-screen bg-background">
      <PublicHeader />

      <section className="relative overflow-hidden border-b border-border bg-card px-6 py-16 shadow-sm">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-col gap-3">
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
            <p className="text-lg text-muted-foreground">{event.description}</p>
          </div>
          <div className="mt-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="text-sm text-muted-foreground">
              <p>
                {formatEventDate(event.date)}
                {event.location && ` · ${event.location}`}
              </p>
              <p className="mt-1 text-xs uppercase tracking-wide text-muted-foreground">
                {t("public.eventDetail.capacityLabel")}: {event.capacity ?? t("public.eventDetail.unlimited")} · {t("public.eventDetail.statusLabel")}:{" "}
                <span className="font-semibold uppercase text-foreground">{event.status}</span>
              </p>
            </div>
            <div className="w-full max-w-sm">
              <RegisterButton
                eventId={event.id}
                isAuthenticated={isAuthenticated}
                isFull={Boolean(isFull)}
                hasTransport={event.hasTransport}
                currentStatus={registration?.status}
                registrationId={registration?.id}
                userPhone={currentUser?.phone ?? null}
              />
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-12">
        <div className="grid gap-10 lg:grid-cols-[2fr,1fr]">
          <div className="space-y-6">
            <div className="rounded-3xl border border-border bg-card p-8 shadow-sm">
              <h2 className="text-2xl font-semibold text-foreground">{t("public.eventDetail.aboutTitle")}</h2>
              <p className="mt-3 text-sm text-muted-foreground">{event.description}</p>
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">{t("public.eventDetail.locationLabel")}</p>
                  <p className="text-sm text-foreground">
                    {event.location ?? (event.isVirtual ? t("common.virtualEvent") : t("common.locationTbd"))}
                  </p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">{t("public.eventDetail.attendeesLabel")}</p>
                  <p className="text-sm text-foreground">
                    {(event.attendeeCount ?? 0).toLocaleString(getIntlLocale(locale))} {t("public.eventDetail.attendingSuffix")}
                  </p>
                </div>
              </div>
            </div>

            {registration && (
              <TicketCard
                ticket={ticket}
                event={event}
                registration={registration}
                paymentStatus={paymentForRegistration?.payment.status}
              />
            )}
          </div>

          <aside className="space-y-6">
            <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
              <h3 className="text-xs uppercase tracking-[0.4em] text-muted-foreground">{t("common.organizer")}</h3>
              <p className="mt-3 text-lg font-semibold text-foreground">{t("public.eventDetail.organizerName")}</p>
              <p className="mt-1 text-sm text-muted-foreground">{t("public.eventDetail.organizerDescription")}</p>
            </div>

            <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-foreground">{t("public.eventDetail.quickLinksTitle")}</h3>
              <div className="mt-4 space-y-2 text-sm">
                <Link
                  href="/member/events"
                  className="block text-primary hover:underline"
                >
                  {t("public.eventDetail.reviewRegistrations")}
                </Link>
                <Link
                  href="/member/payments"
                  className="block text-primary hover:underline"
                >
                  {t("public.eventDetail.checkPaymentHistory")}
                </Link>
              </div>
            </div>
          </aside>
        </div>
      </section>
    </div>
  );
}
