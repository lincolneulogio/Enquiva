import { getRequestSession } from "@/lib/request-context";
import { redirect } from "next/navigation";
import { getStaffDashboardHome } from "@/lib/navigation/dashboard-paths";
import { getAdminPageSectionsAction } from "@/actions/admin/pages";
import { AboutSectionsManager } from "@/components/dashboard/admin/about/AboutSectionsManager";
import { Lock } from "lucide-react";
import { getI18n } from "@/lib/i18n/server";

export default async function SuperAdminPrivacyPage() {
  const session = await getRequestSession();
  if (!session?.user) redirect("/login");
  if (session.user.role !== "super_admin") {
    redirect(getStaffDashboardHome(session.user.role));
  }

  const { locale } = await getI18n();
  const sections = await getAdminPageSectionsAction("privacy");

  const title = locale === "en" ? "Privacy Policy" : "Política de Privacidad";
  const intro = locale === "en"
    ? "Manage the bilingual clauses displayed as tabs on the public /privacy page. Reorder, edit, activate or deactivate clauses to control the public experience. Leave it empty to show the default legal text."
    : "Administra las cláusulas bilingües que se muestran como pestañas en la página pública /privacy. Reordena, edita, activa o desactiva cláusulas para controlar la experiencia pública. Déjalo vacío para mostrar el texto legal por defecto.";

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-foreground flex items-center gap-3">
          <div className="p-2 rounded-2xl bg-primary/10 text-primary">
            <Lock className="h-7 w-7" />
          </div>
          {title}
        </h1>
        <p className="text-sm text-muted-foreground">
          {intro}
        </p>
      </div>

      <AboutSectionsManager
        initialSections={sections}
        pageKey="privacy"
        contextLabel="Política de Privacidad"
        createLabel="Nueva Cláusula"
        emptyCreateLabel="Crear Primera Cláusula"
        allowedKinds={["section"]}
        sectionSingular="Cláusula"
        showSubtitleFields={false}
        showContactClauseToggle
        titlePlaceholderEs="Ej. Información que recopilamos"
        bodyPlaceholderEs="Texto legal de la cláusula en español... Separa párrafos con una línea en blanco."
      />
    </div>
  );
}
