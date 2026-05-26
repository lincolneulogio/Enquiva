import Link from "next/link";
import { Bus, Calendar, Ticket } from "lucide-react";
import { getMemberTransportOptions, getMyTransportBookings } from "@/actions/transport";
import { TransportBookingForm, CancelTransportButton } from "@/components/tickets/TransportBookingForm";
import { getI18n } from "@/lib/i18n/server";
import { getPluralLabel, getPaymentStatusLabel } from "@/lib/i18n/core";
import { getEventPaymentMethods } from "@/actions/payment-methods";

const PAYMENT_STATUS_STYLES: Record<string, string> = {
  pending: "bg-amber-100 text-amber-700 dark:bg-amber-900/20 dark:text-amber-300",
  approved: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400",
  rejected: "bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400",
};

const BOOKING_STATUS_STYLES: Record<string, string> = {
  pending: "bg-amber-100 text-amber-700 dark:bg-amber-900/20 dark:text-amber-300",
  confirmed: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400",
  cancelled: "bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400",
};

function getBookingStatusLabel(status: string, locale: string) {
  const labels: Record<string, Record<string, string>> = {
    pending: { es: "Pendiente", en: "Pending" },
    confirmed: { es: "Confirmado", en: "Confirmed" },
    cancelled: { es: "Cancelado", en: "Cancelled" },
  };
  return labels[status]?.[locale] ?? status;
}


