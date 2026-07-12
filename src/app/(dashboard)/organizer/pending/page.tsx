import { OrganizerApprovalPendingGate } from "@/components/dashboard/organizer/OrganizerApprovalPendingGate";
import { OrganizationService } from "@/lib/organizations/organization.service";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

/**
 * Ruta única permitida mientras la membresía de organizador está pendiente.
 * El layout redirige aquí y no renderiza otras páginas del panel.
 */
export default async function OrganizerPendingPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) redirect("/login");

  const pending = await OrganizationService.getPendingOrganizerMembershipForUser(
    session.user.id,
  );
  if (!pending) redirect("/organizer");

  return <OrganizerApprovalPendingGate entityName={pending.organization.name} />;
}
