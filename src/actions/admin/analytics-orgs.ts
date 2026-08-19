"use server";

import { getRequestSession } from "@/lib/request-context";
import { OrganizationService } from "@/lib/organizations/organization.service";

export async function getAnalyticsOrganizationOptions() {
  const session = await getRequestSession();
  if (session?.user?.role !== "super_admin") return [];
  return OrganizationService.listActiveOrganizations();
}
