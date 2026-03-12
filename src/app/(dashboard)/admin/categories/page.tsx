import { getAllCategories } from "@/actions/admin";
import { CategoriesManager } from "@/components/dashboard/CategoriesManager";

export default async function AdminCategoriesPage() {
    const categories = await getAllCategories();

    return (
        <div className="space-y-6">
            <div>
                <h1 className="font-display text-3xl font-semibold text-foreground">Categories</h1>
                <p className="mt-1 text-muted-foreground">
                    Manage event categories used in the create/edit event forms.
                </p>
            </div>

            <CategoriesManager initialCategories={categories} />
        </div>
    );
}
