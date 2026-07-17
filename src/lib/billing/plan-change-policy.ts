export type PlanChangeTiming = "immediate" | "scheduled";

export function addBillingMonth(date: Date): Date {
  const next = new Date(date);
  const originalDay = next.getUTCDate();
  next.setUTCDate(1);
  next.setUTCMonth(next.getUTCMonth() + 1);
  const lastDay = new Date(
    Date.UTC(next.getUTCFullYear(), next.getUTCMonth() + 1, 0),
  ).getUTCDate();
  next.setUTCDate(Math.min(originalDay, lastDay));
  return next;
}

export function decidePlanChangeTiming(input: {
  currentPrice: number;
  targetPrice: number;
  currentPlanId: string;
  targetPlanId: string;
  currentStatus: string;
  currentPeriodEnd: Date;
  now: Date;
}): {
  timing: PlanChangeTiming;
  isDowngrade: boolean;
  hasActivePaidPeriod: boolean;
} {
  const differentPlan = input.currentPlanId !== input.targetPlanId;
  const hasActivePaidPeriod =
    input.currentStatus === "active" &&
    input.currentPrice > 0 &&
    input.currentPeriodEnd > input.now;
  const isDowngrade =
    differentPlan &&
    hasActivePaidPeriod &&
    input.targetPrice < input.currentPrice;

  return {
    timing: isDowngrade ? "scheduled" : "immediate",
    isDowngrade,
    hasActivePaidPeriod,
  };
}

export function purchasedPeriodEnd(input: {
  currentPeriodEnd: Date;
  now: Date;
  hasActivePaidPeriod: boolean;
  paymentReceived: boolean;
}): Date {
  return input.paymentReceived && input.hasActivePaidPeriod
    ? addBillingMonth(input.currentPeriodEnd)
    : addBillingMonth(input.now);
}
