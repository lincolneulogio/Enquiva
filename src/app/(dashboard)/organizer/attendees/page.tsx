import { db } from "@/lib/db";
import { registrations, events, users, registrationStatusEnum, registrationGuests } from "@/lib/db/schema";
import { getRequestSession } from "@/lib/request-context";
import { eq, desc, and, gte, lte, count, sql } from "drizzle-orm";
import { Users, Clock } from "lucide-react";
import { ManualCheckInButton } from "@/components/events/ManualCheckInButton";
import { ManualRegistrationDialog } from "@/components/events/ManualRegistrationDialog";
import { ExpressCheckInConsole } from "@/components/events/ExpressCheckInConsole";
import { getI18n } from "@/lib/i18n/server";
import {
  getIntlLocale,
  getPluralLabel,
  getRegistrationStatusLabel,
} from "@/lib/i18n/core";
import { TablePagination } from "@/components/dashboard/shared/TablePagination";
import { getExportEventOptions } from "@/actions/exports";

const PAGE_SIZE = 10;

interface PageProps {
  searchParams: Promise<{
    page?: string;
    eventId?: string;
    category?: string;
    status?: string;
    fromDate?: string;
    toDate?: string;
  }>;
}

export default async function OrganizerAttendeesPage({
  searchParams,
}: PageProps) {
  const { t, locale } = await getI18n();
  const params = await searchParams;
  const session = await getRequestSession();
  const organizerId = session!.user.id;

  const requestedPage = Number(params.page ?? "1");
  const currentPage =
    Number.isFinite(requestedPage) && requestedPage > 0
      ? Math.floor(requestedPage)
      : 1;

  const eventOptions = await getExportEventOptions("organizer");

  const conditions = [eq(events.organizerId, organizerId)];

  if (params.eventId) {
    conditions.push(eq(events.id, params.eventId));
  }
  if (params.category) {
    conditions.push(eq(events.category, params.category));
  }
  if (params.status && params.status !== "all") {
    const status = registrationStatusEnum.enumValues.find((value) => value === params.status);
    if (status) {
      conditions.push(eq(registrations.status, status));
    }
  }
  if (params.fromDate) {
    conditions.push(
      gte(
        registrations.registeredAt,
        new Date(`${params.fromDate}T00:00:00.000`),
      ),
    );
  }
  if (params.toDate) {
    conditions.push(
      lte(
        registrations.registeredAt,
        new Date(`${params.toDate}T23:59:59.999`),
      ),
    );
  }

  const whereClause = and(...conditions);

  const [{ total }] = await db
    .select({ total: count() })
    .from(registrations)
    .innerJoin(events, eq(registrations.eventId, events.id))
    .leftJoin(users, eq(registrations.userId, users.id))
    .leftJoin(registrationGuests, eq(registrations.guestId, registrationGuests.id))
    .where(whereClause);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages);
  const offset = (safePage - 1) * PAGE_SIZE;

  const rows = await db
    .select({
      registrationId: registrations.id,
      eventId: events.id,
      status: registrations.status,
      registeredAt: registrations.registeredAt,
      checkedInAt: registrations.checkedInAt,
      selectedScheduleLabel: registrations.selectedScheduleLabel,
      eventTitle: events.title,
      eventDate: events.date,
      eventSlug: events.slug,
      userName: sql<string>`coalesce(${registrationGuests.name}, ${users.name}, 'Asistente')`,
      userEmail: users.email,
    })
    .from(registrations)
    .innerJoin(events, eq(registrations.eventId, events.id))
    .leftJoin(users, eq(registrations.userId, users.id))
    .leftJoin(registrationGuests, eq(registrations.guestId, registrationGuests.id))
    .where(whereClause)
    .orderBy(desc(registrations.registeredAt))
    .limit(PAGE_SIZE)
    .offset(offset);

  const registrationWord = getPluralLabel(
    locale,
    "registration",
    "registrations",
    total,
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold text-foreground">
            {t("dashboard.organizer.attendeesTitle")}
          </h1>
          <p className="mt-1 text-muted-foreground">
            {t("dashboard.organizer.attendeesSummary", {
              count: total,
              label: registrationWord,
            })}
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <ManualRegistrationDialog
            events={eventOptions.map((e) => ({
              value: e.id,
              label: e.title,
            }))}
          />
        </div>
      </div>

      <ExpressCheckInConsole
        events={eventOptions.map((e) => ({
          value: e.id,
          label: e.title,
        }))}
      />

      {rows.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-card p-12 text-center">
          <Users className="mx-auto h-10 w-10 text-muted-foreground/50" />
          <p className="mt-4 font-medium text-foreground">
            {t("dashboard.organizer.noAttendeesYet")}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("dashboard.organizer.attendeesAppearHere")}
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <p className="px-3 pt-2 text-[11px] text-muted-foreground sm:hidden">
            ↔ Scroll
          </p>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                    {t("common.name")}
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                    {t("common.email")}
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                    {t("common.event")}
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                    {t("common.date")}
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                    {t("common.status")}
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                    {t("dashboard.organizer.checkedInAt")}
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                    {t("common.actions")}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {rows.map((row) => (
                  <tr
                    key={row.registrationId}
                    className="hover:bg-muted/30 transition-colors"
                  >
                    <td className="px-4 py-3 font-medium text-foreground">
                      {row.userName ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {row.userEmail}
                    </td>
                    <td className="px-4 py-3 text-foreground">
                      <div className="font-medium">{row.eventTitle}</div>
                      {row.selectedScheduleLabel && (
                        <span className="inline-flex items-center gap-1 rounded-md bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary mt-0.5 border border-primary/20">
                          <Clock className="h-3 w-3 shrink-0" />
                          <span>{row.selectedScheduleLabel}</span>
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {new Date(row.eventDate).toLocaleDateString(
                        getIntlLocale(locale),
                        {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        },
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          row.status === "checked_in"
                            ? "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400"
                            : row.status === "registered"
                              ? "bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400"
                              : "bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400"
                        }`}
                      >
                        {getRegistrationStatusLabel(row.status, locale)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {row.checkedInAt ? (
                        new Date(row.checkedInAt).toLocaleString(
                          getIntlLocale(locale),
                          {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          },
                        )
                      ) : (
                        <span className="text-muted-foreground/40">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {row.status === "registered" ? (
                        <ManualCheckInButton
                          registrationId={row.registrationId}
                          eventId={row.eventId}
                        />
                      ) : (
                        <span className="text-xs text-muted-foreground/60">
                          {t("dashboard.organizer.noAction")}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <TablePagination
            basePath="/organizer/attendees"
            currentPage={safePage}
            totalPages={totalPages}
            totalItems={total}
            pageSize={PAGE_SIZE}
            query={{
              eventId: params.eventId,
              category: params.category,
              status: params.status,
              fromDate: params.fromDate,
              toDate: params.toDate,
            }}
          />
        </div>
      )}
    </div>
  );
}
