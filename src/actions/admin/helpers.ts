import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function requireSuperAdmin() {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) throw new Error("Unauthorized");
    if (session.user.role !== "super_admin") throw new Error("Forbidden");
    return session.user;
}

export async function requireAdminOrSuper() {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) throw new Error("Unauthorized");
    if (session.user.role !== "admin" && session.user.role !== "super_admin") throw new Error("Forbidden");
    return session.user;
}
