import { getRequestSession } from "@/lib/request-context";
import { redirect } from "next/navigation";
import { getStaffDashboardHome } from "@/lib/navigation/dashboard-paths";
import { getAdminPageSectionsAction } from "@/actions/admin/pages";
import { ContactChannelsManager } from "@/components/dashboard/admin/contact/ContactChannelsManager";
import { Mail } from "lucide-react";
import { getI18n } from "@/lib/i18n/server";
import { getSystemSettings } from "@/lib/settings";

export default async function SuperAdminContactPage() {
  const session = await getRequestSession();
  if (!session?.user) redirect("/login");
  if (session.user.role !== "super_admin") {
    redirect(getStaffDashboardHome(session.user.role));
  }

  const { locale } = await getI18n();
  const sections = await getAdminPageSectionsAction("contact");
  const settings = await getSystemSettings().catch(() => null);
  const isEn = locale === "en";

  const inherited = {
    email: settings?.publicContactEmail?.trim() || "",
    support: settings?.supportEmail?.trim() || "",
  };

  const title = isEn ? "Contact" : "Contacto";
  const intro = isEn
    ? "Manage the direct contact channels displayed on the public /contact page (emails, headquarters address). Saving the general inbox or support email also updates Global identity in Settings. Reorder, edit, activate or deactivate channels to control the public experience."
    : "Administra los canales de contacto directo que se muestran en la página pública /contact (correos, sede central). Al guardar el correo general o el de soporte, también se actualiza Identidad global en Configuración. Reordena, edita, activa o desactiva canales para controlar la experiencia pública.";

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

      <ContactChannelsManager initialSections={sections} pageKey="contact" isEn={isEn} inherited={inherited} />
    </div>
  );
}