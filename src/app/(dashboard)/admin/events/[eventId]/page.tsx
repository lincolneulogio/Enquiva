import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { notFound, redirect } from "next/navigation";
import { db } from "@/lib/db";
import { events } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { EventForm } from "@/components/events/EventForm";
import { getCategories } from "@/actions/events";
import { getEventTypes } from "@/actions/admin/event-types";
import { getI18n } from "@/lib/i18n/server";
import { getRequestSession } from "@/lib/request-context";
import { assertEventInAdminScope } from "@/lib/organizations/admin-scope";

interface AdminEditEventPageProps {
    params: Promise<{ eventId: string }>;
}

import { getStaffBaseFromRequest } from "@/lib/navigation/get-staff-base.server";
import { staffDashboardPath } from "@/lib/navigation/dashboard-paths";

export default async function AdminEditEventPage({ params }: AdminEditEventPageProps) {
    const { t } = await getI18n();
    const staffBase = await getStaffBaseFromRequest();
    const eventsPath = staffDashboardPath(staffBase, "events");
    const { eventId } = await params;

    const session = await getRequestSession();
    if (!session?.user) redirect("/login");

    try {
        await assertEventInAdminScope(eventId, session.user.id, session.user.role);
    } catch {
        notFound();
    }

    const [event] = await db
        .select()
        .from(events)
        .where(eq(events.id, eventId))
        .limit(1);

    if (!event) notFound();

    const categories = await getCategories();
    const eventTypesList = await getEventTypes();

    return (
        <div className="space-y-6">
            <div>
                <Link
                    href={eventsPath}
                    className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                    <ArrowLeft className="h-3.5 w-3.5" />
                    {t("dashboard.admin.backToEvents")}
                </Link>
                <h1 className="mt-3 font-display text-3xl font-semibold text-foreground">
                    {t("dashboard.admin.editEvent")}
                </h1>
                <p className="mt-1 text-muted-foreground">{t("dashboard.admin.updateEventDetails", { title: event.title })}</p>
            </div>

            <EventForm event={event} redirectPath={eventsPath} categories={categories} initialEventTypes={eventTypesList} canFeature />
        </div>
    );
}
