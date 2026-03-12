"use client";

import { useMemo, useState, useTransition } from "react";
import { createCategory, deleteCategory, reorderCategories, updateCategory } from "@/actions/admin";
import { toast } from "sonner";
import { GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";

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
    { label: "Gray", value: "bg-gray-100 text-gray-800" },
    { label: "Violet", value: "bg-violet-100 text-violet-800" },
    { label: "Blue", value: "bg-blue-100 text-blue-800" },
    { label: "Green", value: "bg-green-100 text-green-800" },
    { label: "Amber", value: "bg-amber-100 text-amber-800" },
    { label: "Rose", value: "bg-rose-100 text-rose-800" },
    { label: "Teal", value: "bg-teal-100 text-teal-800" },
    { label: "Indigo", value: "bg-indigo-100 text-indigo-800" },
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

export function CategoriesManager({ initialCategories }: CategoriesManagerProps) {
    const [items, setItems] = useState(initialCategories);
    const [draggedId, setDraggedId] = useState<string | null>(null);
    const [isPending, startTransition] = useTransition();
    const [newItem, setNewItem] = useState({
        slug: "",
        label: "",
        description: "",
        colorClass: "bg-gray-100 text-gray-800",
    });

    const sorted = useMemo(() => [...items].sort((a, b) => a.sortOrder - b.sortOrder), [items]);

    const persistOrder = (nextItems: CategoryItem[]) => {
        startTransition(async () => {
            try {
                await reorderCategories(nextItems.map((it) => it.id));
            } catch (e) {
                toast.error(e instanceof Error ? e.message : "Failed to save new order");
            }
        });
    };

    const onCreate = () => {
        if (!newItem.slug.trim() || !newItem.label.trim()) {
            toast.error("Slug and label are required");
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
                toast.success("Category created");
            } catch (e) {
                toast.error(e instanceof Error ? e.message : "Failed to create category");
            }
        });
    };

    const onToggleActive = (id: string, isActive: boolean) => {
        setItems((prev) => prev.map((it) => (it.id === id ? { ...it, isActive } : it)));
        startTransition(async () => {
            try {
                await updateCategory(id, { isActive });
            } catch (e) {
                toast.error(e instanceof Error ? e.message : "Failed to update category");
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
                toast.error(e instanceof Error ? e.message : "Failed to save category");
            }
        });
    };

    const onDelete = (id: string) => {
        startTransition(async () => {
            try {
                await deleteCategory(id);
                const next = sorted.filter((it) => it.id !== id).map((it, idx) => ({ ...it, sortOrder: idx + 1 }));
                setItems(next);
                await reorderCategories(next.map((it) => it.id));
                toast.success("Category deleted");
            } catch (e) {
                toast.error(e instanceof Error ? e.message : "Failed to delete category");
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
        <div className="space-y-4">
            <div className="rounded-xl border border-border p-4">
                <h3 className="text-sm font-semibold text-foreground">Create category</h3>
                <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                    <input
                        value={newItem.slug}
                        onChange={(e) => setNewItem((p) => ({ ...p, slug: e.target.value }))}
                        placeholder="slug (e.g. couples_night)"
                        className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
                    />
                    <input
                        value={newItem.label}
                        onChange={(e) => setNewItem((p) => ({ ...p, label: e.target.value }))}
                        placeholder="Label"
                        className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
                    />
                    <input
                        value={newItem.description}
                        onChange={(e) => setNewItem((p) => ({ ...p, description: e.target.value }))}
                        placeholder="Description (optional)"
                        className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
                    />
                    <button
                        type="button"
                        onClick={onCreate}
                        disabled={isPending}
                        className="rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground disabled:opacity-60"
                    >
                        Add category
                    </button>
                </div>

                <div className="mt-3">
                    <p className="mb-2 text-xs text-muted-foreground">Color</p>
                    <div className="flex flex-wrap gap-2">
                        {COLOR_OPTIONS.map((option) => (
                            <button
                                key={option.value}
                                type="button"
                                onClick={() => setNewItem((p) => ({ ...p, colorClass: option.value }))}
                                className={cn(
                                    "rounded-full border px-2.5 py-1 text-xs transition-colors",
                                    option.value,
                                    newItem.colorClass === option.value ? "ring-2 ring-primary" : "border-border"
                                )}
                            >
                                {option.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="rounded-xl border border-border">
                <div className="border-b border-border px-3 py-2 text-xs text-muted-foreground">
                    Drag rows using <GripVertical className="mx-1 inline h-3.5 w-3.5" /> to reorder categories.
                </div>

                <table className="w-full text-sm">
                    <thead className="bg-secondary/40">
                        <tr>
                            <th className="w-12 px-3 py-2 text-left">#</th>
                            <th className="px-3 py-2 text-left">Slug</th>
                            <th className="px-3 py-2 text-left">Label</th>
                            <th className="px-3 py-2 text-left">Color</th>
                            <th className="px-3 py-2 text-left">Active</th>
                            <th className="px-3 py-2 text-left">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {sorted.map((item, idx) => (
                            <tr
                                key={item.id}
                                className={cn("border-t border-border", draggedId === item.id && "bg-secondary/30")}
                                draggable
                                onDragStart={() => setDraggedId(item.id)}
                                onDragEnd={() => setDraggedId(null)}
                                onDragOver={(e) => e.preventDefault()}
                                onDrop={() => onDropOver(item.id)}
                            >
                                <td className="px-3 py-2 text-muted-foreground">
                                    <span className="inline-flex items-center gap-1">
                                        <GripVertical className="h-4 w-4" /> {idx + 1}
                                    </span>
                                </td>
                                <td className="px-3 py-2 font-mono text-xs text-muted-foreground">{item.slug}</td>
                                <td className="px-3 py-2">
                                    <input
                                        value={item.label}
                                        onChange={(e) => onPatchLocal(item.id, { label: e.target.value })}
                                        onBlur={() => onBlurSave(item)}
                                        className="w-full rounded-md border border-border bg-background px-2 py-1"
                                    />
                                </td>
                                <td className="px-3 py-2">
                                    <div className="flex flex-wrap gap-1">
                                        {COLOR_OPTIONS.map((option) => (
                                            <button
                                                key={option.value}
                                                type="button"
                                                onClick={() => {
                                                    const next = { ...item, colorClass: option.value };
                                                    onPatchLocal(item.id, { colorClass: option.value });
                                                    onBlurSave(next);
                                                }}
                                                className={cn(
                                                    "rounded-full border px-2 py-0.5 text-[11px]",
                                                    option.value,
                                                    item.colorClass === option.value ? "ring-2 ring-primary" : "border-border"
                                                )}
                                            >
                                                {option.label}
                                            </button>
                                        ))}
                                    </div>
                                </td>
                                <td className="px-3 py-2">
                                    <input
                                        type="checkbox"
                                        checked={item.isActive}
                                        onChange={(e) => onToggleActive(item.id, e.target.checked)}
                                    />
                                </td>
                                <td className="px-3 py-2">
                                    <button
                                        type="button"
                                        onClick={() => onDelete(item.id)}
                                        className="rounded-md px-2 py-1 text-red-600 hover:bg-red-50"
                                    >
                                        Delete
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
