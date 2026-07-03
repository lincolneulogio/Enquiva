"use server";

import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { OrganizationService } from "@/lib/organizations/organization.service";

export async function getAnalyticsOrganizationOptions() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (session?.user?.role !== "super_admin") return [];
  return OrganizationService.listActiveOrganizations();
}
