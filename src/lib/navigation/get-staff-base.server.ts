import { getStaffDashboardBase, staffDashboardPath } from "@/lib/navigation/dashboard-paths";
import { getRequestPathname, getRequestSession } from "@/lib/request-context";

export async function getStaffBaseFromRequest() {
  const pathname = await getRequestPathname();
  const session = await getRequestSession();
  return getStaffDashboardBase(pathname, session?.user?.role);
}

export async function staffPathFromRequest(subpath = "") {
  const base = await getStaffBaseFromRequest();
  return staffDashboardPath(base, subpath);
}
