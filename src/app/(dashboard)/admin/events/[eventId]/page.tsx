import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { events } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { EventForm } from "@/components/events/EventForm";
import { getCategories } from "@/actions/events";

interface AdminEditEventPageProps {
    params: Promise<{ eventId: string }>;
}

export default async function AdminEditEventPage({ params }: AdminEditEventPageProps) {
    const { eventId } = await params;

    const [event] = await db
        .select()
        .from(events)
        .where(eq(events.id, eventId))
        .limit(1);

    if (!event) notFound();

    const categories = await getCategories();

    return (
        <div className="space-y-6">
            <div>
                <Link
                    href="/admin/events"
                    className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                    <ArrowLeft className="h-3.5 w-3.5" />
                    Back to Events
                </Link>
                <h1 className="mt-3 font-display text-3xl font-semibold text-foreground">
                    Edit Event
                </h1>
                <p className="mt-1 text-muted-foreground">Update details for {event.title}</p>
            </div>

            <EventForm event={event} redirectPath="/admin/events" categories={categories} canFeature />
        </div>
    );
}
