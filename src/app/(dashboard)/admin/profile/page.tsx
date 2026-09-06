import { db } from "@/lib/db";
import { getRequestSession } from "@/lib/request-context";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { ProfileEditor } from "@/components/dashboard/profile/ProfileEditor";
import { getI18n } from "@/lib/i18n/server";

export default async function AdminProfilePage() {
    const { t } = await getI18n();
    const session = await getRequestSession();

    const [user] = await db
        .select({
            name: users.name,
            email: users.email,
            role: users.role,
            phone: users.phone,
            address: users.address,
            bio: users.bio,
            image: users.image,
            twoFactorEnabled: users.twoFactorEnabled,
        })
        .from(users)
        .where(eq(users.id, session!.user.id))
        .limit(1);

    const profileUser = user ?? {
        name: session!.user.name ?? "",
        email: session!.user.email,
        role: session!.user.role ?? "admin",
        phone: null,
        address: null,
        bio: null,
        image: session!.user.image ?? null,
        twoFactorEnabled: false,
    };

    return (
        <div className="space-y-8">
            <div>
                <h1 className="font-display text-3xl font-semibold text-foreground">{t("common.profile")}</h1>
                <p className="mt-1 text-muted-foreground">{t("dashboard.settings.adminInfo")}</p>
            </div>

            <ProfileEditor user={profileUser} />
        </div>
    );
}
