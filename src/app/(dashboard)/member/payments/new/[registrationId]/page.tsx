import Link from "next/link";
import { ArrowLeft, Bus, Ticket, MapPin } from "lucide-react";
import { getPaymentCheckoutContext } from "@/actions/payments";
import { getEventPaymentMethods, getActivePaymentMethodsForEventOrganizer } from "@/actions/payment-methods";
import { getI18n } from "@/lib/i18n/server";
import { PaymentCheckoutForm } from "@/components/payments/PaymentCheckoutForm";
import {
  CheckoutStepper,
  checkoutStepFromPaymentStatus,
} from "@/components/payments/CheckoutStepper";
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

  const paymentAmount = payment ? Number(payment.amount) : Number(event.price);
  if (paymentAmount <= 0) {
    redirect("/member/tickets");
  }

  const [holderUser] = await db
    .select({ name: users.name })
    .from(users)
    .where(eq(users.id, registration.userId))
    .limit(1);
  const holderName = holderUser?.name ?? "Titular";

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

      guestsDetails = guestRecords.map((r) => ({
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

  if (eventMethods.length === 0 && paymentAmount > 0) {
    try {
      eventMethods = await getActivePaymentMethodsForEventOrganizer(event.organizerId);
    } catch (err) {
      console.error("Failed to load organizer payment methods:", err);
    }
  }

  const eventPrice = Number(event.price);
  const transportPrice = transportDetails
    ? Number(transportDetails.pricePerSeat) * transportDetails.seats
    : 0;
  const culqiAvailable = await isCulqiEnabledForEvent(event.id);
  const culqiPublicKey = await getCulqiPublicKeyForEvent(event.id);

  const checkoutStep = checkoutStepFromPaymentStatus({
    approved: Boolean(isAlreadyPaid),
    pendingReview: Boolean(hasSubmittedManual),
  });

  const summaryCard = (
    <div className="fe-glass sticky top-6 space-y-4 rounded-3xl border border-border bg-card p-6 shadow-sm">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {t("payments.checkout.singlePayment")}
        </p>
        <h2 className="mt-1 font-display text-xl font-semibold text-foreground">{event.title}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{t("payments.checkout.consolidatedSummary")}</p>
      </div>

      <div className="space-y-5 border-t border-border/60 pt-4">
        <div className="space-y-3">
          <span className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {t("payments.checkout.eventTickets")}
          </span>

          <div className="flex items-start justify-between gap-4 border-l-2 border-primary/45 pl-3">
            <div className="flex gap-2.5">
              <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Ticket className="h-3.5 w-3.5" />
              </div>
              <div>
                <h3 className="text-xs font-semibold text-foreground">{holderName}</h3>
                <p className="text-[10px] text-muted-foreground">{t("payments.checkout.holderTicket")}</p>
              </div>
            </div>
            <span className="text-xs font-semibold text-foreground">
              {eventPrice > 0 ? `S/ ${eventPrice.toFixed(2)}` : t("payments.checkout.gratis")}
            </span>
          </div>

          {guestsDetails.map((guest, idx) => (
            <div
              key={idx}
              className="flex items-start justify-between gap-4 border-l-2 border-primary/20 pl-3"
            >
              <div className="flex gap-2.5">
                <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                  <Ticket className="h-3.5 w-3.5" />
                </div>
                <div>
                  <h3 className="text-xs font-semibold text-foreground">{guest.name}</h3>
                  <p className="text-[10px] text-muted-foreground">
                    {t("payments.checkout.guestTicket", { n: idx + 1 })}
                  </p>
                </div>
              </div>
              <span className="text-xs font-semibold text-foreground">
                {eventPrice > 0 ? `S/ ${eventPrice.toFixed(2)}` : t("payments.checkout.gratis")}
              </span>
            </div>
          ))}
        </div>

        {transportDetails && (
          <div className="space-y-3 border-t border-border/50 pt-3.5">
            <span className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {t("payments.checkout.transportService")}
            </span>
            <div className="flex items-start justify-between gap-4 border-l-2 border-blue-500/40 pl-3">
              <div className="flex gap-2.5">
                <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-blue-500/10 text-blue-500">
                  <Bus className="h-3.5 w-3.5" />
                </div>
                <div>
                  <h3 className="text-xs font-semibold text-foreground">
                    {t("payments.checkout.roundTripTransport")}
                  </h3>
                  <p className="text-[10px] leading-normal text-muted-foreground">
                    {t("payments.checkout.routeLabel")}: {transportDetails.routeName} (
                    {t("payments.checkout.seatsCount", {
                      count: transportDetails.seats,
                      suffix: transportDetails.seats > 1 ? "s" : "",
                    })}
                    )
                  </p>
                  <p className="mt-0.5 flex items-center gap-1 text-[9px] text-muted-foreground/80">
                    <MapPin className="h-2.5 w-2.5 shrink-0" /> {t("payments.checkout.departurePointLabel")}
                    : {transportDetails.departurePoint}
                  </p>
                </div>
              </div>
              <span className="text-xs font-semibold text-foreground">S/ {transportPrice.toFixed(2)}</span>
            </div>
          </div>
        )}
      </div>

      <div className="flex items-end justify-between border-t border-dashed border-border/80 pt-4">
        <div>
          <Link href="/member/payments" className="text-xs font-medium text-primary hover:underline">
            {t("payments.checkout.helpPurchase")}
          </Link>
        </div>
        <div className="text-right">
          <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
            {t("payments.checkout.totalConsolidated")}
          </p>
          <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
            S/ {paymentAmount.toFixed(2)}
          </p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Link
            href="/member/payments"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            {t("dashboard.member.payments")}
          </Link>
          <h1 className="mt-3 font-display text-3xl font-bold text-foreground">
            {t("payments.checkout.title")}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("payments.checkout.subtitle", { event: event.title })}
          </p>
        </div>
        <div className="w-full max-w-md sm:pt-2">
          <CheckoutStepper current={checkoutStep} />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] lg:items-start">
        {summaryCard}

        <div className="space-y-4">
          {isAlreadyPaid ? (
            <div className="rounded-2xl border border-green-200 bg-green-50 p-5 text-green-800 dark:border-green-900/30 dark:bg-green-950/20 dark:text-green-300">
              <p className="font-medium">{t("payments.checkout.alreadyPaid")}</p>
            </div>
          ) : hasSubmittedManual ? (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-amber-800 dark:border-amber-900/30 dark:bg-amber-950/20 dark:text-amber-300">
              <p className="font-medium">{t("payments.checkout.paymentSubmitted")}</p>
            </div>
          ) : payment ? (
            <div className="fe-glass rounded-3xl border border-border bg-card p-5 shadow-sm sm:p-6">
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
                hideInlineSummary
              />
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
