export type MonthlyDataPoint = {
  month: string;
  events: number;
  registrations: number;
  users: number;
};

export type CategoryDataPoint = {
  name: string;
  value: number;
};

export interface AdminStatsChartsProps {
  monthlyData: MonthlyDataPoint[];
  categoryData: CategoryDataPoint[];
  paymentMethodsStats: { name: string; value: number }[];
  totalRevenue: number;
  pendingPaymentsCount: number;
  avgPayment: number;
  totalCapacity: number;
  occupiedSeats: number;
  checkedInCount: number;
  registeredCount: number;
  waitlistedCount: number;
  approvedPaymentsCount?: number;
  totalEventViews?: number;
  /** Oculta usuarios en el gráfico mensual (p. ej. métricas solo de eventos propios). */
  hideUserSeries?: boolean;
  /** Aclara que el total es solo eventos (no SaaS). */
  showEventRevenueHint?: boolean;
}

export const COLORS = ["#7c3aed", "#e11d48", "#ea580c", "#16a34a", "#d97706", "#4f46e5", "#06b6d4"];
