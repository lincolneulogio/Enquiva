import type { PaymentMethod } from "@/lib/db/schema";
import type { PaymentMethodScope } from "@/actions/payment-methods";
import { Smartphone, QrCode, Wallet, CreditCard } from "lucide-react";

export type { PaymentMethodScope };

export const TYPE_ICONS = { yape: Smartphone, plin: QrCode, cash: Wallet, culqi: CreditCard };
export const TYPE_LABELS = { yape: "Yape", plin: "Plin", cash: "Efectivo", culqi: "Tarjeta (Culqi)" };

export const ORGANIZER_BASE_TYPES = ["cash"] as const;
export const PLATFORM_TYPES = ["culqi"] as const;

export interface PaymentMethodsManagerProps {
  scope: PaymentMethodScope;
  methods: PaymentMethod[];
  canUseCulqi: boolean;
  planIncludesCulqi?: boolean;
  billedPlanIncludesCulqi?: boolean;
  subscriptionPastDue?: boolean;
  culqiConfigured: boolean;
  hasCulqiMethod: boolean;
  legacyEventLinkCount?: number;
  role: string;
  isStaff: boolean;
  canManageBilling?: boolean;
}

export interface PaymentMethodFormValues extends Record<string, unknown> {
  type: "yape" | "plin" | "cash" | "culqi";
  label: string;
  holderName: string;
  phone: string;
  qrPreview: string | null;
  culqiPublicKey: string;
  culqiSecretKey: string;
}
