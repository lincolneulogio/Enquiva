export type PlanSlug = "free" | "pro" | "enterprise";

export type PlanFeatures = {
  culqi: boolean;
  transport: boolean;
  ai: boolean;
  exports: boolean;
  customBranding: boolean;
};

export type ResolvedPlan = {
  id: string;
  slug: PlanSlug | string;
  name: string;
  description: string | null;
  priceMonthly: number;
  currency: string;
  maxActiveEvents: number | null;
  maxAttendeesPerEvent: number | null;
  commissionPercent: number;
  /** PEN fijos por inscrito (titular + invitados) al aprobar el pago. */
  commissionPerRegistration: number;
  maxBroadcastsPerMonth: number | null;
  maxAiMessagesPerMonth: number | null;
  maxOrganizers: number | null;
  features: PlanFeatures;
};

export type PlanUsage = {
  activeEvents: number;
  broadcastsThisMonth: number;
  aiMessagesThisMonth: number;
};

export type SubscriptionRenewalAlert = "expiring_soon" | "past_due";

export type PlanChangePreview = {
  requiresConfirmation: boolean;
  currentPlanName: string;
  targetPlanName: string;
  daysRemaining: number;
  newPeriodEnd: string;
  effectiveAt: string;
  isDowngrade: boolean;
  timing: "immediate" | "scheduled";
  preservesRemainingDays: boolean;
};

export type SubscriptionInfo = {
  id: string;
  status: string;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  plan: ResolvedPlan;
  /** Plan facturado en BD cuando el estado es past_due (límites efectivos = plan). */
  billedPlan?: ResolvedPlan;
  usage: PlanUsage;
  renewalAlert?: SubscriptionRenewalAlert | null;
  daysUntilRenewal?: number | null;
  autoRenewEnabled: boolean;
  hasSavedCard: boolean;
  culqiCardLastFour?: string | null;
  culqiCardBrand?: string | null;
  accessBlocked: boolean;
  billingScope?: "organization" | "user" | "platform";
  canManageBilling?: boolean;
  organizationName?: string | null;
  pendingPlan?: ResolvedPlan | null;
  pendingPlanEffectiveAt?: Date | null;
  /** false cuando el superadmin aún no creó el plan free (u otros). */
  plansConfigured?: boolean;
};
