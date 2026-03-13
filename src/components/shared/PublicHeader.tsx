import Link from "next/link";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { normalizeRole } from "@/lib/rbac";
import { getI18n } from "@/lib/i18n/server";

function getDashboardPath(role?: string | null) {
    const normalizedRole = normalizeRole(role);
    if (normalizedRole === "organizer") return "/organizer";
    if (normalizedRole === "admin" || normalizedRole === "super_admin") return "/admin";
    return "/member";
}

function getProfilePath(role?: string | null) {
    return `${getDashboardPath(role)}/profile`;
}

export async function PublicHeader() {
    const session = await auth.api.getSession({ headers: await headers() });
    const user = session?.user;
    const { t } = await getI18n();

    return (
        <nav className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
            <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
                <Link href="/" className="flex items-center gap-2">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary">
                        <span className="text-lg text-primary-foreground">✦</span>
                    </div>
                    <span className="font-display text-xl font-semibold text-foreground">
                        FaithEvents
                    </span>
                </Link>

                <div className="hidden items-center gap-6 md:flex">
                    <Link href="/events" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                        {t("common.browseEvents")}
                    </Link>

                    {user ? (
                        <>
                            <Link
                                href={getDashboardPath(user.role)}
                                className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                            >
                                {t("common.goToDashboard")}
                            </Link>
                        </>
                    ) : (
                        <>
                            <Link href="/login" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                                {t("common.signIn")}
                            </Link>
                            <Link
                                href="/register"
                                className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                            >
                                {t("common.getStarted")}
                            </Link>
                        </>
                    )}
                </div>
            </div>
        </nav>
    );
}
