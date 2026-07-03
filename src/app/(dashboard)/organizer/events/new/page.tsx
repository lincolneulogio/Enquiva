import { EventForm } from "@/components/events/EventForm";
import { getCategories } from "@/actions/events";
import { getMyPlanSummary } from "@/actions/billing";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getI18n } from "@/lib/i18n/server";

export default async function NewEventPage() {
  const { t, locale } = await getI18n();
  const categories = await getCategories();
  const planSummary = await getMyPlanSummary();

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
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          {t("dashboard.organizer.backToDashboard")}
        </Link>
        <h1 className="mt-3 font-display text-3xl font-semibold text-foreground">
          {createEventTitle}
        </h1>
        <p className="mt-1 text-muted-foreground">
          {createEventIntro}
        </p>
      </div>
      <EventForm categories={categories} planSummary={planSummary} />
    </div>
  );
}
