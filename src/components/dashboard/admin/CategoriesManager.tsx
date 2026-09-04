"use client";

import { useMemo, useState, useTransition } from "react";
import { createCategory, deleteCategory, reorderCategories, updateCategory, syncDefaultCategoriesAction } from "@/actions/admin";
import { toast } from "sonner";
import { confirmDeleteAction } from "@/lib/ui/confirm";
import { GripVertical, RefreshCw } from "lucide-react";
import { cn, normalizeCategorySlug } from "@/lib/utils";
import { useLocale, useTranslations } from "@/components/providers/LocaleProvider";

type CategoryItem = {
    id: string;
    slug: string;
    label: string;
    description: string | null;
    colorClass: string;
    isActive: boolean;
    sortOrder: number;
};

interface CategoriesManagerProps {
    initialCategories: CategoryItem[];
}

const COLOR_OPTIONS = [
    { labelKey: "dashboard.admin.colorGray", value: "bg-gray-100 text-gray-800" },
    { labelKey: "dashboard.admin.colorViolet", value: "bg-violet-100 text-violet-800" },
    { labelKey: "dashboard.admin.colorBlue", value: "bg-blue-100 text-blue-800" },
    { labelKey: "dashboard.admin.colorGreen", value: "bg-green-100 text-green-800" },
    { labelKey: "dashboard.admin.colorAmber", value: "bg-amber-100 text-amber-800" },
    { labelKey: "dashboard.admin.colorRose", value: "bg-rose-100 text-rose-800" },
    { labelKey: "dashboard.admin.colorTeal", value: "bg-teal-100 text-teal-800" },
    { labelKey: "dashboard.admin.colorIndigo", value: "bg-indigo-100 text-indigo-800" },
] as const;

function reorderList<T extends { id: string }>(list: T[], draggedId: string, targetId: string): T[] {
    const oldIndex = list.findIndex((i) => i.id === draggedId);
    const newIndex = list.findIndex((i) => i.id === targetId);
    if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) return list;

    const next = [...list];
    const [moved] = next.splice(oldIndex, 1);
    next.splice(newIndex, 0, moved);
    return next.map((item, idx) => ({ ...item, sortOrder: idx + 1 }));
}

