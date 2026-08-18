import { getCategories, getOrganizerEvents } from "@/actions/events";
import { getMyPlanSummary } from "@/actions/billing";
import { PlanUsageBanner } from "@/components/dashboard/organizer/PlanUsageBanner";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import Link from "next/link";
import { Plus, Calendar, Users, Eye } from "lucide-react";
import { categoryLabel, eventStatusLabel, formatEventDateShort, statusColor } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { OrganizerGettingStarted } from "@/components/dashboard/organizer/OrganizerGettingStarted";
import { getI18n } from "@/lib/i18n/server";
import { OrganizationService } from "@/lib/organizations/organization.service";
import { LiveAttendeeCount } from "@/components/events/LiveAttendeeCount";

export default async function OrganizerDashboardPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return null;

  // Evita cargar datos del panel mientras el layout muestra el modal de espera.
  const pending = await OrganizationService.getPendingOrganizerMembershipForUser(
    session.user.id,
  );
  if (pending) return null;

  const { locale, t } = await getI18n();
  const organizerEvents = await getOrganizerEvents();
  const categories = await getCategories();
  const planSummary = await getMyPlanSummary();
  const categoryMap = Object.fromEntries(categories.map((category) => [category.slug, category.label]));

  const totalAttendees = organizerEvents.reduce(
    (sum, { attendeeCount }) => sum + (attendeeCount ?? 0),
    0
  );
  const publishedCount = organizerEvents.filter(
    ({ event }) => event.status === "published"
  ).length;

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold text-foreground sm:text-3xl">
            {t("dashboard.organizer.welcomeBack", {
              name: session?.user.name ?? "",
            })}
          </h1>
          <p className="mt-1 text-muted-foreground">
            {t("dashboard.organizer.manageEvents")}
          </p>
        </div>
        {planSummary.canCreateEvent ? (
          <Link
            href="/organizer/events/new"
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 sm:w-auto"
          >
            <Plus className="h-4 w-4" />
            {t("common.newEvent")}
          </Link>
        ) : planSummary.canManageBilling ? (
          <Link
            href="/organizer/billing"
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-amber-300 bg-amber-50 px-5 py-2.5 text-sm font-medium text-amber-900 transition-colors hover:bg-amber-100 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-200 sm:w-auto"
          >
            <Plus className="h-4 w-4" />
            {t("dashboard.organizer.planUpgradeToCreateMore")}
          </Link>
        ) : (
          <p className="rounded-xl border border-amber-300/60 bg-amber-50/80 px-4 py-2.5 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-200">
            {t("dashboard.organizer.planLimitContactAdmin")}
          </p>
        )}
      </div>

      <PlanUsageBanner summary={planSummary} showFeatures />

      {organizerEvents.length === 0 ? <OrganizerGettingStarted /> : null}

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          {
            label: t("dashboard.organizer.totalEvents"),
            value: organizerEvents.length,
            icon: Calendar,
            color: "text-primary",
            bg: "bg-primary/10",
          },
          {
            label: t("dashboard.organizer.published"),
            value: publishedCount,
            icon: Eye,
            color: "text-green-600",
            bg: "bg-green-100 dark:bg-green-900/20",
          },
          {
            label: t("dashboard.organizer.totalRegistrations"),
            value: totalAttendees,
            icon: Users,
            color: "text-accent",
            bg: "bg-accent/10",
          },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div
            key={label}
            className="rounded-2xl border border-border bg-card p-5 sm:p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{label}</p>
                <p className="mt-1 font-display text-2xl font-semibold text-foreground sm:text-3xl">
                  {value}
                </p>
              </div>
              <div className={cn("rounded-xl p-3", bg)}>
                <Icon className={cn("h-5 w-5", color)} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Events Table */}
      <div className="rounded-2xl border border-border bg-card">
        <div className="border-b border-border px-6 py-4">
          <h2 className="font-display text-xl font-semibold text-foreground">
            {t("dashboard.organizer.yourEvents")}
          </h2>
        </div>
        {organizerEvents.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Calendar className="mb-3 h-10 w-10 text-muted-foreground/40" />
            <p className="font-medium text-foreground">{t("dashboard.organizer.noEventsYet")}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {t("dashboard.organizer.createFirstEvent")}
            </p>
            <Link
              href="/organizer/events/new"
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
            >
              <Plus className="h-4 w-4" /> {t("common.createEvent")}
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <p className="px-3 pt-2 text-[11px] text-muted-foreground sm:hidden">↔ Scroll</p>
            <table className="w-full min-w-[780px]">
              <thead>
                <tr className="border-b border-border">
                  {[
                    t("common.event"),
                    t("common.date"),
                    t("common.category"),
                    t("common.status"),
                    t("common.registrations"),
                    "",
                  ].map(
                    (h) => (
                      <th
                        key={h}
                        className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground"
                      >
                        {h}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {organizerEvents.map(({ event, attendeeCount }) => (
                  <tr key={event.id} className="hover:bg-secondary/30 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-medium text-foreground line-clamp-1">
                        {event.title}
                      </p>
                    </td>
                    <td className="px-6 py-4 text-sm text-muted-foreground whitespace-nowrap">
                      {formatEventDateShort(event.date, locale)}
                    </td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">
                      {categoryLabel(event.category, locale)}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={cn(
                          "rounded-full px-2.5 py-1 text-xs font-medium",
                          statusColor(event.status)
                        )}
                      >
                        {eventStatusLabel(event.status, locale)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">
                      <LiveAttendeeCount
                        eventId={event.id}
                        initialCount={attendeeCount ?? 0}
                        capacity={event.capacity}
                        variant="table"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <Link
                        href={`/organizer/events/${event.id}`}
                        className="text-sm text-primary hover:underline"
                      >
                        {t("common.edit")} →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
