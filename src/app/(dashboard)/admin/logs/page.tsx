import { getAuditLogs } from "@/actions/audit";
import { formatRelativeTime } from "@/lib/utils";

export default async function AdminAuditLogsPage() {
  const logs = await getAuditLogs(120);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-semibold text-foreground">Audit Logs</h1>
        <p className="mt-1 text-muted-foreground">
          Track critical activity across the platform.
        </p>
      </div>

      <div className="overflow-hidden rounded-3xl border border-border bg-card shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Action</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Actor</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Entity</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Target</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Details</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">When</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {logs.map(({ log, user }) => (
              <tr key={log.id} className="hover:bg-muted/30 transition-colors">
                <td className="px-4 py-3 text-foreground">{log.action}</td>
                <td className="px-4 py-3 text-sm text-muted-foreground">
                  <div>{user?.name ?? "System"}</div>
                  <div className="text-[10px] uppercase">{log.role}</div>
                </td>
                <td className="px-4 py-3 text-muted-foreground">{log.entity}</td>
                <td className="px-4 py-3 text-muted-foreground">{log.entityId ?? "—"}</td>
                <td className="px-4 py-3 text-xs text-muted-foreground">
                  {log.metadata ? JSON.stringify(log.metadata) : "—"}
                </td>
                <td className="px-4 py-3 text-xs text-muted-foreground">
                  {formatRelativeTime(log.createdAt)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
