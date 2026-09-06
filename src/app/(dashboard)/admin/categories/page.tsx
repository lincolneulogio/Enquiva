import { getAllCategories, getTaxonomyStatsAction } from "@/actions/admin";
import { CategoriesManager } from "@/components/dashboard/admin/CategoriesManager";
import { getI18n } from "@/lib/i18n/server";
import { getRequestSession } from "@/lib/request-context";
import { getStaffDashboardHome } from "@/lib/navigation/dashboard-paths";
import { redirect } from "next/navigation";

export default async function AdminCategoriesPage() {
    const session = await getRequestSession();
    if (!session?.user) redirect("/login");
    if (session.user.role !== "super_admin") {
        redirect(getStaffDashboardHome(session.user.role));
    }

    const { t } = await getI18n();
    const categories = await getAllCategories();
    const stats = await getTaxonomyStatsAction();

    return (
        <div className="space-y-6">
            <div>
                <h1 className="font-display text-3xl font-semibold text-foreground">{t("common.categoriesLabel")}</h1>
                <p className="mt-1 text-muted-foreground">
                    {t("dashboard.admin.categoriesIntro")}
                </p>
            </div>

            <CategoriesManager initialCategories={categories} eventCounts={stats.byCategory} />
        </div>
    );
}
