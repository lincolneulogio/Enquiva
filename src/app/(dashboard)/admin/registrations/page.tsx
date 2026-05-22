import Link from "next/link";
import { db } from "@/lib/db";
import { registrations, events, users } from "@/lib/db/schema";
import { eq, desc, count } from "drizzle-orm";
import { ClipboardList } from "lucide-react";
import { getI18n } from "@/lib/i18n/server";
import { getIntlLocale } from "@/lib/i18n/core";
import { categoryLabel, registrationStatusLabel } from "@/lib/utils";
import { TablePagination } from "@/components/dashboard/TablePagination";
import { ExportDataPanel } from "@/components/dashboard/ExportDataPanel";
import { getExportEventOptions } from "@/actions/exports";
import { getCategories } from "@/actions/events";

interface AdminRegistrationsPageProps {
  searchParams: Promise<{
    page?: string;
  }>;
}

const PAGE_SIZE = 10;

const statusColor: Record<string, string> = {
  registered: "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400",
  waitlisted: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400",
  checked_in: "bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400",
  cancelled: "bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400",
};

export default async function AdminRegistrationsPage({ searchParams }: AdminRegistrationsPageProps) {
  const { locale, t } = await getI18n();
  const params = await searchParams;
  const requestedPage = Number(params.page ?? "1");
  const currentPage = Number.isFinite(requestedPage) && requestedPage > 0 ? Math.floor(requestedPage) : 1;

  const [{ total }] = await db.select({ total: count() }).from(registrations);
  const exportEventOptions = await getExportEventOptions("admin");
  const exportCategoryOptions = (await getCategories()).map((category) => ({
    value: category.slug,
    label: categoryLabel(category.slug, locale),
  }));
  const exportStatusOptions = ["all", "registered", "checked_in", "waitlisted", "cancelled"].map((value) => ({
    value,
    label: value === "all" ? t("common.all") : registrationStatusLabel(value, locale),
  }));
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages);
  const offset = (safePage - 1) * PAGE_SIZE;
  const rowStart = offset;

  const allRegistrations = await db
    .select({
      id: registrations.id,
      status: registrations.status,
      registeredAt: registrations.registeredAt,
      checkedInAt: registrations.checkedInAt,
      event: {
        id: events.id,
        title: events.title,
        slug: events.slug,
        date: events.date,
      },
      attendee: {
        id: users.id,
        name: users.name,
        email: users.email,
      },
    })
    .from(registrations)
    .innerJoin(events, eq(registrations.eventId, events.id))
    .innerJoin(users, eq(registrations.userId, users.id))
    .orderBy(desc(registrations.registeredAt))
    .limit(PAGE_SIZE)
    .offset(offset);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-semibold text-foreground">{t("common.registrations")}</h1>
        <p className="mt-1 text-muted-foreground">
          {t("dashboard.admin.registrationsIntro", {
            count: total,
            label: total === 1 ? (locale === "en" ? "registration" : "inscripción") : (locale === "en" ? "registrations" : "inscripciones"),
          })}
        </p>
      </div>

      <ExportDataPanel
        resource="registrations"
        scope="admin"
        eventOptions={exportEventOptions}
        categoryOptions={exportCategoryOptions}
        statusOptions={exportStatusOptions}
      />

      {allRegistrations.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-card p-12 text-center">
          <ClipboardList className="mx-auto h-10 w-10 text-muted-foreground/50" />
          <p className="mt-4 font-medium text-foreground">{t("dashboard.admin.noRegistrationsYet")}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("dashboard.admin.registrationsAppearHere")}
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <p className="px-3 pt-2 text-[11px] text-muted-foreground sm:hidden">↔ Scroll</p>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">N°</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">{t("common.attendee")}</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">{t("common.event")}</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">{t("common.status")}</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">{t("common.registered")}</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">{t("common.checkedIn")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {allRegistrations.map((reg, index) => (
                  <tr key={reg.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-4 text-muted-foreground">{rowStart + index + 1}</td>
                    <td className="px-4 py-4">
                      <p className="font-medium text-foreground">{reg.attendee.name}</p>
                      <p className="text-xs text-muted-foreground">{reg.attendee.email}</p>
                    </td>
                    <td className="px-4 py-4">
                      <Link
                        href={`/events/${reg.event.slug}`}
                        className="font-medium text-foreground hover:text-primary transition-colors"
                      >
                        {reg.event.title}
                      </Link>
                      <p className="text-xs text-muted-foreground">
                        {new Date(reg.event.date).toLocaleDateString(getIntlLocale(locale), {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </p>
                    </td>
                    <td className="px-4 py-4">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColor[reg.status] ?? "bg-secondary text-foreground"}`}
                      >
                        {registrationStatusLabel(reg.status, locale)}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-muted-foreground">
                      {new Date(reg.registeredAt).toLocaleDateString(getIntlLocale(locale), {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </td>
                    <td className="px-4 py-4 text-muted-foreground">
                      {reg.checkedInAt
                        ? new Date(reg.checkedInAt).toLocaleDateString(getIntlLocale(locale), {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })
                        : <span className="text-muted-foreground/40">—</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <TablePagination
            basePath="/admin/registrations"
            currentPage={safePage}
            totalPages={totalPages}
            totalItems={total}
            pageSize={PAGE_SIZE}
          />
        </div>
      )}
    </div>
  );
}
