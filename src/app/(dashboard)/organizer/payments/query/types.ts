import type {
  payments as paymentsTable,
  registrations,
  events,
  users,
  transportBookings,
  transportRoutes,
} from "@/lib/db/schema";

export interface OrganizerPaymentsSearchParams {
  page?: string;
  eventId?: string;
  category?: string;
  status?: string;
  fromDate?: string;
  toDate?: string;
}

export interface OrganizerPaymentRowData {
  payment: typeof paymentsTable.$inferSelect;
  registration: typeof registrations.$inferSelect;
  event: typeof events.$inferSelect;
  attendee: typeof users.$inferSelect;
  transportBooking: typeof transportBookings.$inferSelect | null;
  transportRoute: typeof transportRoutes.$inferSelect | null;
}

export interface OrganizerPaymentsQueryResult {
  payments: OrganizerPaymentRowData[];
  total: number;
  totalPages: number;
  safePage: number;
  pendingCount: number;
  pageSize: number;
}
