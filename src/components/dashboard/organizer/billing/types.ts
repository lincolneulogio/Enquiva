import type { Plan, PaymentMethod, SubscriptionPayment } from "@/lib/db/schema";
import type { SubscriptionInfo } from "@/lib/billing/types";

export interface PendingPayment {
  payment: {
    id: string;
    amount: string;
    method: string;
    createdAt: Date;
  };
  plan: Plan;
}

export interface PaymentHistoryRow {
  payment: SubscriptionPayment;
  plan: Plan;
}

export interface OrganizerBillingClientProps {
  subscription: SubscriptionInfo;
  availablePlans: Plan[];
  platformMethods: PaymentMethod[];
  culqiPublicKey: string | null;
  userEmail: string | null;
  culqiAvailable: boolean;
  pendingPayment: PendingPayment | null;
  paymentHistory: PaymentHistoryRow[];
  readOnly?: boolean;
  pageVariant?: "organizer" | "entity";
}

export const PAYMENT_STATUS_KEYS: Record<string, string> = {
  pending: "billing.organizer.statusPending",
  approved: "billing.organizer.statusApproved",
  rejected: "billing.organizer.statusRejected",
};

export const PAYMENT_STATUS_STYLES: Record<string, string> = {
  pending: "bg-amber-500/10 text-amber-700 border-amber-500/20 dark:text-amber-400",
  approved: "bg-emerald-500/10 text-emerald-700 border-emerald-500/20 dark:text-emerald-400",
  rejected: "bg-rose-500/10 text-rose-700 border-rose-500/20 dark:text-rose-400",
};