export default async function MemberTransportPage() {
    const { t, locale } = await getI18n();
    const [options, myBookings] = await Promise.all([
        getMemberTransportOptions(),
        getMyTransportBookings(),
    ]);

    // Fetch dynamic payment methods for each event option
    const optionsWithPayments = await Promise.all(
        options.map(async (eventItem) => {
            const paymentMethods = await getEventPaymentMethods(eventItem.eventId);
            return {
                ...eventItem,
                paymentMethods,
            };
        })
    );

    const hasAnyRoute = optionsWithPayments.some((o) => o.routes.length > 0);

    return (
        <div className="space-y-8">
            <div>
                <h1 className="font-display text-3xl font-semibold text-foreground">{t("dashboard.member.transportTitle")}</h1>
                <p className="mt-1 text-muted-foreground">
                    {t("dashboard.member.transportSubtitle")}
                </p>
            </div>

            {optionsWithPayments.length === 0 && (
                <div className="rounded-xl border border-dashed border-border bg-card p-12 text-center">
                    <Ticket className="mx-auto h-10 w-10 text-muted-foreground/50" />
                    <p className="mt-4 font-medium text-foreground">{t("dashboard.member.noActiveEvents")}</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                        {t("dashboard.member.registerFirstForTransport")}
                    </p>
                    <Link
                        href="/events"
                        className="mt-4 inline-flex items-center gap-1 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
                    >
                        {t("dashboard.member.exploreEvents")}
                    </Link>
                </div>
            )}

            {optionsWithPayments.length > 0 && !hasAnyRoute && (
                <div className="rounded-xl border border-dashed border-border bg-card p-12 text-center">
                    <Bus className="mx-auto h-10 w-10 text-muted-foreground/50" />
                    <p className="mt-4 font-medium text-foreground">{t("dashboard.member.noRoutesAvailable")}</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                        {t("dashboard.member.noRoutesHelp")}
                    </p>
                    <Link
                        href="/member/events"
                        className="mt-4 inline-flex items-center gap-1 rounded-lg border border-border bg-secondary px-4 py-2 text-sm font-medium text-foreground hover:bg-secondary/80 transition-colors"
                    >
                        {t("dashboard.member.viewMyEvents")}
                    </Link>
                </div>
            )}

            {optionsWithPayments.map((eventItem) => (
                <section key={eventItem.registrationId} className="space-y-3">
                    <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-primary" />
                        <h2 className="font-display text-xl font-semibold text-foreground">
                            {eventItem.eventTitle}
                        </h2>
                    </div>

                    {eventItem.routes.length === 0 ? (
                        <p className="text-sm text-muted-foreground">
                            {t("dashboard.member.noRoutesForEvent")}
                        </p>
                    ) : (
                        <div className="grid gap-4 lg:grid-cols-2">
                            {eventItem.routes.map((route) =>
                                route.alreadyBooked ? (
                                    <div key={route.id} className="rounded-2xl border border-border bg-card p-5">
                                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                            <div>
                                                <h3 className="font-semibold text-foreground">{route.name}</h3>
                                                <p className="mt-0.5 text-sm text-muted-foreground">{route.departurePoint}</p>
                                            </div>
                                            <span className="w-fit rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-700 dark:bg-green-900/20 dark:text-green-400">
                                                {t("dashboard.member.alreadyBooked")}
                                            </span>
                                        </div>
                                        <p className="mt-2 text-xs text-muted-foreground">
                                            {t("dashboard.member.bookingChangeHint")}
                                        </p>
                                    </div>
                                ) : (
                                    <TransportBookingForm
                                        key={route.id}
                                        route={{
                                            id: route.id,
                                            name: route.name,
                                            departurePoint: route.departurePoint,
                                            departureTime: new Date(route.departureTime),
                                            returnTime: route.returnTime ? new Date(route.returnTime) : null,
                                            pricePerSeat: String(route.pricePerSeat),
                                            totalSeats: route.totalSeats,
                                            availableSeats: route.availableSeats,
                                            stops: route.stops,
                                        }}
                                        registrationId={eventItem.registrationId}
                                        paymentMethods={eventItem.paymentMethods}
                                    />
                                )
                            )}
                        </div>
                    )}
                </section>
            ))}

            {myBookings.length > 0 && (
                <section className="space-y-4">
                    <h2 className="font-display text-xl font-semibold text-foreground">{t("dashboard.member.myBookings")}</h2>
                    <div className="grid gap-4">
                        {myBookings.map((booking) => {
                            const seatWord = getPluralLabel(locale, t("dashboard.member.seatsLabel"), `${t("dashboard.member.seatsLabel")}s`, booking.seats);
                            const payStatus = booking.paymentStatus ?? "pending";
                            const bookStatus = booking.status ?? "pending";
                            return (
                                <div key={booking.id} className="rounded-2xl border border-border bg-card p-5 shadow-sm hover:shadow-md transition-all duration-200">
                                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                                        <div className="space-y-1.5">
                                            <h3 className="font-semibold text-foreground text-lg leading-tight">{booking.routeName}</h3>
                                            <p className="text-sm font-medium text-muted-foreground">
                                                {booking.seats} {seatWord} · <span className="font-semibold text-foreground">S/. {Number(booking.paymentAmount).toFixed(2)}</span>
                                            </p>
                                            <div className="space-y-0.5 mt-2">
                                                <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                                                    <span className="font-medium">Salida:</span>
                                                    <span>{booking.departurePoint}</span>
                                                </p>
                                                <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                                                    <span className="font-medium">Fecha/Hora:</span>
                                                    <span>
                                                        {new Date(booking.departureTime).toLocaleDateString(locale === "es" ? "es-PE" : "en-US", {
                                                            weekday: "long",
                                                            month: "short",
                                                            day: "numeric",
                                                            hour: "2-digit",
                                                            minute: "2-digit",
                                                        })}
                                                    </span>
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex flex-col sm:items-end gap-2 shrink-0">
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs text-muted-foreground">{t("dashboard.member.paymentLabel")}:</span>
                                                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${PAYMENT_STATUS_STYLES[payStatus] ?? PAYMENT_STATUS_STYLES.pending}`}>
                                                    {getPaymentStatusLabel(payStatus, locale as any)}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs text-muted-foreground">{t("dashboard.member.bookingStatusLabel")}:</span>
                                                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${BOOKING_STATUS_STYLES[bookStatus] ?? BOOKING_STATUS_STYLES.pending}`}>
                                                    {getBookingStatusLabel(bookStatus, locale)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    {payStatus === "pending" && (
                                        <div className="mt-4 p-4 rounded-xl bg-amber-500/5 border border-amber-500/10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                                            <div className="text-xs text-amber-800 dark:text-amber-300">
                                                <p className="font-semibold flex items-center gap-1">
                                                    <span className="inline-block w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                                                    Requiere pago consolidado
                                                </p>
                                                <p className="text-muted-foreground mt-0.5">Puedes completar el pago consolidado (entrada + transporte) de forma unificada.</p>
                                            </div>
                                            <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                                                {booking.status === "pending" && (
                                                    <CancelTransportButton bookingId={booking.id} />
                                                )}
                                                <Link
                                                    href={`/member/payments/new/${booking.registrationId}`}
                                                    className="inline-flex items-center justify-center rounded-xl bg-amber-600 px-4 py-2 text-xs font-bold text-white hover:bg-amber-700 active:bg-amber-800 transition-colors shadow-sm hover:shadow"
                                                >
                                                    Pagar S/. {Number(booking.paymentAmount).toFixed(2)}
                                                </Link>
                                            </div>
                                        </div>
                                    )}

                                    {payStatus !== "pending" && booking.status === "pending" && (
                                        <div className="mt-4 flex justify-end">
                                            <CancelTransportButton bookingId={booking.id} />
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </section>
            )}
        </div>
    );
}
