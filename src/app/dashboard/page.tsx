import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export default async function DashboardRedirectPage() {
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session?.user) redirect("/login");

    const role = session.user.role;

    if (role === "super_admin" || role === "admin") redirect("/admin");
    if (role === "organizer") redirect("/organizer");
    redirect("/member");
}
