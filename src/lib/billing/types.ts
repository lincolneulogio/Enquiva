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
  maxBroadcastsPerMonth: number | null;
  maxOrganizers: number | null;
  features: PlanFeatures;
};

export type PlanUsage = {
  activeEvents: number;
  broadcastsThisMonth: number;
};

export type SubscriptionRenewalAlert = "expiring_soon" | "past_due";

export type PlanChangePreview = {
  requiresConfirmation: boolean;
  currentPlanName: string;
  targetPlanName: string;
  daysRemaining: number;
  newPeriodEnd: string;
  isDowngrade: boolean;
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
};
