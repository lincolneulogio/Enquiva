import type React from "react";
import { Smartphone, QrCode, Wallet, CreditCard } from "lucide-react";

export interface Stop {
  id: string;
  name: string;
  latitude: string | null;
  longitude: string | null;
  sortOrder?: number;
  estimatedArrivalTime?: Date | string | null;
  maxSeats?: number | null;
}

export interface Route {
  id: string;
  name: string;
  departurePoint: string;
  departureTime: Date;
  returnTime: Date | null;
  pricePerSeat: string;
  totalSeats: number;
  availableSeats: number;
  isRoundTrip?: boolean;
  stops?: Stop[];
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

export interface TransportBookingFormProps {
  route: Route;
  registrationId: string;
  paymentMethods: PaymentMethod[];
  culqiPublicKey?: string | null;
  eventTitle?: string;
}

export interface CancelTransportButtonProps {
  bookingId: string;
}

export const TYPE_CONFIG: Record<
  string,
  { label: string; icon: React.ComponentType<{ className?: string }> }
> = {
  yape: { label: "Yape", icon: Smartphone },
  plin: { label: "Plin", icon: QrCode },
  cash: { label: "Efectivo", icon: Wallet },
  culqi: { label: "Tarjeta / Culqi", icon: CreditCard },
};
