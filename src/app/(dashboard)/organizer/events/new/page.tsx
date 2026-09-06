import { EventForm } from "@/components/events/EventForm";
import { getCategories } from "@/actions/events";
import { getMyPlanSummary } from "@/actions/billing";
import { getEventTypes } from "@/actions/admin/event-types";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getI18n } from "@/lib/i18n/server";

export default async function NewEventPage() {
  const { t, locale } = await getI18n();
  const [categories, planSummary, eventTypesList] = await Promise.all([
    getCategories(),
    getMyPlanSummary(),
    getEventTypes(),
  ]);

  const titleKey = t("dashboard.organizer.createEventTitle");
  const introKey = t("dashboard.organizer.createEventIntro");

  const createEventTitle =
    titleKey === "dashboard.organizer.createEventTitle"
      ? locale === "es"
        ? "Crear nuevo evento"
        : "Create New Event"
      : titleKey;

  const createEventIntro =
    introKey === "dashboard.organizer.createEventIntro"
      ? locale === "es"
        ? "Completa los siguientes datos para publicar tu evento."
        : "Fill in the details below to publish your event."
      : introKey;

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/organizer"
          className="group inline-flex items-center gap-1.5 rounded-full border border-border/80 bg-card/80 px-3 py-1 text-xs font-semibold text-muted-foreground shadow-2xs backdrop-blur-xs transition-all hover:border-border hover:bg-card hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5" />
          <span>{t("dashboard.organizer.backToDashboard")}</span>
        </Link>
        <h1 className="mt-2.5 font-display text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
          {createEventTitle}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {createEventIntro}
        </p>
      </div>
      <EventForm categories={categories} planSummary={planSummary} initialEventTypes={eventTypesList} />
    </div>
  );
}
