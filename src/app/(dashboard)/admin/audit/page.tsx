import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { activityLogs } from "@/lib/db/schema";
import { desc, or, and, eq, ilike, count, inArray } from "drizzle-orm";
import { ShieldCheck, Search, Shield, User } from "lucide-react";
import { getI18n } from "@/lib/i18n/server";
import { TablePagination } from "@/components/dashboard";
import Link from "next/link";
import { normalizeRole } from "@/lib/auth/rbac";
import {
  activityLogInOrgCondition,
  isUnassignedAdminScope,
  resolveAdminScope,
} from "@/lib/organizations/admin-scope";

interface AdminAuditPageProps {
  searchParams: Promise<{
    page?: string;
    search?: string;
    action?: string;
    entityType?: string;
  }>;
}

const PAGE_SIZE = 15;

const actionBadgeStyles: Record<string, string> = {
  "user.role_change": "bg-blue-500/10 text-blue-700 border border-blue-500/20 dark:bg-blue-950/30 dark:text-blue-400",
  "user.delete": "bg-red-500/10 text-red-700 border border-red-500/20 dark:bg-red-950/30 dark:text-red-400",
  "event.create": "bg-green-500/10 text-green-700 border border-green-500/20 dark:bg-green-950/30 dark:text-green-400",
  "event.update": "bg-amber-500/10 text-amber-700 border border-amber-500/20 dark:bg-amber-950/30 dark:text-amber-400",
  "event.delete": "bg-red-500/10 text-red-700 border border-red-500/20 dark:bg-red-950/30 dark:text-red-400",
  "payment.status_update": "bg-purple-500/10 text-purple-700 border border-purple-500/20 dark:bg-purple-950/30 dark:text-purple-400",
};

const ACTION_LABEL_KEYS: Record<string, string> = {
  "user.role_change": "dashboard.admin.auditActionRoleChange",
  "user.delete": "dashboard.admin.auditActionUserDelete",
  "event.create": "dashboard.admin.auditActionEventCreate",
  "event.update": "dashboard.admin.auditActionEventUpdate",
  "event.delete": "dashboard.admin.auditActionEventDelete",
  "payment.status_update": "dashboard.admin.auditActionPaymentUpdate",
  "settings.update": "dashboard.admin.auditActionSettingsUpdate",
};

