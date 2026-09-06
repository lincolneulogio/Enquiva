"use client";

import { GripVertical, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { CategoryItem } from "./types";
import { CategoryRow } from "./CategoryRow";

interface CategoriesTableProps {
    sorted: CategoryItem[];
    draggedId: string | null;
    setDraggedId: (id: string | null) => void;
    onDropOver: (targetId: string) => void;
    onPatchLocal: (id: string, patch: Partial<CategoryItem>) => void;
    onBlurSave: (item: CategoryItem) => void;
    onToggleActive: (id: string, isActive: boolean) => void;
    onDelete: (id: string) => void;
    handleSyncDefaults: () => void;
    isPending: boolean;
    locale: "es" | "en";
    t: (key: string) => string;
}

export function CategoriesTable({
    sorted,
    draggedId,
    setDraggedId,
    onDropOver,
    onPatchLocal,
    onBlurSave,
    onToggleActive,
    onDelete,
    handleSyncDefaults,
    isPending,
    locale,
    t,
}: CategoriesTableProps) {
    return (
        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-xs">
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
                            <CategoryRow
                                key={item.id}
                                item={item}
                                idx={idx}
                                draggedId={draggedId}
                                setDraggedId={setDraggedId}
                                onDropOver={onDropOver}
                                onPatchLocal={onPatchLocal}
                                onBlurSave={onBlurSave}
                                onToggleActive={onToggleActive}
                                onDelete={onDelete}
                                t={t}
                            />
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
