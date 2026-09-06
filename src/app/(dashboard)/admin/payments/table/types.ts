import type { payments, registrations, events, users, transportBookings, transportRoutes } from "@/lib/db/schema";
import type { StaffDashboardBase } from "@/lib/navigation/dashboard-paths";

export interface PaymentItemRecord {
  payment: typeof payments.$inferSelect;
  registration: typeof registrations.$inferSelect;
  event: typeof events.$inferSelect;
  attendee: typeof users.$inferSelect;
  transportBooking: typeof transportBookings.$inferSelect | null;
  transportRoute: typeof transportRoutes.$inferSelect | null;
}

export interface PaymentsTableLabels {
  showingPayments: string;
  noPaymentsYet: string;
  noPaymentsFilter: string;
  noPaymentsDefault: string;
  paymentsLedger: string;
  scrollHorizontally: string;
  colPayments: string;
  colTime: string;
  colEvent: string;
  colAttendee: string;
  colAmount: string;
  colMethod: string;
  colReference: string;
  colStatus: string;
  colUpdate: string;
  colReceipt: string;
  viewReceipt: string;
  noReceipt: string;
  guest: string;
}

export interface PaymentsTableProps {
  payments: PaymentItemRecord[];
  total: number;
  isFiltered: boolean;
  locale: "en" | "es";
  staffBase: StaffDashboardBase;
  safePage: number;
  totalPages: number;
  pageSize: number;
  rowStart: number;
  sessionUserId: string;
  role: string;
  entityOrgId: string | null;
  params: {
    eventId?: string;
    category?: string;
    status?: string;
    fromDate?: string;
    toDate?: string;
  };
  labels: PaymentsTableLabels;
}
