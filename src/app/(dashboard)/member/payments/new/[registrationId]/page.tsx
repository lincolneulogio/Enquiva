import Link from "next/link";
import { ArrowLeft, Bus, Ticket, CreditCard, Calendar, MapPin } from "lucide-react";
import { getPaymentCheckoutContext } from "@/actions/payments";
import { getEventPaymentMethods, getActivePaymentMethods } from "@/actions/payment-methods";
import { getI18n } from "@/lib/i18n/server";
import { ManualPaymentMethodForm } from "@/components/payments/ManualPaymentMethodForm";
import { notFound, redirect } from "next/navigation";
import { db } from "@/lib/db";
import { transportBookings, transportRoutes } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

interface Props {
  params: Promise<{ registrationId: string }>;
}

export default async function MemberPaymentCheckoutPage({ params }: Props) {
  const { t } = await getI18n();
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
  let eventMethods = await getEventPaymentMethods(event.id);

  // Fallback: If no event-specific payment methods are configured but there is an amount to pay (e.g. paid transport for free event)
  if (eventMethods.length === 0 && paymentAmount > 0) {
    try {
      eventMethods = await getActivePaymentMethods();
    } catch (err) {
      console.error("Failed to load active fallback payment methods:", err);
    }
  }

  // Dynamic breakdown prices
  const eventPrice = Number(event.price);
  const transportPrice = transportDetails ? Number(transportDetails.pricePerSeat) * transportDetails.seats : 0;

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
        
        <div className="space-y-3.5">
          {/* Event Entry */}
          <div className="flex items-start justify-between gap-4">
            <div className="flex gap-2.5">
              <div className="h-9 w-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5">
                <Ticket className="h-4.5 w-4.5" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground text-sm">{event.title}</h3>
                <p className="text-xs text-muted-foreground">{t("payments.checkout.generalEntry")}</p>
              </div>
            </div>
            <span className="font-semibold text-foreground text-sm">
              {eventPrice > 0 ? `S/ ${eventPrice.toFixed(2)}` : t("payments.checkout.gratis")}
            </span>
          </div>

          {/* Transport Booking (if applicable) */}
          {transportDetails && (
            <div className="flex items-start justify-between gap-4 pt-3.5 border-t border-border/50 animate-fadeIn">
              <div className="flex gap-2.5">
                <div className="h-9 w-9 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center shrink-0 mt-0.5">
                  <Bus className="h-4.5 w-4.5" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground text-sm">{t("payments.checkout.roundTripTransport")}</h3>
                  <p className="text-xs text-muted-foreground">
                    {t("payments.checkout.routeLabel")}: {transportDetails.routeName} ({t("payments.checkout.seatsCount", { count: transportDetails.seats, suffix: transportDetails.seats > 1 ? "s" : "" })})
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-0.5 flex items-center gap-1">
                    <MapPin className="h-3 w-3 shrink-0" /> {t("payments.checkout.departurePointLabel")}: {transportDetails.departurePoint}
                  </p>
                </div>
              </div>
              <span className="font-semibold text-foreground text-sm">
                S/ {transportPrice.toFixed(2)}
              </span>
            </div>
          )}

          {/* Total Consolidated */}
          <div className="flex items-center justify-between pt-4 border-t border-dashed border-border/80">
            <span className="font-bold text-foreground text-base">{t("payments.checkout.totalConsolidated")}</span>
            <span className="text-xl font-bold text-primary bg-primary/5 px-4 py-1.5 rounded-xl border border-primary/10">
              S/ {paymentAmount.toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      {isAlreadyPaid ? (
        <div className="rounded-2xl border border-green-200 bg-green-50 p-5 text-green-800">
          <p className="font-medium">{t("payments.checkout.alreadyPaid")}</p>
        </div>
      ) : payment?.status === "pending" && payment.method && payment.method !== "manual" ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-amber-800">
          <p className="font-medium">{t("payments.checkout.paymentSubmitted")}</p>
        </div>
      ) : (
        <ManualPaymentMethodForm
          registrationId={registration.id}
          eventTitle={event.title}
          eventSlug={event.slug}
          defaultAmount={paymentAmount}
          existingMethod={payment?.method ?? null}
          eventMethods={eventMethods}
        />
      )}
    </div>
  );
}
