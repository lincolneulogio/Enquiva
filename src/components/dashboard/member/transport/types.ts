export interface RouteStop {
  id: string;
  name: string;
  latitude: string | null;
  longitude: string | null;
}

export interface RouteItem {
  id: string;
  name: string;
  departurePoint: string;
  departureTime: Date;
  returnTime: Date | null;
  pricePerSeat: string;
  totalSeats: number;
  availableSeats: number;
  alreadyBooked: boolean;
  isRoundTrip?: boolean;
  stops: RouteStop[];
}

export interface PaymentMethod {
  id: string;
  type: "yape" | "plin" | "cash" | "culqi";
  label: string;
  qrCodeUrl?: string | null;
  phone?: string | null;
  holderName: string;
  culqiPublicKey?: string | null;
}

export interface EventOption {
  registrationId: string;
  eventId: string;
  eventTitle: string;
  routes: RouteItem[];
  paymentMethods: PaymentMethod[];
}

export interface BookingItem {
  id: string;
  routeName: string;
  departurePoint: string;
  departureTime: Date;
  seats: number;
  paymentAmount: string;
  paymentStatus: string | null;
  status: string | null;
  registrationId: string;
}

export const PAYMENT_STATUS_STYLES: Record<string, string> = {
  pending: "bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400 border border-amber-200/50 dark:border-amber-900/30",
  approved: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-900/30",
  rejected: "bg-red-50 text-red-700 dark:bg-red-950/20 dark:text-red-400 border border-red-200/50 dark:border-red-900/30",
};

export const BOOKING_STATUS_STYLES: Record<string, string> = {
  pending: "bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400 border border-amber-200/50 dark:border-amber-900/30",
  confirmed: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-900/30",
  cancelled: "bg-red-50 text-red-700 dark:bg-red-950/20 dark:text-red-400 border border-red-200/50 dark:border-red-900/30",
};

export function getBookingStatusLabel(status: string, locale: string) {
  const labels: Record<string, Record<string, string>> = {
    pending: { es: "Pendiente", en: "Pending" },
    confirmed: { es: "Confirmado", en: "Confirmed" },
    cancelled: { es: "Cancelado", en: "Cancelled" },
  };
  return labels[status]?.[locale] ?? status;
}
