import { Ticket, Event, Registration } from "@/lib/db/schema";

export interface TransportBookingInfo {
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
}

export interface GuestTicketItem {
  registration: Registration;
  ticket: Ticket | null;
  user: {
    name: string;
    email: string;
    phone: string | null;
  };
}

export interface ActiveGuestQrData {
  name: string;
  qrCode: string;
  code: string;
}

export interface TicketCardProps {
  ticket?: Ticket | null;
  event: Event;
  registration: Registration;
  paymentStatus?: string;
  paymentReceiptUrl?: string | null;
  paymentMethod?: string | null;
  transportBooking?: TransportBookingInfo | null;
  transportOfferFromPrice?: number | null;
  guests?: GuestTicketItem[];
  attendeeName?: string | null;
  defaultExpanded?: boolean;
  isExpanded?: boolean;
  onToggle?: () => void;
}
