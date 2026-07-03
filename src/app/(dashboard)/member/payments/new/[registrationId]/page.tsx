import Link from "next/link";
import { ArrowLeft, Bus, Ticket, CreditCard, Calendar, MapPin } from "lucide-react";
import { getPaymentCheckoutContext } from "@/actions/payments";
import { getEventPaymentMethods, getActivePaymentMethodsForEventOrganizer } from "@/actions/payment-methods";
import { getI18n } from "@/lib/i18n/server";
import { PaymentCheckoutForm } from "@/components/payments/PaymentCheckoutForm";
import { notFound, redirect } from "next/navigation";
import { isCulqiEnabledForEvent, getCulqiPublicKeyForEvent } from "@/lib/culqi/capabilities";
import { db } from "@/lib/db";
import { transportBookings, transportRoutes, users, registrations } from "@/lib/db/schema";
import { eq, inArray } from "drizzle-orm";

interface Props {
  params: Promise<{ registrationId: string }>;
}

export default async function MemberPaymentCheckoutPage({ params }: Props) {
  const { t, locale } = await getI18n();
  const { registrationId } = await params;

  let data;
  try {
    data = await getPaymentCheckoutContext(registrationId);
  } catch {
    return notFound();
  }

  const { registration, event, payment } = data;

  // Determine amount to pay
  const paymentAmount = payment ? Number(payment.amount) : Number(event.price);
  if (paymentAmount <= 0) {
    redirect("/member/tickets");
  }

  // Fetch holder user name
  const [holderUser] = await db
    .select({ name: users.name })
    .from(users)
    .where(eq(users.id, registration.userId))
    .limit(1);
  const holderName = holderUser?.name ?? "Titular";

  // Parse guests if any
  let guestsDetails: Array<{ name: string; price: number }> = [];
  if (registration.notes && registration.notes.startsWith("[GUESTS:")) {
    const match = registration.notes.match(/^\[GUESTS:([^\]]+)\]/);
    if (match && match[1]) {
      const guestRegIds = match[1].split(",");
      const guestRecords = await db
        .select({
          name: users.name,
        })
        .from(registrations)
        .innerJoin(users, eq(registrations.userId, users.id))
        .where(inArray(registrations.id, guestRegIds));
      
      guestsDetails = guestRecords.map(r => ({
        name: r.name ?? (locale === "en" ? "Guest" : "Invitado"),
        price: Number(event.price),
      }));
    }
  }

  let transportDetails = null;
  if (payment?.transportBookingId) {
    try {
      const [booking] = await db
        .select({
          seats: transportBookings.seats,
          routeName: transportRoutes.name,
          pricePerSeat: transportRoutes.pricePerSeat,
          departurePoint: transportRoutes.departurePoint,
        })
        .from(transportBookings)
        .innerJoin(transportRoutes, eq(transportBookings.routeId, transportRoutes.id))
        .where(eq(transportBookings.id, payment.transportBookingId))
        .limit(1);
      
      if (booking) {
        transportDetails = booking;
      }
    } catch (err) {
      console.error("Failed to load transport details for checkout:", err);
    }
  }

  const isAlreadyPaid = payment && payment.status === "approved";
  const hasSubmittedManual =
    payment?.status === "pending" &&
    payment.method &&
    payment.method !== "manual" &&
    payment.method !== "culqi";
  let eventMethods = await getEventPaymentMethods(event.id);

  // Fallback: If no event-specific payment methods are configured but there is an amount to pay (e.g. paid transport for free event)
  if (eventMethods.length === 0 && paymentAmount > 0) {
    try {
      eventMethods = await getActivePaymentMethodsForEventOrganizer(event.organizerId);
    } catch (err) {
      console.error("Failed to load organizer payment methods:", err);
    }
  }

  // Dynamic breakdown prices
  const eventPrice = Number(event.price);
  const transportPrice = transportDetails ? Number(transportDetails.pricePerSeat) * transportDetails.seats : 0;
  const culqiAvailable = await isCulqiEnabledForEvent(event.id);
  const culqiPublicKey = await getCulqiPublicKeyForEvent(event.id);

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div>
        <Link
          href="/member/payments"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          {t("dashboard.member.payments")}
        </Link>
        <h1 className="mt-3 font-display text-3xl font-bold text-foreground">
          {t("payments.checkout.title")}
        </h1>
        <p className="mt-1 text-muted-foreground text-sm">
          {t("payments.checkout.subtitle", { event: event.title })}
        </p>
      </div>

      {/* Payment Breakdown Card */}
      <div className="fe-glass border border-border bg-card rounded-3xl p-6 shadow-sm space-y-4">
        <h2 className="font-semibold text-foreground text-lg flex items-center gap-2 pb-3 border-b border-border/85">
          <CreditCard className="h-5 w-5 text-primary" />
          {t("payments.checkout.consolidatedSummary")}
        </h2>
        
        <div className="space-y-5">
          {/* Entradas del Evento */}
          <div className="space-y-3">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
              {locale === "en" ? "Event Tickets" : "Entradas del Evento"}
            </span>

            {/* Holder Entry */}
            <div className="flex items-start justify-between gap-4 pl-3 border-l-2 border-primary/45">
              <div className="flex gap-2.5">
                <div className="h-7 w-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5">
                  <Ticket className="h-3.5 w-3.5" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground text-xs">{holderName}</h3>
                  <p className="text-[10px] text-muted-foreground">{locale === "en" ? "Holder / Main Ticket" : "Titular / Inscripción Principal"}</p>
                </div>
              </div>
              <span className="font-semibold text-foreground text-xs">
                {eventPrice > 0 ? `S/ ${eventPrice.toFixed(2)}` : t("payments.checkout.gratis")}
              </span>
            </div>

            {/* Guest Entries */}
            {guestsDetails.map((guest, idx) => (
              <div key={idx} className="flex items-start justify-between gap-4 pl-3 border-l-2 border-primary/20 animate-fadeIn">
                <div className="flex gap-2.5">
                  <div className="h-7 w-7 rounded-lg bg-muted text-muted-foreground flex items-center justify-center shrink-0 mt-0.5">
                    <Ticket className="h-3.5 w-3.5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground text-xs">{guest.name}</h3>
                    <p className="text-[10px] text-muted-foreground">{locale === "en" ? `Accompanying Guest #${idx + 1}` : `Acompañante #${idx + 1}`}</p>
                  </div>
                </div>
                <span className="font-semibold text-foreground text-xs">
                  {eventPrice > 0 ? `S/ ${eventPrice.toFixed(2)}` : t("payments.checkout.gratis")}
                </span>
              </div>
            ))}
          </div>

          {/* Transport Booking (if applicable) */}
          {transportDetails && (
            <div className="space-y-3 pt-3.5 border-t border-border/50">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
                {locale === "en" ? "Transport Service" : "Servicio de Transporte"}
              </span>
              <div className="flex items-start justify-between gap-4 pl-3 border-l-2 border-blue-500/40 animate-fadeIn">
                <div className="flex gap-2.5">
                  <div className="h-7 w-7 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center shrink-0 mt-0.5">
                    <Bus className="h-3.5 w-3.5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground text-xs">{t("payments.checkout.roundTripTransport")}</h3>
                    <p className="text-[10px] text-muted-foreground leading-normal">
                      {t("payments.checkout.routeLabel")}: {transportDetails.routeName} ({t("payments.checkout.seatsCount", { count: transportDetails.seats, suffix: transportDetails.seats > 1 ? "s" : "" })})
                    </p>
                    <p className="text-[9px] text-muted-foreground/80 mt-0.5 flex items-center gap-1">
                      <MapPin className="h-2.5 w-2.5 shrink-0" /> {t("payments.checkout.departurePointLabel")}: {transportDetails.departurePoint}
                    </p>
                  </div>
                </div>
                <span className="font-semibold text-foreground text-xs">
                  S/ {transportPrice.toFixed(2)}
                </span>
              </div>
            </div>
          )}

          {/* Total Consolidated */}
          <div className="flex items-center justify-between pt-4 border-t border-dashed border-border/80">
            <span className="font-bold text-foreground text-sm uppercase tracking-wider">{t("payments.checkout.totalConsolidated")}</span>
            <span className="text-base font-bold text-primary bg-primary/5 px-3 py-1 rounded-xl border border-primary/10">
              S/ {paymentAmount.toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      {isAlreadyPaid ? (
        <div className="rounded-2xl border border-green-200 bg-green-50 p-5 text-green-800 dark:border-green-900/30 dark:bg-green-950/20 dark:text-green-300">
          <p className="font-medium">{t("payments.checkout.alreadyPaid")}</p>
        </div>
      ) : hasSubmittedManual ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-amber-800 dark:border-amber-900/30 dark:bg-amber-950/20 dark:text-amber-300">
          <p className="font-medium">{t("payments.checkout.paymentSubmitted")}</p>
        </div>
      ) : payment ? (
        <PaymentCheckoutForm
          registrationId={registration.id}
          paymentId={payment.id}
          eventTitle={event.title}
          eventSlug={event.slug}
          defaultAmount={paymentAmount}
          existingMethod={payment.method ?? null}
          eventMethods={eventMethods}
          culqiPublicKey={culqiPublicKey}
          culqiAvailable={culqiAvailable}
        />
      ) : null}
    </div>
  );
}
