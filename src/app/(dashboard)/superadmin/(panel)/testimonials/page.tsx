import { getRequestSession } from "@/lib/request-context";
import { redirect } from "next/navigation";
import { getStaffDashboardHome } from "@/lib/navigation/dashboard-paths";
import { getAdminTestimonialsAction } from "@/actions/admin/testimonials";
import { TestimonialsManager } from "@/components/dashboard/admin/TestimonialsManager";
import { MessageSquareQuote } from "lucide-react";
import { getI18n } from "@/lib/i18n/server";

export default async function SuperAdminTestimonialsPage() {
  const session = await getRequestSession();
  if (!session?.user) redirect("/login");
  if (session.user.role !== "super_admin") {
    redirect(getStaffDashboardHome(session.user.role));
  }

  const { locale } = await getI18n();
  const testimonials = await getAdminTestimonialsAction();

  const title = locale === "en" ? "Success Stories & Testimonials" : "Historias de Éxito & Testimonios";
  const intro = locale === "en"
    ? "Manage client, organizer, and attendee testimonials featured on the Enquiva homepage."
    : "Controla los testimonios de empresas, organizadores y asistentes que aparecen en la portada de Enquiva.";

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-foreground flex items-center gap-3">
          <div className="p-2 rounded-2xl bg-primary/10 text-primary">
            <MessageSquareQuote className="h-7 w-7" />
          </div>
          {title}
        </h1>
        <p className="text-sm text-muted-foreground">
          {intro}
        </p>
      </div>

      <TestimonialsManager initialTestimonials={testimonials} />
    </div>
  );
}
