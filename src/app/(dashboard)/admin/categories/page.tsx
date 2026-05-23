import { getAllCategories } from "@/actions/admin";
import { CategoriesManager } from "@/components/dashboard";
import { getI18n } from "@/lib/i18n/server";

export default async function AdminCategoriesPage() {
    const { t } = await getI18n();
    const categories = await getAllCategories();

    return (
        <div className="space-y-6">
            <div>
                <h1 className="font-display text-3xl font-semibold text-foreground">{t("common.categoriesLabel")}</h1>
                <p className="mt-1 text-muted-foreground">
                    {t("dashboard.admin.categoriesIntro")}
                </p>
            </div>

            <CategoriesManager initialCategories={categories} />
        </div>
    );
}
