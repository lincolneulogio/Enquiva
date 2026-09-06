export interface Route {
  id: string;
  eventId: string;
  name: string;
  departurePoint: string;
  departureTime: Date;
  returnTime: Date | null;
  pricePerSeat: string;
  totalSeats: number;
  description: string | null;
  driverName?: string | null;
  vehiclePlate?: string | null;
  isRoundTrip?: boolean;
  pendingHoldHours?: number;
  isActive: boolean;
  bookedSeats: number;
}

export type StopRow = {
  id: string;
  name: string;
  latitude: string | null;
  longitude: string | null;
  sortOrder: number;
  estimatedArrivalTime: Date | string | null;
  maxSeats: number | null;
};

export interface RouteFormData {
  name: string;
  departurePoint: string;
  departureDate: string;
  departureClock: string;
  returnDate: string;
  returnClock: string;
  pricePerSeat: string;
  totalSeats: string;
  description: string;
  driverName: string;
  vehiclePlate: string;
  isRoundTrip: boolean;
  pendingHoldHours: string;
}

export interface EventInfoContext {
  title?: string | null;
  date?: Date | string | null;
  endDate?: Date | string | null;
  location?: string | null;
  isVirtual?: boolean;
  latitude?: number | null;
  longitude?: number | null;
}

export interface TransportRoutesManagerProps {
  eventId: string;
  initialRoutes: Route[];
  eventInfo?: EventInfoContext;
}
