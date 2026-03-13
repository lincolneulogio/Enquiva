import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { EventForm } from "@/components/events/EventForm";
import { getCategories } from "@/actions/events";
import { getI18n } from "@/lib/i18n/server";

export default async function AdminNewEventPage() {
    const { t, locale } = await getI18n();
    const categories = await getCategories();

    const titleKey = t("dashboard.admin.createEventTitle");
    const introKey = t("dashboard.admin.createEventIntro");

    const createEventTitle =
        titleKey === "dashboard.admin.createEventTitle"
            ? locale === "es"
                ? "Crear nuevo evento"
                : "Create New Event"
            : titleKey;

    const createEventIntro =
        introKey === "dashboard.admin.createEventIntro"
            ? locale === "es"
                ? "Como super admin, puedes publicar y gestionar cualquier evento."
                : "As super admin, you can publish and manage any event."
            : introKey;

    return (
        <div className="space-y-6">
            <div>
                <Link
                    href="/admin/events"
                    className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                    <ArrowLeft className="h-3.5 w-3.5" />
                    {t("dashboard.admin.backToEvents")}
                </Link>
                <h1 className="mt-3 font-display text-3xl font-semibold text-foreground">
                    {createEventTitle}
                </h1>
                <p className="mt-1 text-muted-foreground">
                    {createEventIntro}
                </p>
            </div>

            <EventForm redirectPath="/admin/events" categories={categories} canFeature />
        </div>
    );
}
