import Link from "next/link";
import { ArrowLeft, Bus, ExternalLink } from "lucide-react";
import { notFound, redirect } from "next/navigation";
import { db } from "@/lib/db";
import { events } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { EventForm } from "@/components/events/EventForm";
import { getCategories } from "@/actions/events";
import { getMyPlanSummary } from "@/actions/billing";
import { getEventTypes } from "@/actions/admin/event-types";
import { getRequestSession } from "@/lib/request-context";
import { getI18n } from "@/lib/i18n/server";
import { cn } from "@/lib/utils";

interface OrganizerEditEventPageProps {
    params: Promise<{ eventId: string }>;
}

export default async function OrganizerEditEventPage({ params }: OrganizerEditEventPageProps) {
    const { t } = await getI18n();
    const session = await getRequestSession();
    if (!session?.user) redirect("/login");

    const { eventId } = await params;

    const [event] = await db
        .select()
        .from(events)
        .where(eq(events.id, eventId))
        .limit(1);

    if (!event) notFound();

    if (event.organizerId !== session.user.id && session.user.role !== "super_admin") {
        redirect("/organizer/events");
    }

    const [categories, planSummary, eventTypesList] = await Promise.all([
        getCategories(),
        getMyPlanSummary(),
        getEventTypes(),
    ]);

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <Link
                        href="/organizer/events"
                        className="group inline-flex items-center gap-1.5 rounded-full border border-border/80 bg-card/80 px-3 py-1 text-xs font-semibold text-muted-foreground shadow-2xs backdrop-blur-xs transition-all hover:border-border hover:bg-card hover:text-foreground"
                    >
                        <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5" />
                        <span>{t("dashboard.organizer.backToMyEvents")}</span>
                    </Link>
                    <div className="mt-2.5 flex flex-wrap items-center gap-3">
                        <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                            {t("dashboard.organizer.editEvent")}
                        </h1>
                        <span
                            className={cn(
                                "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold border shadow-2xs",
                                event.status === "published"
                                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/25"
                                    : event.status === "cancelled"
                                      ? "bg-destructive/10 text-destructive border-destructive/25"
                                      : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/25",
                            )}
                        >
                            <span
                                className={cn(
                                    "h-1.5 w-1.5 rounded-full",
                                    event.status === "published"
                                        ? "bg-emerald-500 animate-pulse"
                                        : event.status === "cancelled"
                                          ? "bg-destructive"
                                          : "bg-amber-500",
                                )}
                            />
                            {event.status === "published"
                                ? "Publicado"
                                : event.status === "cancelled"
                                  ? "Cancelado"
                                  : "Borrador"}
                        </span>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                        {t("dashboard.organizer.updateEventDetails", { title: event.title })}
                    </p>
                </div>

                {event.status === "published" && (
                    <Link
                        href={`/events/${event.slug || event.id}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 self-start sm:self-auto rounded-xl border border-border/80 bg-background/80 px-3.5 py-2 text-xs font-semibold text-foreground shadow-2xs hover:border-primary/40 hover:bg-card hover:text-primary transition-all active:scale-95"
                    >
                        <span>Ver página pública</span>
                        <ExternalLink className="h-3.5 w-3.5 opacity-70" />
                    </Link>
                )}
            </div>

            <EventForm event={event} redirectPath="/organizer/events" categories={categories} canFeature={session.user.role === "super_admin"} planSummary={planSummary} initialEventTypes={eventTypesList} />

            {event.hasTransport && (
                <div className="rounded-2xl border border-blue-200/80 bg-blue-50/60 dark:border-blue-800/60 dark:bg-blue-950/20 px-5 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-2xs">
                    <div className="flex items-center gap-2.5 text-blue-800 dark:text-blue-300">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-300">
                            <Bus className="h-4 w-4" />
                        </div>
                        <div>
                            <p className="text-sm font-semibold">{t("dashboard.organizer.eventOffersTransport")}</p>
                            <p className="text-xs text-blue-700/80 dark:text-blue-400">Rutas y buses habilitados para los asistentes</p>
                        </div>
                    </div>
                    <Link
                        href={`/organizer/events/${event.id}/transport`}
                        className="shrink-0 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700 transition-all shadow-sm hover:shadow active:scale-95"
                    >
                        {t("dashboard.organizer.manageRoutes")}
                    </Link>
                </div>
            )}
        </div>
    );
}
