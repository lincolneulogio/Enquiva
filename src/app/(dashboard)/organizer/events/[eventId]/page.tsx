import Link from "next/link";
import { ArrowLeft, Bus } from "lucide-react";
import { notFound, redirect } from "next/navigation";
import { db } from "@/lib/db";
import { events } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { EventForm } from "@/components/events/EventForm";
import { getCategories } from "@/actions/events";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { getI18n } from "@/lib/i18n/server";

interface OrganizerEditEventPageProps {
    params: Promise<{ eventId: string }>;
}

export default async function OrganizerEditEventPage({ params }: OrganizerEditEventPageProps) {
    const { t } = await getI18n();
    const session = await auth.api.getSession({ headers: await headers() });
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

    const categories = await getCategories();

    return (
        <div className="space-y-6">
            <div>
                <Link
                    href="/organizer/events"
                    className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                    <ArrowLeft className="h-3.5 w-3.5" />
                    {t("dashboard.organizer.backToMyEvents")}
                </Link>
                <h1 className="mt-3 font-display text-3xl font-semibold text-foreground">{t("dashboard.organizer.editEvent")}</h1>
                <p className="mt-1 text-muted-foreground">{t("dashboard.organizer.updateEventDetails", { title: event.title })}</p>
            </div>

            <EventForm event={event} redirectPath="/organizer/events" categories={categories} canFeature={session.user.role === "super_admin"} />

            {event.hasTransport && (
                <div className="rounded-2xl border border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/30 px-5 py-4 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2 text-blue-800 dark:text-blue-300">
                        <Bus className="h-4 w-4" />
                        <p className="text-sm font-medium">{t("dashboard.organizer.eventOffersTransport")}</p>
                    </div>
                    <Link
                        href={`/organizer/events/${event.id}/transport`}
                        className="shrink-0 rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
                    >
                        {t("dashboard.organizer.manageRoutes")}
                    </Link>
                </div>
            )}
        </div>
    );
}
