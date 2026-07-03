"use server";

import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { OrganizationService } from "@/lib/organizations/organization.service";
import { normalizeRole } from "@/lib/auth/rbac";

async function requireAuth() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) throw new Error("Unauthorized");
  return session.user;
}

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

export async function canManageOrgTeam() {
  const user = await requireAuth();
  const role = normalizeRole(user.role);
  if (role === "super_admin") return true;
  return OrganizationService.isOrgAdmin(user.id, user.role);
}
