import { getRequestSession } from "@/lib/request-context";
import { redirect } from "next/navigation";
import { getStaffDashboardHome } from "@/lib/navigation/dashboard-paths";
import { getAdminNewsletterSubscribersAction } from "@/actions/admin/newsletter";
import { NewsletterManager } from "@/components/dashboard/admin/NewsletterManager";
import { Mail } from "lucide-react";
import { getI18n } from "@/lib/i18n/server";

export default async function SuperAdminNewsletterPage() {
  const session = await getRequestSession();
  if (!session?.user) redirect("/login");
  if (session.user.role !== "super_admin") {
    redirect(getStaffDashboardHome(session.user.role));
  }

  const { locale } = await getI18n();
  const { subscribers, stats } = await getAdminNewsletterSubscribersAction({
    pageSize: 100,
  });

  const title = locale === "en" ? "Newsletter Subscribers" : "Suscriptores del Boletín";
  const intro = locale === "en"
    ? "View, export, and broadcast messages to subscribers registered through the platform footer."
    : "Visualiza, exporta y envía comunicados a los correos registrados a través del pie de página de la plataforma.";

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-foreground flex items-center gap-3">
          <div className="p-2 rounded-2xl bg-primary/10 text-primary">
            <Mail className="h-7 w-7" />
          </div>
          {title}
        </h1>
        <p className="text-sm text-muted-foreground">
          {intro}
        </p>
      </div>

      <NewsletterManager
        initialSubscribers={subscribers}
        initialStats={stats}
      />
    </div>
  );
}
