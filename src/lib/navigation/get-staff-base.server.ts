import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { getStaffDashboardBase, staffDashboardPath } from "@/lib/navigation/dashboard-paths";

export async function getStaffBaseFromRequest() {
  const requestHeaders = await headers();
  const pathname = requestHeaders.get("x-pathname") ?? "";
  const session = await auth.api.getSession({ headers: requestHeaders });
  return getStaffDashboardBase(pathname, session?.user?.role);
}

export async function staffPathFromRequest(subpath = "") {
  const base = await getStaffBaseFromRequest();
  return staffDashboardPath(base, subpath);
}
