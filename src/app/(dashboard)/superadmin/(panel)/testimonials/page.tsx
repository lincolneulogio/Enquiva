import { getRequestSession } from "@/lib/request-context";
import { redirect } from "next/navigation";
import { getStaffDashboardHome } from "@/lib/navigation/dashboard-paths";
import { getAdminTestimonialsAction } from "@/actions/admin/testimonials";
import { TestimonialsManager } from "@/components/dashboard/admin/TestimonialsManager";
import { MessageSquareQuote } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Gestión de Testimonios | SuperAdmin Enquiva",
  description: "Administra los testimonios y opiniones destacadas en la página principal.",
};

export default async function SuperAdminTestimonialsPage() {
  const session = await getRequestSession();
  if (!session?.user) redirect("/login");
  if (session.user.role !== "super_admin") {
    redirect(getStaffDashboardHome(session.user.role));
  }

  const testimonials = await getAdminTestimonialsAction();

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-foreground flex items-center gap-3">
          <div className="p-2 rounded-2xl bg-primary/10 text-primary">
            <MessageSquareQuote className="h-7 w-7" />
          </div>
          Historias de Éxito & Testimonios
        </h1>
        <p className="text-sm text-muted-foreground">
          Controla los testimonios de empresas, organizadores y asistentes que aparecen en la portada de Enquiva.
        </p>
      </div>

      <TestimonialsManager initialTestimonials={testimonials} />
    </div>
  );
}
