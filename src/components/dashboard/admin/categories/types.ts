export type CategoryItem = {
    id: string;
    slug: string;
    label: string;
    description: string | null;
    colorClass: string;
    isActive: boolean;
    sortOrder: number;
    /** Cantidad de eventos que usan esta categoría (vista previa de impacto). */
    eventCount?: number;
};

export interface CategoriesManagerProps {
    initialCategories: CategoryItem[];
    eventCounts?: Record<string, number>;
}

export const COLOR_OPTIONS = [
    { labelKey: "dashboard.admin.colorGray", value: "bg-gray-100 text-gray-800" },
    { labelKey: "dashboard.admin.colorViolet", value: "bg-violet-100 text-violet-800" },
    { labelKey: "dashboard.admin.colorBlue", value: "bg-blue-100 text-blue-800" },
    { labelKey: "dashboard.admin.colorGreen", value: "bg-green-100 text-green-800" },
    { labelKey: "dashboard.admin.colorAmber", value: "bg-amber-100 text-amber-800" },
    { labelKey: "dashboard.admin.colorRose", value: "bg-rose-100 text-rose-800" },
    { labelKey: "dashboard.admin.colorTeal", value: "bg-teal-100 text-teal-800" },
    { labelKey: "dashboard.admin.colorIndigo", value: "bg-indigo-100 text-indigo-800" },
] as const;

export function reorderList<T extends { id: string }>(list: T[], draggedId: string, targetId: string): T[] {
    const oldIndex = list.findIndex((i) => i.id === draggedId);
    const newIndex = list.findIndex((i) => i.id === targetId);
    if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) return list;

    const next = [...list];
    const [moved] = next.splice(oldIndex, 1);
    next.splice(newIndex, 0, moved);
    return next.map((item, idx) => ({ ...item, sortOrder: idx + 1 }));
}
