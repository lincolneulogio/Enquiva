import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { EventForm } from "@/components/events/EventForm";
import { getCategories } from "@/actions/events";
import { getI18n } from "@/lib/i18n/server";
import { resolveAdminScope } from "@/lib/organizations/admin-scope";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { normalizeRole } from "@/lib/auth/rbac";

export default async function AdminNewEventPage() {
    const { t } = await getI18n();
    const categories = await getCategories();
    const session = await auth.api.getSession({ headers: await headers() });
    const role = normalizeRole(session?.user?.role);
    const adminScope = await resolveAdminScope();

    const createEventIntro =
        role === "super_admin" && adminScope.mode === "platform"
            ? t("dashboard.admin.createEventIntro")
            : t("dashboard.admin.createEventIntroEntity");

    return (
        <div className="space-y-6">
            <div>
                <Link
                    href="/admin/events"
                    className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                    <ArrowLeft className="h-3.5 w-3.5" />
                    {t("dashboard.admin.backToEvents")}
                </Link>
                <h1 className="mt-3 font-display text-3xl font-semibold text-foreground">
                    {t("dashboard.admin.createEventTitle")}
                </h1>
                <p className="mt-1 text-muted-foreground">
                    {createEventIntro}
                </p>
            </div>

            <EventForm redirectPath="/admin/events" categories={categories} canFeature />
        </div>
    );
}
