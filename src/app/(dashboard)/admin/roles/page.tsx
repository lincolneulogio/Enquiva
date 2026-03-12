import { db } from "@/lib/db";
import { roles, users } from "@/lib/db/schema";
import { count, eq } from "drizzle-orm";
import { seedRoles } from "@/actions/admin";
import { RoleEditor } from "./RoleEditor";
import { Shield } from "lucide-react";
import { SeedRolesButton } from "@/components/dashboard/SeedRolesButton";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

async function getRolesWithCounts() {
    const allRoles = await db.select().from(roles);

    const withCounts = await Promise.all(
        allRoles.map(async (role) => {
            const [{ count: userCount }] = await db
                .select({ count: count() })
                .from(users)
                .where(eq(users.role, role.name as "super_admin" | "admin" | "organizer" | "member"));
            return { ...role, userCount };
        })
    );

    return withCounts;
}

export default async function AdminRolesPage() {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) redirect("/login");
    if (session.user.role !== "super_admin") redirect("/admin");

    const rolesWithCounts = await getRolesWithCounts();
    const isEmpty = rolesWithCounts.length === 0;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="font-display text-3xl font-semibold text-foreground">Roles</h1>
                    <p className="mt-1 text-muted-foreground">
                        Manage role labels and descriptions for your platform
                    </p>
                </div>
                {isEmpty && <SeedRolesButton />}
            </div>

            {isEmpty ? (
                <div className="rounded-xl border border-dashed border-border bg-card p-12 text-center">
                    <Shield className="mx-auto h-10 w-10 text-muted-foreground/50" />
                    <p className="mt-4 font-medium text-foreground">No roles configured</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Click &ldquo;Initialize roles&rdquo; to create the default roles.
                    </p>
                </div>
            ) : (
                <div className="grid gap-4 max-w-2xl">
                    {rolesWithCounts.map((role) => (
                        <div key={role.name}>
                            <div className="mb-1 flex items-center justify-between px-1">
                                <span className="text-xs text-muted-foreground">
                                    {role.userCount} user{role.userCount !== 1 ? 's' : ''} with this role
                                </span>
                            </div>
                            <RoleEditor role={role} />
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
