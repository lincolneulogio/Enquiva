import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { ProfileEditor } from "@/components/dashboard";
import { getI18n } from "@/lib/i18n/server";

export default async function MemberProfilePage() {
    const { t } = await getI18n();
    const session = await auth.api.getSession({ headers: await headers() });
    const [user] = await db
        .select({
            name: users.name,
            email: users.email,
            role: users.role,
            phone: users.phone,
            address: users.address,
            bio: users.bio,
            image: users.image,
        })
        .from(users)
        .where(eq(users.id, session!.user.id))
        .limit(1);

    const profileUser = user ?? {
        name: session!.user.name ?? "",
        email: session!.user.email,
        role: session!.user.role ?? "member",
        phone: null,
        address: null,
        bio: null,
        image: session!.user.image ?? null,
    };

    return (
        <div className="space-y-8">
            <div>
                <h1 className="font-display text-3xl font-semibold text-foreground">{t("common.profile")}</h1>
                <p className="mt-1 text-muted-foreground">{t("dashboard.member.accountInfo")}</p>
            </div>

            <ProfileEditor user={profileUser} />
        </div>
    );
}
