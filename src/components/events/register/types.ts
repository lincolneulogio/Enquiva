export interface TransportRouteStop {
  id: string;
  name: string;
  latitude: string | null;
  longitude: string | null;
  sortOrder?: number;
  estimatedArrivalTime?: string | null;
  maxSeats?: number | null;
}

export interface TransportRoute {
  id: string;
  eventId: string;
  name: string;
  departurePoint: string;
  departureTime: string;
  returnTime: string | null;
  pricePerSeat: string;
  totalSeats: number;
  availableSeats?: number;
  description: string | null;
  isActive: boolean;
  isRoundTrip?: boolean;
  stops?: TransportRouteStop[];
}

export interface EventScheduleSlot {
  id: string;
  label?: string | null;
  date: string;
  endDate?: string | null;
}

export interface GuestInput {
  name: string;
  phone: string;
}

export interface RegistrationDraft {
  selectedScheduleId: string;
  wantsTransport: boolean;
  selectedRouteId: string;
  selectedStopId: string;
  seatsCount: number;
  contactPhone: string;
  guests: GuestInput[];
  wantsCertificate: boolean;
}

export interface RegisterButtonProps {
  eventId: string;
  isAuthenticated: boolean;
  isRegistrationClosed?: boolean;
  waitlistAvailable?: boolean;
  closedReason?: string | null;
  hasTransport?: boolean;
  currentStatus?: "registered" | "waitlisted" | "checked_in" | "cancelled" | null;
  registrationId?: string;
  transportRoutes?: TransportRoute[];
  eventPrice?: number;
  paymentStatus?: "pending" | "approved" | "rejected" | null;
  holdExpiresAt?: string | Date | null;
  eventSlug?: string;
  schedules?: EventScheduleSlot[] | null;
  hasCertificate?: boolean;
  certificateTitle?: string | null;
  certificatePrice?: number | null;
  buttonText?: string;
  buttonClassName?: string;
}
