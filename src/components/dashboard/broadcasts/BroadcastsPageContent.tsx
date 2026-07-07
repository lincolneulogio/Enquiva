import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { events, broadcastLogs } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { getBroadcastEvents } from "@/actions/events";
import { BroadcastForm } from "@/app/(dashboard)/organizer/broadcasts/_components/BroadcastForm";
import { Megaphone, History, Mail } from "lucide-react";
import { getI18n } from "@/lib/i18n/server";
import { getMyPlanSummary } from "@/actions/billing";
import { PlanUsageBanner } from "@/components/dashboard/organizer/PlanUsageBanner";
import Link from "next/link";
import { normalizeRole } from "@/lib/auth/rbac";
import { SubscriptionService } from "@/lib/billing/subscription.service";

type BroadcastsPageProps = {
  billingPath?: string;
};

export async function BroadcastsPageContent({ billingPath = "/organizer/billing" }: BroadcastsPageProps) {
  const { t, locale } = await getI18n();
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user) {
    redirect("/login");
  }

  const role = normalizeRole(session.user.role);
  if (role !== "organizer" && role !== "admin" && role !== "super_admin") {
    redirect("/member");
  }

  const eventsForSelect = await getBroadcastEvents();

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
  const isStaff = SubscriptionService.isPlatformStaff(session.user.role);
  const dateLocale = locale === "en" ? "en-US" : "es-PE";

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl font-semibold text-foreground sm:text-3xl flex items-center gap-3">
          <Megaphone className="h-7 w-7 text-primary shrink-0" />
          {t("dashboard.organizer.broadcastsTitle")}
        </h1>
        <p className="mt-1 text-muted-foreground">{t("dashboard.organizer.broadcastsIntro")}</p>
        <p className="mt-2 text-sm text-muted-foreground">{t("dashboard.organizer.broadcastsMultiChannelNote")}</p>
      </div>

      {!isStaff ? <PlanUsageBanner summary={planSummary} /> : null}

      {!isStaff && !planSummary.canSendBroadcast && !planSummary.isUnlimited && (
        <div className="rounded-2xl border border-amber-200/60 bg-amber-50/50 p-4 text-sm text-amber-900 dark:border-amber-900/30 dark:bg-amber-950/20 dark:text-amber-200">
          {t("dashboard.organizer.broadcastsPlanBlocked", { plan: planSummary.plan.name })}{" "}
          {planSummary.canManageBilling ? (
            <Link href={billingPath} className="font-semibold underline">
              {t("dashboard.organizer.broadcastsPlanBlockedLink")}
            </Link>
          ) : (
            <span className="font-semibold">{t("dashboard.organizer.planLimitContactAdmin")}</span>
          )}
          .
        </div>
      )}

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <h2 className="font-display text-lg font-semibold text-foreground mb-4 flex items-center gap-2 border-b border-border pb-3">
              <Mail className="h-5 w-5 text-primary" />
              {t("dashboard.organizer.broadcastsComposeTitle")}
            </h2>
            <BroadcastForm
              events={eventsForSelect}
              disabled={!isStaff && !planSummary.canSendBroadcast && !planSummary.isUnlimited}
            />
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm h-full flex flex-col">
            <h2 className="font-display text-lg font-semibold text-foreground mb-4 flex items-center gap-2 border-b border-border pb-3 shrink-0">
              <History className="h-5 w-5 text-accent" />
              {t("dashboard.organizer.broadcastsHistoryTitle")}
            </h2>

            {logsHistory.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
                <History className="h-10 w-10 text-muted-foreground/30 mb-2" />
                <p className="text-sm font-medium">{t("dashboard.organizer.broadcastsNoHistory")}</p>
                <p className="text-xs mt-1">{t("dashboard.organizer.broadcastsNoHistoryHelp")}</p>
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
                        {new Date(log.createdAt).toLocaleDateString(dateLocale, {
                          day: "2-digit",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                    <p className="font-semibold text-foreground text-sm line-clamp-1">{log.subject}</p>
                    <div className="flex items-center justify-between border-t border-border/40 pt-2 text-[11px]">
                      <span className="text-muted-foreground">{t("dashboard.organizer.broadcastsRecipients")}</span>
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
