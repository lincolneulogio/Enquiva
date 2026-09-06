import { Calendar, CreditCard } from "lucide-react";
import { TablePagination } from "@/components/dashboard/shared/TablePagination";
import { staffDashboardPath } from "@/lib/navigation/dashboard-paths";
import { canMutateEventRecord } from "@/lib/organizations/admin-scope";
import { PaymentTableRow } from "./PaymentTableRow";
import { PaymentsTableHeader } from "./PaymentsTableHeader";
import { PaymentsTableEmpty } from "./PaymentsTableEmpty";
import { getPaymentDynamicCaption } from "../query/payment-caption";
import type { PaymentsTableProps } from "./types";

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
        <PaymentsTableEmpty isFiltered={isFiltered} labels={labels} />
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
              <PaymentsTableHeader labels={labels} />
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