export default async function AdminAuditPage({ searchParams }: AdminAuditPageProps) {
  const session = await auth.api.getSession({ headers: await headers() });
  const role = normalizeRole(session?.user?.role);
  const adminScope = await resolveAdminScope();
  const isSuperAdmin = role === "super_admin";
  const isEntityAdmin = adminScope.mode === "org";

  if (!isSuperAdmin && !isEntityAdmin) redirect("/admin");
  if (isUnassignedAdminScope(adminScope)) redirect("/admin");

  const { locale, t } = await getI18n();
  const params = await searchParams;
  const requestedPage = Number(params.page ?? "1");
  const currentPage = Number.isFinite(requestedPage) && requestedPage > 0 ? Math.floor(requestedPage) : 1;
  const searchQuery = String(params.search ?? "").trim();
  const selectedAction = params.action ? String(params.action).trim() : "";
  const selectedEntity = params.entityType ? String(params.entityType).trim() : "";

  const conditions = [];

  if (isEntityAdmin && adminScope.mode === "org") {
    conditions.push(activityLogInOrgCondition(adminScope.organizationId));
  }

  if (searchQuery) {
    const matchedActions: string[] = [];
    const lowerSearch = searchQuery.toLowerCase();

    for (const [actionKey, labelKey] of Object.entries(ACTION_LABEL_KEYS)) {
      const label = t(labelKey).toLowerCase();
      if (label.includes(lowerSearch) || actionKey.toLowerCase().includes(lowerSearch)) {
        matchedActions.push(actionKey);
      }
    }

    const searchConditions = [
      ilike(activityLogs.actorName, `%${searchQuery}%`),
      ilike(activityLogs.details, `%${searchQuery}%`),
      ilike(activityLogs.action, `%${searchQuery}%`),
      ilike(activityLogs.entityType, `%${searchQuery}%`),
    ];

    if (lowerSearch.includes("rechaz") || lowerSearch.includes("reject")) {
      searchConditions.push(ilike(activityLogs.details, "%rejected%"));
    }
    if (lowerSearch.includes("aprob") || lowerSearch.includes("valid") || lowerSearch.includes("approv")) {
      searchConditions.push(ilike(activityLogs.details, "%approved%"));
    }
    if (lowerSearch.includes("pend") || lowerSearch.includes("pending")) {
      searchConditions.push(ilike(activityLogs.details, "%pending%"));
    }

    if (matchedActions.length > 0) {
      searchConditions.push(inArray(activityLogs.action, matchedActions));
    }

    conditions.push(or(...searchConditions));
  }

  if (selectedAction) {
    conditions.push(eq(activityLogs.action, selectedAction));
  }

  if (selectedEntity) {
    conditions.push(eq(activityLogs.entityType, selectedEntity));
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const [{ total }] = await db
    .select({ total: count() })
    .from(activityLogs)
    .where(whereClause);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages);
  const offset = (safePage - 1) * PAGE_SIZE;

  const logs = await db
    .select()
    .from(activityLogs)
    .where(whereClause)
    .orderBy(desc(activityLogs.createdAt))
    .limit(PAGE_SIZE)
    .offset(offset);

  const entityScopeNote =
    isEntityAdmin && adminScope.mode === "org"
      ? t("dashboard.admin.auditEntityScopeNote", { name: adminScope.organizationName })
      : null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold text-foreground flex items-center gap-2">
            <ShieldCheck className="h-8 w-8 text-primary" />
            {t("dashboard.admin.auditTitle")}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {entityScopeNote ?? t("dashboard.admin.auditIntro")}
          </p>
        </div>
      </div>

      <div className="bg-card border border-border/60 rounded-3xl p-6 shadow-sm">
        <form method="GET" action="/admin/audit" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground block">
              {t("dashboard.admin.auditSearchLabel")}
            </label>
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60" />
              <input
                type="text"
                name="search"
                defaultValue={params.search ?? ""}
                placeholder={t("dashboard.admin.auditSearchPlaceholder")}
                className="w-full rounded-xl border border-border bg-background pl-10 pr-4 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary h-10 transition-all text-foreground"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground block">
              {t("dashboard.admin.auditActionLabel")}
            </label>
            <select
              name="action"
              defaultValue={selectedAction}
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary h-10 transition-all text-foreground cursor-pointer"
            >
              <option value="">{t("dashboard.admin.auditAllActions")}</option>
              {Object.entries(ACTION_LABEL_KEYS).map(([key, labelKey]) => (
                <option key={key} value={key}>
                  {t(labelKey)}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground block">
              {t("dashboard.admin.auditModuleLabel")}
            </label>
            <select
              name="entityType"
              defaultValue={selectedEntity}
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary h-10 transition-all text-foreground cursor-pointer"
            >
              <option value="">{t("dashboard.admin.auditAllModules")}</option>
              <option value="user">{t("common.users")}</option>
              <option value="event">{t("common.event")}</option>
              <option value="payment">{t("common.payments")}</option>
              <option value="settings">{t("common.settings")}</option>
            </select>
          </div>

          <div className="flex gap-2 h-10">
            <button
              type="submit"
              className="flex-1 rounded-xl bg-primary hover:bg-primary/95 text-primary-foreground font-semibold px-4 text-xs transition duration-200 cursor-pointer h-full"
            >
              {t("dashboard.admin.auditFilter")}
            </button>
            {(params.search || params.action || params.entityType) && (
              <Link
                href="/admin/audit"
                className="rounded-xl border border-border bg-background hover:bg-secondary px-3 text-xs font-semibold flex items-center justify-center text-foreground transition-all h-full"
              >
                {t("dashboard.admin.auditClear")}
              </Link>
            )}
          </div>
        </form>
      </div>

      {logs.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-card p-12 text-center">
          <Shield className="mx-auto h-10 w-10 text-muted-foreground/50" />
          <p className="mt-4 font-medium text-foreground">{t("dashboard.admin.auditNoLogs")}</p>
          <p className="mt-1 text-sm text-muted-foreground">{t("dashboard.admin.auditNoLogsHelp")}</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px] table-fixed text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50 text-left font-medium text-muted-foreground">
                  <th className="px-4 py-3 w-[180px]">{t("common.date")}</th>
                  <th className="px-4 py-3 w-[180px]">{t("common.actor")}</th>
                  <th className="px-4 py-3 w-[180px]">{t("dashboard.admin.auditActionLabel")}</th>
                  <th className="px-4 py-3 w-[460px]">{t("common.details")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {logs.map((log) => {
                  const labelKey = ACTION_LABEL_KEYS[log.action];
                  const actionText = labelKey ? t(labelKey) : log.action;

                  let displayDetails = log.details || "—";
                  if (displayDetails.includes(". Notas:")) {
                    displayDetails = displayDetails.split(". Notas:")[0];
                  }

                  if (locale === "es") {
                    displayDetails = displayDetails
                      .replace("rejected", "rechazado")
                      .replace("approved", "aprobado")
                      .replace("pending", "pendiente");
                  } else {
                    displayDetails = displayDetails
                      .replace("Pago de S/.", "Payment of S/.")
                      .replace("marcado como:", "marked as:");
                  }

                  return (
                    <tr key={log.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-4 text-xs text-muted-foreground">
                        {new Date(log.createdAt).toLocaleString(locale === "en" ? "en-US" : "es-PE")}
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-primary/70 shrink-0" />
                          <span className="font-semibold text-foreground truncate max-w-[150px]">{log.actorName}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                            actionBadgeStyles[log.action] ??
                            "bg-muted text-muted-foreground border border-border"
                          }`}
                        >
                          {actionText}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-xs text-muted-foreground leading-relaxed break-words">
                        {displayDetails}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <TablePagination
            basePath="/admin/audit"
            currentPage={safePage}
            totalPages={totalPages}
            totalItems={total}
            pageSize={PAGE_SIZE}
            query={{
              search: params.search,
              action: params.action,
              entityType: params.entityType,
            }}
          />
        </div>
      )}
    </div>
  );
}
