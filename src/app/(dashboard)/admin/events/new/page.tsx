import Link from "next/link";
import { ArrowLeft, Users } from "lucide-react";
import { getI18n } from "@/lib/i18n/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { normalizeRole } from "@/lib/auth/rbac";
import { getStaffBaseFromRequest } from "@/lib/navigation/get-staff-base.server";
import { staffDashboardPath } from "@/lib/navigation/dashboard-paths";

export default async function AdminNewEventPage() {
    const { t } = await getI18n();
    const session = await auth.api.getSession({ headers: await headers() });
    const role = normalizeRole(session?.user?.role);
    const staffBase = await getStaffBaseFromRequest();
    const eventsPath = staffDashboardPath(staffBase, "events");
    const teamPath = staffDashboardPath(staffBase, "team");

    if (role === "admin") {
        return (
            <div className="mx-auto max-w-lg space-y-6 rounded-2xl border border-border bg-card p-8 text-center">
                <Users className="mx-auto h-10 w-10 text-primary" />
                <h1 className="font-display text-2xl font-semibold text-foreground">
                    {t("auth.adminCannotCreateEventsTitle")}
                </h1>
                <p className="text-sm text-muted-foreground">{t("auth.adminCannotCreateEventsBody")}</p>
                <Link
                    href={teamPath}
                    className="inline-flex rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                >
                    {t("auth.adminGoToTeam")}
                </Link>
            </div>
        );
    }

    const { EventForm } = await import("@/components/events/EventForm");
    const { getCategories } = await import("@/actions/events");
    const { resolveAdminScope } = await import("@/lib/organizations/admin-scope");

    const categories = await getCategories();
    const adminScope = await resolveAdminScope();

    const createEventIntro =
        role === "super_admin" && adminScope.mode === "platform"
            ? t("dashboard.admin.createEventIntro")
            : t("dashboard.admin.createEventIntroEntity");

    return (
        <div className="space-y-6">
            <div>
                <Link
                    href={eventsPath}
                    className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                    <ArrowLeft className="h-3.5 w-3.5" />
                    {t("dashboard.admin.backToEvents")}
                </Link>
                <h1 className="mt-3 font-display text-3xl font-semibold text-foreground">
                    {t("dashboard.admin.createEventTitle")}
                </h1>
                <p className="mt-1 text-muted-foreground">{createEventIntro}</p>
            </div>

            <EventForm redirectPath={eventsPath} categories={categories} canFeature />
        </div>
    );
}
