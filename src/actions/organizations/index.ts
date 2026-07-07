"use server";

import { revalidatePath } from "next/cache";
import { OrganizationService } from "@/lib/organizations/organization.service";
import { normalizeRole } from "@/lib/auth/rbac";
import { requireAuth } from "@/lib/auth/guards";

export async function getMyOrganization() {
  const user = await requireAuth();
  const org = await OrganizationService.getOrganizationForUser(user.id);
  if (!org) return null;

  const [team, pendingRequests] = await Promise.all([
    OrganizationService.listTeamMembers(org.id),
    OrganizationService.listPendingOrganizerRequests(org.id),
  ]);
  return { organization: org, team, pendingRequests, isOwner: org.ownerId === user.id };
}

export async function getMyPendingOrganizerRequest() {
  const user = await requireAuth();
  return OrganizationService.getPendingOrganizerMembershipForUser(user.id);
}

export async function approveOrganizerRequest(targetUserId: string) {
  const user = await requireAuth();
  const result = await OrganizationService.approveOrganizerRequest({
    actorId: user.id,
    actorRole: user.role,
    targetUserId,
  });

  const { sendOrganizerApprovedEmail } = await import("@/lib/mail");
  const { NotificationService } = await import("@/lib/notifications/notification.service");
  const { getLocale } = await import("@/lib/i18n/server");
  const locale = await getLocale();

  await NotificationService.create({
    userId: result.user.id,
    type: "organizer_approved",
    title: locale === "en" ? "Organizer request approved" : "Solicitud de organizador aprobada",
    message:
      locale === "en"
        ? `You can now create events for ${result.organization.name}.`
        : `Ya puedes crear eventos para ${result.organization.name}.`,
    metadata: {
      organizationId: result.organization.id,
      organizationName: result.organization.name,
    },
  });

  await sendOrganizerApprovedEmail({
    email: result.user.email,
    name: result.user.name,
    organizationName: result.organization.name,
    locale,
  });

  revalidatePath("/admin/team");
  revalidatePath("/admin/users");
  revalidatePath("/member");
  revalidatePath("/organizer");
  return { success: true };
}

export async function rejectOrganizerRequest(targetUserId: string) {
  const user = await requireAuth();
  const result = await OrganizationService.rejectOrganizerRequest({
    actorId: user.id,
    actorRole: user.role,
    targetUserId,
  });

  const { sendOrganizerRejectedEmail } = await import("@/lib/mail");
  const { NotificationService } = await import("@/lib/notifications/notification.service");
  const { getLocale } = await import("@/lib/i18n/server");
  const locale = await getLocale();

  await NotificationService.create({
    userId: result.user.id,
    type: "organizer_rejected",
    title: locale === "en" ? "Organizer request declined" : "Solicitud de organizador rechazada",
    message:
      locale === "en"
        ? `Your request to join ${result.organization.name} as an organizer was declined.`
        : `Tu solicitud para unirte a ${result.organization.name} como organizador fue rechazada.`,
    metadata: {
      organizationId: result.organization.id,
      organizationName: result.organization.name,
    },
  });

  await sendOrganizerRejectedEmail({
    email: result.user.email,
    name: result.user.name,
    organizationName: result.organization.name,
    locale,
  });

  revalidatePath("/admin/team");
  revalidatePath("/member");
  return { success: true };
}

export async function promoteOrgMember(targetUserId: string, newRole: "organizer" | "member") {
  const user = await requireAuth();
  await OrganizationService.promoteUserInOrg({
    actorId: user.id,
    actorRole: user.role,
    targetUserId,
    newRole,
  });
  revalidatePath("/admin/team");
  revalidatePath("/admin/users");
  return { success: true };
}

export async function createMyOrganization(orgName: string) {
  const user = await requireAuth();
  const role = normalizeRole(user.role);
  if (role !== "admin") throw new Error("Solo administradores de entidad pueden crear una organización");

  const existing = await OrganizationService.getOrganizationForUser(user.id);
  if (existing) throw new Error("Ya tienes una entidad vinculada");

  const name = orgName.trim();
  if (name.length < 2) throw new Error("El nombre de la entidad debe tener al menos 2 caracteres");

  await OrganizationService.createOrganizationForAdmin({
    name,
    ownerUserId: user.id,
  });

  revalidatePath("/admin");
  revalidatePath("/admin/onboarding");
  revalidatePath("/admin/team");
  return { success: true };
}

export async function saveEntitySettingsAction(input: { name: string }) {
  const user = await requireAuth();
  const role = normalizeRole(user.role);
  if (role !== "admin" && role !== "super_admin") {
    throw new Error("No autorizado");
  }

  const org = await OrganizationService.getOrganizationForUser(user.id);
  if (!org) throw new Error("No tienes una entidad vinculada");

  await OrganizationService.updateOrganizationName({
    actorId: user.id,
    actorRole: user.role,
    organizationId: org.id,
    name: input.name,
  });

  revalidatePath("/admin/settings");
  revalidatePath("/admin");
  revalidatePath("/admin/team");
  return { success: true };
}

export async function canManageOrgTeam() {
  const user = await requireAuth();
  const role = normalizeRole(user.role);
  if (role === "super_admin") return true;
  return OrganizationService.isOrgAdmin(user.id, user.role);
}

export async function joinOrganizationWithInviteCode(inviteCode: string) {
  const user = await requireAuth();

  const existing = await OrganizationService.getOrganizationForUser(user.id);
  if (existing) throw new Error("Ya perteneces a una entidad.");

  const pending = await OrganizationService.getPendingOrganizerMembershipForUser(user.id);
  if (pending) throw new Error("Ya tienes una solicitud pendiente de aprobación.");

  const org = await OrganizationService.requestJoinOrganizationAsOrganizer({
    userId: user.id,
    inviteCode: inviteCode.trim().toUpperCase(),
  });

  const { notifyEntityAdminOfOrganizerRequest } = await import(
    "@/lib/organizations/organizer-request-notifications"
  );
  const { getLocale } = await import("@/lib/i18n/server");
  await notifyEntityAdminOfOrganizerRequest({
    org,
    requesterName: user.name,
    requesterEmail: user.email,
    locale: await getLocale(),
  });

  revalidatePath("/organizer");
  revalidatePath("/organizer/settings");
  revalidatePath("/member");
  revalidatePath("/admin/team");
  return { success: true, organizationName: org.name, pending: true };
}
