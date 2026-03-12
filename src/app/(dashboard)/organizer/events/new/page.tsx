import { EventForm } from "@/components/events/EventForm";
import { getCategories } from "@/actions/events";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default async function NewEventPage() {
  const categories = await getCategories();
  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/organizer"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Dashboard
        </Link>
        <h1 className="mt-3 font-display text-3xl font-semibold text-foreground">
          Create New Event
        </h1>
        <p className="mt-1 text-muted-foreground">
          Fill in the details below to publish your event
        </p>
      </div>
      <EventForm categories={categories} />
    </div>
  );
}
