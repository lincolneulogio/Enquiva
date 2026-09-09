import { Users } from "lucide-react";
import { ManualRegistrationDialog } from "@/components/events/ManualRegistrationDialog";
import { ExpressCheckInConsole } from "@/components/events/ExpressCheckInConsole";
import { getI18n } from "@/lib/i18n/server";
import { getPluralLabel } from "@/lib/i18n/core";
import { getRequestSession } from "@/lib/request-context";
import {
  getOrganizerAttendees,
  ATTENDEES_PAGE_SIZE,
  type AttendeeQueryParams,
} from "./attendees-query";
import { AttendeesTable } from "./AttendeesTable";

interface PageProps {
  searchParams: Promise<AttendeeQueryParams>;
}

export default async function OrganizerAttendeesPage({
  searchParams,
}: PageProps) {
  const { t, locale } = await getI18n();
  const params = await searchParams;
  const session = await getRequestSession();
  const organizerId = session!.user.id;

  const { total, totalPages, safePage, rows, eventOptions } =
    await getOrganizerAttendees(organizerId, params);

  const registrationWord = getPluralLabel(
    locale,
    "registration",
    "registrations",
    total,
  );

  const eventSelectOptions = eventOptions.map((e) => ({
    value: e.id,
    label: e.title,
  }));

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
        <div className="flex w-full sm:w-auto items-center gap-3 shrink-0">
          <ManualRegistrationDialog events={eventSelectOptions} />
        </div>
      </div>

      <ExpressCheckInConsole events={eventSelectOptions} />

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
        <AttendeesTable
          rows={rows}
          locale={locale}
          t={t}
          safePage={safePage}
          totalPages={totalPages}
          total={total}
          pageSize={ATTENDEES_PAGE_SIZE}
          params={params}
        />
      )}
    </div>
  );
}
