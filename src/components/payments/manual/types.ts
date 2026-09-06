export interface EventMethod {
  id: string;
  type: "yape" | "plin" | "cash" | "culqi";
  label: string;
  qrCodeUrl?: string | null;
  phone?: string | null;
  holderName: string;
}

export interface ManualPaymentMethodFormProps {
  registrationId: string;
  eventTitle: string;
  eventSlug: string;
  defaultAmount: number;
  existingMethod?: string | null;
  eventMethods: EventMethod[];
  /** Sin card externa ni título (cuando ya está envuelto por PaymentCheckoutForm). */
  embedded?: boolean;
}
