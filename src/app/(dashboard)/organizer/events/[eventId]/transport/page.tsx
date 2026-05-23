import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Bus } from "lucide-react";
import { db } from "@/lib/db";
import { events } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { getRoutesByEvent } from "@/actions/transport";
import { TransportRoutesManager } from "@/components/dashboard";
import { getI18n } from "@/lib/i18n/server";

interface Props {
    params: Promise<{ eventId: string }>;
}

export default async function OrganizerTransportPage({ params }: Props) {
    const { t } = await getI18n();
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) redirect("/login");

    const { eventId } = await params;

    const [event] = await db
        .select({ id: events.id, title: events.title, organizerId: events.organizerId, hasTransport: events.hasTransport })
        .from(events)
        .where(eq(events.id, eventId))
        .limit(1);

    if (!event) notFound();

    if (
        event.organizerId !== session.user.id &&
        !["admin", "super_admin"].includes(session.user.role ?? "")
    ) {
        redirect("/organizer/events");
    }

    const routes = await getRoutesByEvent(eventId);

    return (
        <div className="space-y-6">
            <div>
                <Link
                    href={`/organizer/events/${eventId}`}
                    className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                    <ArrowLeft className="h-3.5 w-3.5" />
                    {t("dashboard.organizer.backToEvent")}
                </Link>
                <div className="mt-3 flex items-center gap-3">
                    <Bus className="h-7 w-7 text-blue-500" />
                    <div>
                        <h1 className="font-display text-3xl font-semibold text-foreground">
                            {t("dashboard.organizer.transportTitle")}
                        </h1>
                        <p className="mt-0.5 text-muted-foreground">{event.title}</p>
                    </div>
                </div>
            </div>

            {!event.hasTransport && (
                <div className="rounded-2xl border border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30 px-5 py-4">
                    <p className="text-sm text-amber-800 dark:text-amber-300">
                        <strong>Nota:</strong> {t("dashboard.organizer.transportDisabledNote")}{" "}
                        {t("dashboard.organizer.enableTransportHint")}
                    </p>
                </div>
            )}

            <TransportRoutesManager
                eventId={eventId}
                initialRoutes={routes.map((r) => ({
                    ...r,
                    departureTime: new Date(r.departureTime),
                    returnTime: r.returnTime ? new Date(r.returnTime) : null,
                    bookedSeats: Number(r.bookedSeats),
                }))}
            />
        </div>
    );
}
