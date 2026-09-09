import { redirect } from "next/navigation";
import { getStaffDashboardHome } from "@/lib/navigation/dashboard-paths";
import { getRequestSession } from "@/lib/request-context";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Panel de gestión",
  robots: { index: false, follow: false },
};

export default async function DashboardRedirectPage() {
    const session = await getRequestSession();

    if (!session?.user) redirect("/login");

    const role = session.user.role;

    if (role === "super_admin" || role === "admin") redirect(getStaffDashboardHome(role));
    if (role === "organizer") redirect("/organizer");
    if (role === "scanner") redirect("/scanner");
    redirect("/member");
}
