import { Calendar, CreditCard } from "lucide-react";
import { TablePagination } from "@/components/dashboard/shared/TablePagination";
import { staffDashboardPath, type StaffDashboardBase } from "@/lib/navigation/dashboard-paths";
import { canMutateEventRecord } from "@/lib/organizations/admin-scope";
import { PaymentTableRow } from "./PaymentTableRow";
import { getPaymentDynamicCaption } from "./payment-caption";
import type { payments, registrations, events, users, transportBookings, transportRoutes } from "@/lib/db/schema";

export interface PaymentItemRecord {
  payment: typeof payments.$inferSelect;
  registration: typeof registrations.$inferSelect;
  event: typeof events.$inferSelect;
  attendee: typeof users.$inferSelect;
  transportBooking: typeof transportBookings.$inferSelect | null;
  transportRoute: typeof transportRoutes.$inferSelect | null;
}

interface PaymentsTableProps {
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
  labels: {
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
  };
}

export function PaymentsTable({
  payments: allPayments,
  total,
  isFiltered,
  locale,
  staffBase,
  safePage,
  totalPages,
  pageSize,
  rowStart,
  sessionUserId,
  role,
  entityOrgId,
  params,
  labels,
}: PaymentsTableProps) {
  return (
    <div className="overflow-hidden rounded-3xl border border-border bg-card shadow-sm">
      <div className="border-b border-border px-6 py-4">
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <Calendar className="h-4 w-4" />
          <span>{labels.showingPayments}</span>
        </div>
      </div>
      {allPayments.length === 0 ? (
        <div className="p-12 text-center">
          <p className="font-medium text-foreground">{labels.noPaymentsYet}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {isFiltered ? labels.noPaymentsFilter : labels.noPaymentsDefault}
          </p>
        </div>
      ) : (
        <>
          <div className="px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-border bg-muted/10">
            <span className="text-xs font-semibold text-foreground flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-primary" />
              {labels.paymentsLedger}
            </span>
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground/80 font-medium">
              ↔ {labels.scrollHorizontally}
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1600px] table-fixed text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground w-[60px]">
                    N°
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground w-[110px]">
                    {labels.colPayments}
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground w-[100px]">
                    {labels.colTime}
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground w-[200px]">
                    {labels.colEvent}
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground w-[240px]">
                    {labels.colAttendee}
                  </th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground w-[170px]">
                    {labels.colAmount}
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground w-[100px]">
                    {labels.colMethod}
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground w-[140px]">
                    {labels.colReference}
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground w-[140px]">
                    {labels.colStatus}
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground w-[170px]">
                    {labels.colUpdate}
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground w-[170px]">
                    {labels.colReceipt}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {allPayments.map(
                  (
                    {
                      payment,
                      registration,
                      event,
                      attendee,
                      transportBooking,
                    },
                    index,
                  ) => {
                    const canUpdateStatus = canMutateEventRecord(
                      {
                        organizerId: event.organizerId,
                        organizationId: event.organizationId,
                      },
                      sessionUserId,
                      role,
                      entityOrgId,
                    );
                    const dynamicCaption = getPaymentDynamicCaption(
                      payment.notes,
                      registration.notes,
                      transportBooking?.seats ?? null,
                      locale,
                    );

                    return (
                      <PaymentTableRow
                        key={payment.id}
                        payment={payment}
                        registration={registration}
                        event={event}
                        attendee={attendee}
                        transportBooking={transportBooking}
                        index={index}
                        rowStart={rowStart}
                        locale={locale}
                        canUpdateStatus={canUpdateStatus}
                        dynamicCaption={dynamicCaption}
                        viewReceiptLabel={labels.viewReceipt}
                        noReceiptLabel={labels.noReceipt}
                        guestLabel={labels.guest}
                      />
                    );
                  },
                )}
              </tbody>
            </table>
          </div>

          <TablePagination
            basePath={staffDashboardPath(staffBase, "/payments")}
            currentPage={safePage}
            totalPages={totalPages}
            totalItems={total}
            pageSize={pageSize}
            query={{
              eventId: params.eventId,
              category: params.category,
              status: params.status,
              fromDate: params.fromDate,
              toDate: params.toDate,
            }}
          />
        </>
      )}
    </div>
  );
}
