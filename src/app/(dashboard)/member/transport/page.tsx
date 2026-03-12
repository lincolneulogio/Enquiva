import Link from "next/link";
import { Bus, Calendar, Ticket } from "lucide-react";
import { getMemberTransportOptions, getMyTransportBookings } from "@/actions/transport";
import { TransportBookingForm, CancelTransportButton } from "@/components/tickets/TransportBookingForm";

export default async function MemberTransportPage() {
    const [options, myBookings] = await Promise.all([
        getMemberTransportOptions(),
        getMyTransportBookings(),
    ]);

    const hasAnyRoute = options.some((o) => o.routes.length > 0);

    return (
        <div className="space-y-8">
            <div>
                <h1 className="font-display text-3xl font-semibold text-foreground">Transporte</h1>
                <p className="mt-1 text-muted-foreground">
                    Reserva movilidad para tus eventos registrados.
                </p>
            </div>

            {options.length === 0 && (
                <div className="rounded-xl border border-dashed border-border bg-card p-12 text-center">
                    <Ticket className="mx-auto h-10 w-10 text-muted-foreground/50" />
                    <p className="mt-4 font-medium text-foreground">Aún no tienes eventos activos</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Primero regístrate en un evento para ver rutas de transporte.
                    </p>
                    <Link
                        href="/events"
                        className="mt-4 inline-flex items-center gap-1 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
                    >
                        Explorar eventos
                    </Link>
                </div>
            )}

            {options.length > 0 && !hasAnyRoute && (
                <div className="rounded-xl border border-dashed border-border bg-card p-12 text-center">
                    <Bus className="mx-auto h-10 w-10 text-muted-foreground/50" />
                    <p className="mt-4 font-medium text-foreground">No hay rutas de transporte disponibles</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Tus eventos registrados no tienen transporte habilitado o aún no se crearon rutas.
                    </p>
                    <Link
                        href="/member/events"
                        className="mt-4 inline-flex items-center gap-1 rounded-lg border border-border bg-secondary px-4 py-2 text-sm font-medium text-foreground hover:bg-secondary/80 transition-colors"
                    >
                        Ver mis eventos
                    </Link>
                </div>
            )}

            {options.map((eventItem) => (
                <section key={eventItem.registrationId} className="space-y-3">
                    <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-primary" />
                        <h2 className="font-display text-xl font-semibold text-foreground">
                            {eventItem.eventTitle}
                        </h2>
                    </div>

                    {eventItem.routes.length === 0 ? (
                        <p className="text-sm text-muted-foreground">
                            Sin rutas disponibles para este evento.
                        </p>
                    ) : (
                        <div className="grid gap-4 lg:grid-cols-2">
                            {eventItem.routes.map((route) =>
                                route.alreadyBooked ? (
                                    <div key={route.id} className="rounded-2xl border border-border bg-card p-5">
                                        <div className="flex items-start justify-between gap-3">
                                            <div>
                                                <h3 className="font-semibold text-foreground">{route.name}</h3>
                                                <p className="mt-0.5 text-sm text-muted-foreground">{route.departurePoint}</p>
                                            </div>
                                            <span className="rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-700 dark:bg-green-900/20 dark:text-green-400">
                                                Ya reservada
                                            </span>
                                        </div>
                                        <p className="mt-2 text-xs text-muted-foreground">
                                            Si necesitas cambios, cancela tu reserva pendiente desde la sección &quot;Mis reservas&quot;.
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
                                        }}
                                        registrationId={eventItem.registrationId}
                                    />
                                )
                            )}
                        </div>
                    )}
                </section>
            ))}

            {myBookings.length > 0 && (
                <section className="space-y-3">
                    <h2 className="font-display text-xl font-semibold text-foreground">Mis reservas</h2>
                    <div className="space-y-3">
                        {myBookings.map((booking) => (
                            <div key={booking.id} className="rounded-xl border border-border bg-card p-4">
                                <div className="flex flex-wrap items-center justify-between gap-3">
                                    <div>
                                        <p className="font-medium text-foreground">{booking.routeName}</p>
                                        <p className="text-xs text-muted-foreground">
                                            {booking.seats} asiento{booking.seats > 1 ? "s" : ""} · S/. {Number(booking.paymentAmount).toFixed(2)}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <span className="inline-flex items-center rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                                            Pago: {booking.paymentStatus}
                                        </span>
                                        <p className="mt-1 text-xs text-muted-foreground">Estado reserva: {booking.status}</p>
                                    </div>
                                </div>
                                {booking.status === "pending" && (
                                    <div className="mt-3">
                                        <CancelTransportButton bookingId={booking.id} />
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </section>
            )}
        </div>
    );
}
