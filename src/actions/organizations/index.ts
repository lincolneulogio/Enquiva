"use server";

import { revalidatePath } from "next/cache";
import { OrganizationService } from "@/lib/organizations/organization.service";
import { normalizeRole } from "@/lib/auth/rbac";
import { requireAuth } from "@/lib/auth/guards";

export async function getMyOrganization() {
  const user = await requireAuth();
  const org = await OrganizationService.getOrganizationForUser(user.id);
  if (!org) return null;

  const team = await OrganizationService.listTeamMembers(org.id);
  return { organization: org, team, isOwner: org.ownerId === user.id };
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
  const role = normalizeRole(user.role);
  if (role !== "organizer") {
    throw new Error("Solo los organizadores pueden unirse a una entidad con código.");
  }

  const existing = await OrganizationService.getOrganizationForUser(user.id);
  if (existing) throw new Error("Ya perteneces a una entidad.");

  const org = await OrganizationService.joinOrganizationAsOrganizer({
    userId: user.id,
    inviteCode: inviteCode.trim().toUpperCase(),
  });

  revalidatePath("/organizer");
  revalidatePath("/organizer/settings");
  return { success: true, organizationName: org.name };
}
