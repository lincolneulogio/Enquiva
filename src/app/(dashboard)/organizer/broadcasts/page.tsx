import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { events, broadcastLogs } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { getOrganizerEvents } from "@/actions/events";
import { BroadcastForm } from "./_components/BroadcastForm";
import { Megaphone, History, Calendar, Mail } from "lucide-react";
import { getI18n } from "@/lib/i18n/server";
import { getMyPlanSummary } from "@/actions/billing";
import { PlanUsageBanner } from "@/components/dashboard/organizer/PlanUsageBanner";

export const metadata = {
  title: "Centro de Comunicados Masivos - EncuentroDeFe",
  description: "Envía correos electrónicos y alertas masivas a los asistentes de tus eventos.",
};

export default async function OrganizerBroadcastPage() {
  const { t } = await getI18n();
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user) {
    redirect("/login");
  }

  // Double check authorization
  if (
    session.user.role !== "organizer" &&
    session.user.role !== "admin" &&
    session.user.role !== "super_admin"
  ) {
    redirect("/member");
  }

  // Load events owned by organizer (or all if admin)
  const organizerEvents = await getOrganizerEvents();
  const eventsForSelect = organizerEvents.map(({ event }) => ({
    id: event.id,
    title: event.title,
  }));

  // Fetch previous broadcast logs sent by this user
  const logsHistory = await db
    .select({
      id: broadcastLogs.id,
      subject: broadcastLogs.subject,
      recipientCount: broadcastLogs.recipientCount,
      createdAt: broadcastLogs.createdAt,
      eventTitle: events.title,
    })
    .from(broadcastLogs)
    .innerJoin(events, eq(broadcastLogs.eventId, events.id))
    .where(eq(broadcastLogs.senderId, session.user.id))
    .orderBy(desc(broadcastLogs.createdAt))
    .limit(10);

  const planSummary = await getMyPlanSummary();

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="font-display text-2xl font-semibold text-foreground sm:text-3xl flex items-center gap-3">
          <Megaphone className="h-7 w-7 text-primary shrink-0" />
          Centro de Comunicados
        </h1>
        <p className="mt-1 text-muted-foreground">
          Envía anuncios masivos, actualizaciones de última hora o indicaciones por correo a los asistentes de tus eventos.
        </p>
      </div>

      <PlanUsageBanner summary={planSummary} />

      {!planSummary.canSendBroadcast && !planSummary.isUnlimited && (
        <div className="rounded-2xl border border-amber-200/60 bg-amber-50/50 p-4 text-sm text-amber-900 dark:border-amber-900/30 dark:bg-amber-950/20 dark:text-amber-200">
          Tu plan {planSummary.plan.name} no incluye comunicados masivos. Mejora a Pro en{" "}
          <a href="/organizer/billing" className="font-semibold underline">
            Mi plan
          </a>
          .
        </div>
      )}

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Form Column */}
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <h2 className="font-display text-lg font-semibold text-foreground mb-4 flex items-center gap-2 border-b border-border pb-3">
              <Mail className="h-5 w-5 text-primary" />
              Redactar Comunicado Masivo
            </h2>
            <BroadcastForm events={eventsForSelect} disabled={!planSummary.canSendBroadcast && !planSummary.isUnlimited} />
          </div>
        </div>

        {/* History Column */}
        <div className="space-y-6">
          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm h-full flex flex-col">
            <h2 className="font-display text-lg font-semibold text-foreground mb-4 flex items-center gap-2 border-b border-border pb-3 shrink-0">
              <History className="h-5 w-5 text-accent" />
              Historial Reciente
            </h2>
            
            {logsHistory.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
                <History className="h-10 w-10 text-muted-foreground/30 mb-2" />
                <p className="text-sm font-medium">No hay envíos registrados</p>
                <p className="text-xs mt-1">Los comunicados que envíes aparecerán aquí.</p>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto space-y-4 max-h-[500px] pr-1">
                {logsHistory.map((log) => (
                  <div
                    key={log.id}
                    className="p-4 rounded-xl border border-border bg-secondary/20 hover:bg-secondary/40 transition-all text-xs space-y-2"
                  >
                    <div className="flex items-center justify-between text-muted-foreground">
                      <span className="font-semibold text-primary truncate max-w-[150px]" title={log.eventTitle}>
                        {log.eventTitle}
                      </span>
                      <span>
                        {new Date(log.createdAt).toLocaleDateString("es-PE", {
                          day: "2-digit",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                    <p className="font-semibold text-foreground text-sm line-clamp-1">
                      {log.subject}
                    </p>
                    <div className="flex items-center justify-between border-t border-border/40 pt-2 text-[11px]">
                      <span className="text-muted-foreground">Destinatarios:</span>
                      <span className="font-medium text-foreground">{log.recipientCount}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
