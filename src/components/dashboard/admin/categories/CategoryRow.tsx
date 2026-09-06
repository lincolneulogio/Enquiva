"use client";

import { GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";
import { CategoryItem, COLOR_OPTIONS } from "./types";

interface CategoryRowProps {
    item: CategoryItem;
    idx: number;
    draggedId: string | null;
    setDraggedId: (id: string | null) => void;
    onDropOver: (targetId: string) => void;
    onPatchLocal: (id: string, patch: Partial<CategoryItem>) => void;
    onBlurSave: (item: CategoryItem) => void;
    onToggleActive: (id: string, isActive: boolean) => void;
    onDelete: (id: string) => void;
    t: (key: string) => string;
}

export function CategoryRow({
    item,
    idx,
    draggedId,
    setDraggedId,
    onDropOver,
    onPatchLocal,
    onBlurSave,
    onToggleActive,
    onDelete,
    t,
}: CategoryRowProps) {
    return (
        <tr
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
    );
}