const slugify = normalizeCategorySlug;

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
            slug: slugify(val),
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
            {/* Create Category Form Panel */}
            <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
                <h3 className="text-sm font-bold text-foreground uppercase tracking-wider flex items-center gap-2 border-b border-border/30 pb-2.5">
                    <span className="flex h-5 w-5 items-center justify-center rounded-md bg-primary/10 text-primary">
                        +
                    </span>
                    {t("dashboard.admin.createCategory")}
                </h3>
                <div className="mt-4 grid gap-4 sm:grid-cols-3 items-end">
                    {/* 1. Etiqueta (Label) */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-muted-foreground block">{t("common.label") || "Etiqueta"}</label>
                        <input
                            value={newItem.label}
                            onChange={handleLabelChange}
                            placeholder={t("dashboard.admin.labelPlaceholder") || "Ej. Juventud"}
                            className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm transition focus:border-primary focus:ring-1 focus:ring-primary focus:bg-background/80"
                        />
                    </div>
                    
                    {/* 2. Descripción (Description) */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-muted-foreground block">{locale === "en" ? "Description (Optional)" : "Descripción (Opcional)"}</label>
                        <input
                            value={newItem.description}
                            onChange={(e) => setNewItem((p) => ({ ...p, description: e.target.value }))}
                            placeholder={t("dashboard.admin.descriptionOptionalPlaceholder") || "Ej. Eventos para jóvenes"}
                            className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm transition focus:border-primary focus:ring-1 focus:ring-primary focus:bg-background/80"
                        />
                    </div>

                    {/* 3. Slug */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-muted-foreground block flex items-center justify-between">
                            <span>{t("common.slug") || "Slug"}</span>
                            <span className="text-[10px] text-primary/80 lowercase italic font-normal">({locale === "en" ? "auto-generated" : "auto-generado"})</span>
                        </label>
                        <input
                            value={newItem.slug}
                            onChange={(e) => setNewItem((p) => ({ ...p, slug: normalizeCategorySlug(e.target.value) }))}
                            placeholder={t("dashboard.admin.slugPlaceholder") || "ej-slug-categoria"}
                            className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm transition focus:border-primary focus:ring-1 focus:ring-primary font-mono text-xs focus:bg-background/80"
                        />
                    </div>
                </div>

                {/* Color Selection & Submit button */}
                <div className="mt-4 pt-4 border-t border-border/40 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="space-y-1.5 flex-1">
                        <span className="text-xs font-semibold text-muted-foreground block">{t("common.color")}</span>
                        <div className="flex flex-wrap gap-2">
                            {COLOR_OPTIONS.map((option) => (
                                <button
                                    key={option.value}
                                    type="button"
                                    onClick={() => setNewItem((p) => ({ ...p, colorClass: option.value }))}
                                    className={cn(
                                        "rounded-full border px-3 py-1.5 text-xs font-semibold transition active:scale-95 cursor-pointer",
                                        option.value,
                                        newItem.colorClass === option.value 
                                            ? "ring-2 ring-primary ring-offset-2 ring-offset-card border-transparent" 
                                            : "border-border hover:bg-muted/50"
                                    )}
                                >
                                    {t(option.labelKey)}
                                </button>
                            ))}
                        </div>
                    </div>
                    
                    <button
                        type="button"
                        onClick={onCreate}
                        disabled={isPending}
                        className="self-end sm:self-auto rounded-xl bg-primary hover:bg-primary/95 text-primary-foreground px-5 py-2.5 text-sm font-bold shadow-sm transition active:scale-95 disabled:opacity-60 shrink-0 w-full sm:w-auto mt-2 sm:mt-0 cursor-pointer"
                    >
                        {t("dashboard.admin.addCategory")}
                    </button>
                </div>
            </div>

            {/* Categories Table Directory */}
            <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
                <div className="px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-border bg-muted/10">
                    <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-foreground flex items-center gap-2">
                            <GripVertical className="h-4 w-4 text-primary" />
                            {locale === "en" ? "Categories Directory" : "Directorio de Categorías"}
                        </span>
                        <span className="rounded-full bg-primary/10 border border-primary/20 px-2 py-0.5 text-[11px] font-bold text-primary">
                            {sorted.length}
                        </span>
                    </div>

                    <div className="flex items-center gap-3">
                        <span className="text-[10px] uppercase tracking-wider text-muted-foreground/80 font-medium hidden md:inline">
                            {t("dashboard.admin.dragToReorder")}
                        </span>
                        <button
                            type="button"
                            onClick={handleSyncDefaults}
                            disabled={isPending}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background hover:bg-muted px-2.5 py-1 text-xs font-semibold text-foreground transition disabled:opacity-50 cursor-pointer shadow-xs"
                            title={locale === "en" ? "Sync default platform categories" : "Sincronizar categorías por defecto"}
                        >
                            <RefreshCw className={cn("h-3 w-3 text-primary", isPending && "animate-spin")} />
                            <span>{locale === "en" ? "Sync defaults" : "Sincronizar por defecto"}</span>
                        </button>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full min-w-[1000px] table-fixed text-sm">
                        <thead>
                            <tr className="border-b border-border bg-muted/50">
                                <th className="px-4 py-3 text-left font-medium text-muted-foreground w-[70px]">#</th>
                                <th className="px-4 py-3 text-left font-medium text-muted-foreground w-[260px]">{t("common.label")}</th>
                                <th className="px-4 py-3 text-left font-medium text-muted-foreground w-[200px]">{t("common.slug")}</th>
                                <th className="px-4 py-3 text-left font-medium text-muted-foreground w-[240px]">{t("common.color")}</th>
                                <th className="px-4 py-3 text-left font-medium text-muted-foreground w-[110px]">{t("common.active")}</th>
                                <th className="px-4 py-3.5 text-right font-medium text-muted-foreground w-[120px]">{locale === "en" ? "Actions" : "Acciones"}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {sorted.map((item, idx) => (
                                <tr
                                    key={item.id}
                                    className={cn(
                                        "hover:bg-muted/30 transition-colors",
                                        draggedId === item.id && "bg-secondary/30 border-l-2 border-primary"
                                    )}
                                    draggable
                                    onDragStart={() => setDraggedId(item.id)}
                                    onDragEnd={() => setDraggedId(null)}
                                    onDragOver={(e) => e.preventDefault()}
                                    onDrop={() => onDropOver(item.id)}
                                >
                                    {/* Number / Reorder Grip */}
                                    <td className="px-4 py-4 text-muted-foreground font-medium whitespace-nowrap cursor-grab active:cursor-grabbing">
                                        <span className="inline-flex items-center gap-1.5">
                                            <GripVertical className="h-4 w-4 text-muted-foreground/60 hover:text-primary transition-colors" /> 
                                            {idx + 1}
                                        </span>
                                    </td>

                                    {/* Label (Editable Input) */}
                                    <td className="px-4 py-4">
                                        <input
                                            value={item.label}
                                            onChange={(e) => onPatchLocal(item.id, { label: e.target.value })}
                                            onBlur={() => onBlurSave(item)}
                                            className="w-full rounded-lg border border-border bg-background/50 focus:bg-background px-3 py-1.5 text-sm transition-all focus:border-primary focus:ring-1 focus:ring-primary text-foreground font-semibold"
                                        />
                                    </td>

                                    {/* Slug (Static Mono Key) */}
                                    <td className="px-4 py-4 font-mono text-xs text-muted-foreground truncate" title={item.slug}>
                                        {item.slug}
                                    </td>

                                    {/* Color Badge & Dropdown Selector */}
                                    <td className="px-4 py-4 whitespace-nowrap">
                                        <div className="flex items-center gap-2">
                                            <span className={cn("rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider", item.colorClass)}>
                                                {t(COLOR_OPTIONS.find((opt) => opt.value === item.colorClass)?.labelKey ?? "dashboard.admin.colorGray")}
                                            </span>
                                            <select
                                                value={item.colorClass}
                                                onChange={(e) => {
                                                    const nextValue = e.target.value;
                                                    const next = { ...item, colorClass: nextValue };
                                                    onPatchLocal(item.id, { colorClass: nextValue });
                                                    onBlurSave(next);
                                                }}
                                                className="rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs font-semibold text-foreground focus:border-primary focus:ring-1 focus:ring-primary cursor-pointer hover:bg-muted/30 transition-all"
                                            >
                                                {COLOR_OPTIONS.map((option) => (
                                                    <option key={option.value} value={option.value}>
                                                        {t(option.labelKey)}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    </td>

                                    {/* Active State (Styled Checkbox) */}
                                    <td className="px-4 py-4 whitespace-nowrap">
                                        <input
                                            type="checkbox"
                                            checked={item.isActive}
                                            onChange={(e) => onToggleActive(item.id, e.target.checked)}
                                            className="h-4.5 w-4.5 rounded border-border text-primary bg-background focus:ring-primary focus:ring-offset-background cursor-pointer"
                                        />
                                    </td>

                                    {/* Actions (Delete Button) */}
                                    <td className="px-4 py-4 text-right whitespace-nowrap">
                                        <button
                                            type="button"
                                            onClick={() => onDelete(item.id)}
                                            className="inline-flex items-center justify-center rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white px-3 py-1.5 text-xs font-bold transition active:scale-95 cursor-pointer"
                                        >
                                            {t("common.delete")}
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
