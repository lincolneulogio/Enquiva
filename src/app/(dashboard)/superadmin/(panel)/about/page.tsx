import { getRequestSession } from "@/lib/request-context";
import { redirect } from "next/navigation";
import { getStaffDashboardHome } from "@/lib/navigation/dashboard-paths";
import { getAdminPageSectionsAction } from "@/actions/admin/pages";
import { AboutSectionsManager } from "@/components/dashboard/admin/about/AboutSectionsManager";
import { Landmark } from "lucide-react";
import { getI18n } from "@/lib/i18n/server";

export default async function SuperAdminAboutPage() {
  const session = await getRequestSession();
  if (!session?.user) redirect("/login");
  if (session.user.role !== "super_admin") {
    redirect(getStaffDashboardHome(session.user.role));
  }

  const { locale } = await getI18n();
  const sections = await getAdminPageSectionsAction("about");

  const title = locale === "en" ? "About Us" : "Sobre Nosotros";
  const intro = locale === "en"
    ? "Manage the bilingual content sections displayed on the public /about page. Reorder, edit, activate or deactivate sections to control the public experience."
    : "Administra las secciones de contenido bilingüe que se muestran en la página pública /about. Reordena, edita, activa o desactiva secciones para controlar la experiencia pública.";

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-foreground flex items-center gap-3">
          <div className="p-2 rounded-2xl bg-primary/10 text-primary">
            <Landmark className="h-7 w-7" />
          </div>
          {title}
        </h1>
        <p className="text-sm text-muted-foreground">
          {intro}
        </p>
      </div>

      <AboutSectionsManager
        initialSections={sections}
        allowedKinds={["section", "stat", "team"]}
      />
    </div>
  );
}
