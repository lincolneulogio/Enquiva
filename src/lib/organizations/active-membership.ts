import type { AppRole } from "@/lib/auth/rbac";
import type { MembershipRole } from "@/lib/auth/membership-role";

export type ActiveOrganizationMembership = {
  organizationId: string;
  organizationName: string;
  membershipRole: MembershipRole;
  appRole: AppRole;
  isCurrent: boolean;
};
