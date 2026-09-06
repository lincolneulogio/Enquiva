import { getAllCategories } from "@/actions/admin";
import { getAllEventTypes } from "@/actions/admin/event-types";
import { EventTypesManager } from "@/components/dashboard/admin/event-types";
import { getI18n } from "@/lib/i18n/server";
import { getRequestSession } from "@/lib/request-context";
import { getStaffDashboardHome } from "@/lib/navigation/dashboard-paths";
import { redirect } from "next/navigation";

export default async function AdminEventTypesPage() {
  const session = await getRequestSession();
  if (!session?.user) redirect("/login");
  if (session.user.role !== "super_admin") {
    redirect(getStaffDashboardHome(session.user.role));
  }

  const { locale } = await getI18n();
  const [categories, eventTypesList] = await Promise.all([
    getAllCategories(),
    getAllEventTypes(),
  ]);

  const title = locale === "en" ? "Event Types" : "Tipos de Evento";
  const intro =
    locale === "en"
      ? "Manage sub-types and classifications available under each event category."
      : "Administra los sub-tipos y clasificaciones disponibles para cada categoría de evento.";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-semibold text-foreground">{title}</h1>
        <p className="mt-1 text-muted-foreground">{intro}</p>
      </div>

      <EventTypesManager
        initialEventTypes={eventTypesList}
        categories={categories.map((c) => ({ slug: c.slug, label: c.label }))}
      />
    </div>
  );
}
