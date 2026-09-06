export interface BookingItem {
  id: string;
  seats: number;
  status: string;
  notes: string | null;
  passengerName: string | null;
  passengerEmail: string | null;
  passengerPhone: string | null;
  routeId?: string;
  routeName: string;
  departurePoint: string;
  driverName?: string | null;
  vehiclePlate?: string | null;
  stopName: string | null;
  stopSortOrder?: number | null;
  paymentStatus: string | null;
}

export interface PassengerManifestProps {
  eventId: string;
}
