"use client";

import { useMemo, useState, useTransition } from "react";
import {
    createCategory,
    deleteCategory,
    reorderCategories,
    updateCategory,
    syncDefaultCategoriesAction,
} from "@/actions/admin";
import { toast } from "sonner";
import { confirmDeleteAction } from "@/lib/ui/confirm";
import { normalizeCategorySlug } from "@/lib/utils";
import { useLocale, useTranslations } from "@/components/providers/LocaleProvider";
import {
    CategoryItem,
    CategoriesManagerProps,
    COLOR_OPTIONS,
    reorderList,
    CreateCategoryForm,
    CategoriesTable,
} from "./categories";

export type { CategoryItem, CategoriesManagerProps };
export { COLOR_OPTIONS };

export function CategoriesManager({ initialCategories }: CategoriesManagerProps) {
    const { locale } = useLocale();
    const t = useTranslations();
    const [items, setItems] = useState(initialCategories);
    const [draggedId, setDraggedId] = useState<string | null>(null);
    const [isPending, startTransition] = useTransition();
    const [newItem, setNewItem] = useState({
        slug: "",
        label: "",
        description: "",
        colorClass: "bg-gray-100 text-gray-800",
    });

    const handleLabelChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setNewItem((prev) => ({
            ...prev,
            label: val,
            slug: normalizeCategorySlug(val),
        }));
    };

    const sorted = useMemo(() => [...items].sort((a, b) => a.sortOrder - b.sortOrder), [items]);

    const persistOrder = (nextItems: CategoryItem[]) => {
        startTransition(async () => {
            try {
                await reorderCategories(nextItems.map((it) => it.id));
            } catch (e) {
                toast.error(e instanceof Error ? e.message : t("dashboard.admin.failedToSaveOrder"));
            }
        });
    };

    const handleSyncDefaults = () => {
        startTransition(async () => {
            try {
                const res = await syncDefaultCategoriesAction();
                if (res.success) {
                    setItems(res.categories);
                    toast.success(
                        locale === "en"
                            ? `Synced: ${res.total} platform categories available`
                            : `Sincronizado: ${res.total} categorías de plataforma disponibles`,
                    );
                }
            } catch (err: unknown) {
                const msg = err instanceof Error ? err.message : "Error";
                toast.error(msg);
            }
        });
    };

    const onCreate = () => {
        if (!newItem.slug.trim() || !newItem.label.trim()) {
            toast.error(t("dashboard.admin.slugRequiredLabelRequired"));
            return;
        }

        startTransition(async () => {
            try {
                const result = await createCategory({
                    slug: newItem.slug,
                    label: newItem.label,
                    description: newItem.description || undefined,
                    colorClass: newItem.colorClass,
                    sortOrder: sorted.length + 1,
                });

                if (!result.category) throw new Error("Category was created but no data was returned");

                setItems((prev) => [...prev, result.category]);
                setNewItem({ slug: "", label: "", description: "", colorClass: "bg-gray-100 text-gray-800" });
                toast.success(t("dashboard.admin.categoryCreated"));
            } catch (e) {
                toast.error(e instanceof Error ? e.message : t("dashboard.admin.failedToCreateCategory"));
            }
        });
    };

    const onToggleActive = (id: string, isActive: boolean) => {
        setItems((prev) => prev.map((it) => (it.id === id ? { ...it, isActive } : it)));
        startTransition(async () => {
            try {
                await updateCategory(id, { isActive });
            } catch (e) {
                toast.error(e instanceof Error ? e.message : t("dashboard.admin.failedToUpdateCategory"));
            }
        });
    };

    const onPatchLocal = (id: string, patch: Partial<CategoryItem>) => {
        setItems((prev) => prev.map((it) => (it.id === id ? { ...it, ...patch } : it)));
    };

    const onBlurSave = (item: CategoryItem) => {
        startTransition(async () => {
            try {
                await updateCategory(item.id, {
                    label: item.label,
                    description: item.description ?? undefined,
                    colorClass: item.colorClass,
                    sortOrder: item.sortOrder,
                });
            } catch (e) {
                toast.error(e instanceof Error ? e.message : t("dashboard.admin.failedToSaveCategory"));
            }
        });
    };

    const onDelete = async (id: string) => {
        const category = items.find((it) => it.id === id);
        const confirmed = await confirmDeleteAction({
            title: t("common.delete"),
            text: category
                ? `${t("dashboard.admin.confirmDeleteCategory")} "${category.label}"`
                : t("dashboard.admin.confirmDeleteCategory"),
            confirmText: t("common.delete"),
            cancelText: t("common.cancel"),
            tone: "danger",
        });
        if (!confirmed) return;

        startTransition(async () => {
            try {
                await deleteCategory(id);
                const next = sorted.filter((it) => it.id !== id).map((it, idx) => ({ ...it, sortOrder: idx + 1 }));
                setItems(next);
                await reorderCategories(next.map((it) => it.id));
                toast.success(t("dashboard.admin.categoryDeleted"));
            } catch (e) {
                toast.error(e instanceof Error ? e.message : t("dashboard.admin.failedToDeleteCategory"));
            }
        });
    };

    const onDropOver = (targetId: string) => {
        if (!draggedId || draggedId === targetId) return;
        const next = reorderList(sorted, draggedId, targetId);
        setItems(next);
        persistOrder(next);
    };

    return (
        <div className="space-y-6">
            <CreateCategoryForm
                newItem={newItem}
                setNewItem={setNewItem}
                handleLabelChange={handleLabelChange}
                onCreate={onCreate}
                isPending={isPending}
                t={t}
                locale={locale}
            />

            <CategoriesTable
                sorted={sorted}
                draggedId={draggedId}
                setDraggedId={setDraggedId}
                onDropOver={onDropOver}
                onPatchLocal={onPatchLocal}
                onBlurSave={onBlurSave}
                onToggleActive={onToggleActive}
                onDelete={onDelete}
                handleSyncDefaults={handleSyncDefaults}
                isPending={isPending}
                locale={locale}
                t={t}
            />
        </div>
    );
}
