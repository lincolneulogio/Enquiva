import { getAuditLogs } from "@/actions/audit";
import { formatRelativeTime } from "@/lib/utils";
import { getI18n } from "@/lib/i18n/server";
import { getRoleLabel } from "@/lib/i18n/core";

export default async function AdminAuditLogsPage() {
  const { locale, t } = await getI18n();
  const logs = await getAuditLogs(120);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-semibold text-foreground">{t("common.auditLogs")}</h1>
        <p className="mt-1 text-muted-foreground">
          {t("dashboard.admin.auditIntro")}
        </p>
      </div>

      <div className="overflow-hidden rounded-3xl border border-border bg-card shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">{t("common.actions")}</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">{t("common.actor")}</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">{t("common.entity")}</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">{t("common.target")}</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">{t("common.details")}</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">{t("common.when")}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {logs.map(({ log, user }) => (
              <tr key={log.id} className="hover:bg-muted/30 transition-colors">
                <td className="px-4 py-3 text-foreground">{log.action}</td>
                <td className="px-4 py-3 text-sm text-muted-foreground">
                  <div>{user?.name ?? t("common.system")}</div>
                  <div className="text-[10px] uppercase">{getRoleLabel(log.role, locale)}</div>
                </td>
                <td className="px-4 py-3 text-muted-foreground">{log.entity}</td>
                <td className="px-4 py-3 text-muted-foreground">{log.entityId ?? "—"}</td>
                <td className="px-4 py-3 text-xs text-muted-foreground">
                  {log.metadata ? JSON.stringify(log.metadata) : "—"}
                </td>
                <td className="px-4 py-3 text-xs text-muted-foreground">
                  {formatRelativeTime(log.createdAt, locale)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
