import { db } from "@/lib/db";
import { activityLogs } from "@/lib/db/schema";
import { desc, or, ilike, count, sql } from "drizzle-orm";
import { ShieldCheck, Search, Shield, User, Globe, Laptop, KeyRound } from "lucide-react";
import { getI18n } from "@/lib/i18n/server";
import { formatEventDate } from "@/lib/utils";
import { TablePagination } from "@/components/dashboard";
import Link from "next/link";

interface AdminAuditPageProps {
  searchParams: Promise<{
    page?: string;
    search?: string;
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

const actionLabels: Record<string, Record<string, string>> = {
  "user.role_change": {
    es: "Cambio de rol",
    en: "Role change",
  },
  "user.delete": {
    es: "Usuario eliminado",
    en: "User deleted",
  },
  "event.create": {
    es: "Evento creado",
    en: "Event created",
  },
  "event.update": {
    es: "Evento modificado",
    en: "Event updated",
  },
  "event.delete": {
    es: "Evento eliminado",
    en: "Event deleted",
  },
  "payment.status_update": {
    es: "Actualización de pago",
    en: "Payment status update",
  },
  "settings.update": {
    es: "Configuración actualizada",
    en: "Settings updated",
  },
};

export default async function AdminAuditPage({ searchParams }: AdminAuditPageProps) {
  const { locale, t } = await getI18n();
  const params = await searchParams;
  const requestedPage = Number(params.page ?? "1");
  const currentPage = Number.isFinite(requestedPage) && requestedPage > 0 ? Math.floor(requestedPage) : 1;
  const searchQuery = String(params.search ?? "").trim();

  // Build filter conditions
  const conditions = [];
  if (searchQuery) {
    conditions.push(
      or(
        ilike(activityLogs.actorName, `%${searchQuery}%`),
        ilike(activityLogs.action, `%${searchQuery}%`),
        ilike(activityLogs.entityType, `%${searchQuery}%`),
        ilike(activityLogs.details, `%${searchQuery}%`)
      )
    );
  }

  const whereClause = conditions.length > 0 ? conditions[0] : undefined;

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

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold text-foreground flex items-center gap-2">
            <ShieldCheck className="h-8 w-8 text-primary" />
            {locale === "en" ? "Security Audit Logs" : "Registro de Auditoría"}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {locale === "en"
              ? "Monitor administrative activity, role shifts, and critical database actions."
              : "Monitorea la actividad administrativa, cambios de roles y modificaciones críticas del sistema."}
          </p>
        </div>
      </div>

      {/* Search Bar Panel */}
      <div className="bg-card border border-border/60 rounded-2xl p-5 shadow-sm">
        <form method="GET" action="/admin/audit" className="flex gap-3 max-w-lg">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60" />
            <input
              type="text"
              name="search"
              defaultValue={params.search ?? ""}
              placeholder={locale === "en" ? "Search by actor, action or detail..." : "Buscar por actor, acción o detalles..."}
              className="w-full rounded-xl border border-border bg-background pl-10 pr-4 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary h-10 transition-all text-foreground"
            />
          </div>
          <button
            type="submit"
            className="rounded-xl bg-primary hover:bg-primary/95 text-primary-foreground font-semibold px-4 h-10 text-xs transition duration-200"
          >
            {locale === "en" ? "Filter" : "Filtrar"}
          </button>
          {params.search && (
            <Link
              href="/admin/audit"
              className="rounded-xl border border-border bg-background hover:bg-secondary px-3 h-10 text-xs font-semibold flex items-center justify-center text-foreground transition-all"
            >
              {locale === "en" ? "Clear" : "Limpiar"}
            </Link>
          )}
        </form>
      </div>

      {/* Logs Table */}
      {logs.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-card p-12 text-center">
          <Shield className="mx-auto h-10 w-10 text-muted-foreground/50" />
          <p className="mt-4 font-medium text-foreground">{locale === "en" ? "No logs found" : "No se encontraron registros"}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {locale === "en" ? "Try adjusting your filters or complete system actions." : "Prueba ajustando los filtros de búsqueda."}
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px] table-fixed text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50 text-left font-medium text-muted-foreground">
                  <th className="px-4 py-3 w-[180px]">{locale === "en" ? "Date" : "Fecha"}</th>
                  <th className="px-4 py-3 w-[180px]">{locale === "en" ? "Actor" : "Autor"}</th>
                  <th className="px-4 py-3 w-[180px]">{locale === "en" ? "Action" : "Acción"}</th>
                  <th className="px-4 py-3 w-[460px]">{locale === "en" ? "Details" : "Detalles"}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {logs.map((log) => {
                  const actionText = actionLabels[log.action]?.[locale] ?? log.action;
                  
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
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${actionBadgeStyles[log.action] ?? "bg-slate-100 text-slate-800 border"}`}>
                          {actionText}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-xs text-foreground font-medium whitespace-pre-wrap">
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
            }}
          />
        </div>
      )}
    </div>
  );
}
