import { getRequestSession } from "@/lib/request-context";
import { redirect } from "next/navigation";
import { getStaffDashboardHome } from "@/lib/navigation/dashboard-paths";
import { getAdminNewsletterSubscribersAction } from "@/actions/admin/newsletter";
import { NewsletterManager } from "@/components/dashboard/admin/NewsletterManager";
import { Mail } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Suscriptores del Boletín | SuperAdmin Enquiva",
  description: "Gestiona los correos captados desde el formulario de novedades de la portada.",
};

export default async function SuperAdminNewsletterPage() {
  const session = await getRequestSession();
  if (!session?.user) redirect("/login");
  if (session.user.role !== "super_admin") {
    redirect(getStaffDashboardHome(session.user.role));
  }

  const { subscribers, stats } = await getAdminNewsletterSubscribersAction({
    pageSize: 100,
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-foreground flex items-center gap-3">
          <div className="p-2 rounded-2xl bg-primary/10 text-primary">
            <Mail className="h-7 w-7" />
          </div>
          Suscriptores del Boletín
        </h1>
        <p className="text-sm text-muted-foreground">
          Visualiza, exporta y envía comunicados a los correos registrados a través del pie de página de la plataforma.
        </p>
      </div>

      <NewsletterManager
        initialSubscribers={subscribers}
        initialStats={stats}
      />
    </div>
  );
}
