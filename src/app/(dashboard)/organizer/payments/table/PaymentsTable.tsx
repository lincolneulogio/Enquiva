import { TablePagination } from "@/components/dashboard/shared/TablePagination";
import { PaymentsTableHeader } from "./PaymentsTableHeader";
import { PaymentTableRow } from "./PaymentTableRow";
import type { OrganizerPaymentsQueryResult, OrganizerPaymentsSearchParams } from "../query/types";

interface PaymentsTableProps {
  queryResult: OrganizerPaymentsQueryResult;
  searchParams: OrganizerPaymentsSearchParams;
  locale: "en" | "es";
  t: (key: string, params?: Record<string, string | number>) => string;
}

export function PaymentsTable({
  queryResult,
  searchParams,
  locale,
  t,
}: PaymentsTableProps) {
  const { payments, safePage, totalPages, total, pageSize } = queryResult;

  return (
    <div className="overflow-hidden rounded-3xl border border-border bg-card shadow-sm">
      <div className="overflow-x-auto">
        <p className="px-3 pt-2 text-[11px] text-muted-foreground sm:hidden">↔ Scroll</p>
        <table className="w-full min-w-[920px] text-sm">
          <PaymentsTableHeader t={t} />
          <tbody className="divide-y divide-border">
            {payments.map((item) => (
              <PaymentTableRow
                key={item.payment.id}
                item={item}
                locale={locale}
                t={t}
              />
            ))}
          </tbody>
        </table>
      </div>
      <TablePagination
        basePath="/organizer/payments"
        currentPage={safePage}
        totalPages={totalPages}
        totalItems={total}
        pageSize={pageSize}
        query={{
          eventId: searchParams.eventId,
          category: searchParams.category,
          status: searchParams.status,
          fromDate: searchParams.fromDate,
          toDate: searchParams.toDate,
        }}
      />
    </div>
  );
}
