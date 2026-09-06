"use client";

import { cn, normalizeCategorySlug } from "@/lib/utils";
import { COLOR_OPTIONS } from "./types";

interface CreateCategoryFormProps {
    newItem: {
        slug: string;
        label: string;
        description: string;
        colorClass: string;
    };
    setNewItem: React.Dispatch<React.SetStateAction<{
        slug: string;
        label: string;
        description: string;
        colorClass: string;
    }>>;
    handleLabelChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onCreate: () => void;
    isPending: boolean;
    t: (key: string) => string;
    locale: "es" | "en";
}

export function CreateCategoryForm({
    newItem,
    setNewItem,
    handleLabelChange,
    onCreate,
    isPending,
    t,
    locale,
}: CreateCategoryFormProps) {
    return (
        <div className="rounded-2xl border border-border bg-card p-5 shadow-xs">
            <h3 className="text-sm font-bold text-foreground uppercase tracking-wider flex items-center gap-2 border-b border-border/30 pb-2.5">
                <span className="flex h-5 w-5 items-center justify-center rounded-md bg-primary/10 text-primary">
                    +
                </span>
                {t("dashboard.admin.createCategory")}
            </h3>
            <div className="mt-4 grid gap-4 sm:grid-cols-3 items-end">
                {/* 1. Etiqueta (Label) */}
                <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-muted-foreground block">
                        {t("common.label") || "Etiqueta"}
                    </label>
                    <input
                        value={newItem.label}
                        onChange={handleLabelChange}
                        placeholder={t("dashboard.admin.labelPlaceholder") || "Ej. Juventud"}
                        className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm transition focus:border-primary focus:ring-1 focus:ring-primary focus:bg-background/80"
                    />
                </div>

                {/* 2. Descripción (Description) */}
                <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-muted-foreground block">
                        {locale === "en" ? "Description (Optional)" : "Descripción (Opcional)"}
                    </label>
                    <input
                        value={newItem.description}
                        onChange={(e) => setNewItem((p) => ({ ...p, description: e.target.value }))}
                        placeholder={t("dashboard.admin.descriptionOptionalPlaceholder") || "Ej. Eventos para jóvenes"}
                        className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm transition focus:border-primary focus:ring-1 focus:ring-primary focus:bg-background/80"
                    />
                </div>

                {/* 3. Slug */}
                <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-muted-foreground flex items-center justify-between">
                        <span>{t("common.slug") || "Slug"}</span>
                        <span className="text-[10px] text-primary/80 lowercase italic font-normal">
                            ({locale === "en" ? "auto-generated" : "auto-generado"})
                        </span>
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
                    className="self-end sm:self-auto rounded-xl bg-primary hover:bg-primary/95 text-primary-foreground px-5 py-2.5 text-sm font-bold shadow-xs transition active:scale-95 disabled:opacity-60 shrink-0 w-full sm:w-auto mt-2 sm:mt-0 cursor-pointer"
                >
                    {t("dashboard.admin.addCategory")}
                </button>
            </div>
        </div>
    );
}
