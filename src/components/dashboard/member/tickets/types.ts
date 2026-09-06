import type { Ticket, Event, Registration } from "@/lib/db/schema";

export interface UnifiedTicketItem {
  ticket?: Ticket | null;
  event: Event;
  registration: Registration;
  paymentStatus?: string;
  paymentReceiptUrl?: string | null;
  paymentMethod?: string | null;
  transportBooking?: {
    booking: {
      id: string;
      seats: number;
      status: string;
      notes: string | null;
      bookedAt: Date;
    };
    route: {
      name: string;
      departurePoint: string;
      departureTime: Date;
      returnTime: Date | null;
      pricePerSeat: string;
    };
    stop: {
      name: string;
      latitude: string | null;
      longitude: string | null;
    } | null;
  } | null;
  /** Precio mínimo de rutas activas si aún no reservó transporte (add-on) */
  transportOfferFromPrice?: number | null;
  guests?: Array<{
    registration: Registration;
    ticket: Ticket | null;
    user: {
      name: string;
      email: string;
      phone: string | null;
    };
  }>;
  attendeeName?: string | null;
}

export interface MemberTicketsClientProps {
  tickets: UnifiedTicketItem[];
}
