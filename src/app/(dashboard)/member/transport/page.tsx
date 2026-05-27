import { getMemberTransportOptions, getMyTransportBookings } from "@/actions/transport";
import { MemberTransportClient } from "@/components/dashboard";
import { getEventPaymentMethods } from "@/actions/payment-methods";

export default async function MemberTransportPage() {
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

    return (
        <MemberTransportClient
            options={optionsWithPayments.map((o) => ({
                ...o,
                routes: o.routes.map((r) => ({
                    ...r,
                    departureTime: new Date(r.departureTime),
                    returnTime: r.returnTime ? new Date(r.returnTime) : null,
                    pricePerSeat: String(r.pricePerSeat),
                    totalSeats: Number(r.totalSeats),
                    availableSeats: Number(r.availableSeats),
                    stops: r.stops.map((s) => ({
                        ...s,
                        latitude: s.latitude ? String(s.latitude) : null,
                        longitude: s.longitude ? String(s.longitude) : null,
                    })),
                })),
            }))}
            myBookings={myBookings.map((b) => ({
                ...b,
                departureTime: new Date(b.departureTime),
                paymentAmount: String(b.paymentAmount),
                seats: Number(b.seats),
                registrationId: b.registrationId ?? "",
            }))}
        />
    );
}
