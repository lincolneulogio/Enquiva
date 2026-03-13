import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { ProfileEditor } from "@/components/dashboard/ProfileEditor";

export default async function AdminProfilePage() {
    const session = await auth.api.getSession({ headers: await headers() });

    const [user] = await db
        .select({
            name: users.name,
            email: users.email,
            role: users.role,
            bio: users.bio,
            image: users.image,
        })
        .from(users)
        .where(eq(users.id, session!.user.id))
        .limit(1);

    const profileUser = user ?? {
        name: session!.user.name ?? "",
        email: session!.user.email,
        role: session!.user.role ?? "admin",
        bio: null,
        image: session!.user.image ?? null,
    };

    return (
        <div className="space-y-8">
            <div>
                <h1 className="font-display text-3xl font-semibold text-foreground">Profile</h1>
                <p className="mt-1 text-muted-foreground">Administra tu información de cuenta</p>
            </div>

            <ProfileEditor user={profileUser} />
        </div>
    );
}
