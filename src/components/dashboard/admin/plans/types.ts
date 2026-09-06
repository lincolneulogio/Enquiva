import type { Plan } from "@/lib/db/schema";

export type PlansTab = "list" | "editor";

export interface PlansManagerProps {
  initialPlans: Plan[];
}

export interface PlanFormData {
  slug: string;
  name: string;
  description: string;
  priceMonthly: string;
  maxActiveEvents: string;
  maxAttendeesPerEvent: string;
  commissionPercent: string;
  commissionPerRegistration: string;
  maxBroadcastsPerMonth: string;
  maxAiMessagesPerMonth: string;
  maxOrganizers: string;
  featureCulqi: boolean;
  featureTransport: boolean;
  featureAi: boolean;
  featureExports: boolean;
  featureCustomBranding: boolean;
}

export const emptyForm: PlanFormData = {
  slug: "",
  name: "",
  description: "",
  priceMonthly: "0",
  maxActiveEvents: "",
  maxAttendeesPerEvent: "",
  commissionPercent: "5",
  commissionPerRegistration: "0.50",
  maxBroadcastsPerMonth: "",
  maxAiMessagesPerMonth: "",
  maxOrganizers: "",
  featureCulqi: false,
  featureTransport: false,
  featureAi: false,
  featureExports: false,
  featureCustomBranding: false,
};

export const featureBadgeClass: Record<string, string> = {
  culqi: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  transport: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300",
  ai: "bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-300",
  exports: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
  branding: "bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-300",
};

export const inputClass =
  "w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground transition focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-60";

export const cardClass = "rounded-2xl border border-border bg-card p-6 shadow-sm";
