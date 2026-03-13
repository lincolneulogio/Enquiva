"use client";

import { updateRole } from "@/actions/admin";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Pencil, Check, X } from "lucide-react";
import type { Role } from "@/lib/db/schema";
import { useTranslations } from "@/components/providers/LocaleProvider";

const colorOptions = [
    { value: "purple", labelKey: "dashboard.admin.colorViolet", className: "bg-purple-500" },
    { value: "blue", labelKey: "dashboard.admin.colorBlue", className: "bg-blue-500" },
    { value: "green", labelKey: "dashboard.admin.colorGreen", className: "bg-green-500" },
    { value: "orange", labelKey: "dashboard.admin.colorAmber", className: "bg-orange-500" },
    { value: "gray", labelKey: "dashboard.admin.colorGray", className: "bg-gray-500" },
];

export function RoleEditor({ role }: { role: Role }) {
    const t = useTranslations();
    const [editing, setEditing] = useState(false);
    const [label, setLabel] = useState(role.label);
    const [description, setDescription] = useState(role.description);
    const [color, setColor] = useState(role.color);
    const [isPending, startTransition] = useTransition();

    const handleSave = () => {
        startTransition(async () => {
            try {
                await updateRole(role.name, { label, description, color });
                toast.success(t("dashboard.admin.roleUpdated"));
                setEditing(false);
            } catch {
                toast.error(t("dashboard.admin.failedToUpdateRoleDefinition"));
            }
        });
    };

    const handleCancel = () => {
        setLabel(role.label);
        setDescription(role.description);
        setColor(role.color);
        setEditing(false);
    };

    const colorClass: Record<string, string> = {
        purple: "bg-purple-100 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400",
        blue: "bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400",
        green: "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400",
        orange: "bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400",
        gray: "bg-secondary text-foreground",
    };

    return (
        <div className="rounded-xl border border-border bg-card p-5">
            <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                    {editing ? (
                        <div className="space-y-3">
                            <div>
                                <label className="mb-1 block text-xs font-medium text-muted-foreground">{t("common.label")}</label>
                                <input
                                    value={label}
                                    onChange={(e) => setLabel(e.target.value)}
                                    className="w-full rounded-lg border border-border bg-background px-3 py-1.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                                />
                            </div>
                            <div>
                                <label className="mb-1 block text-xs font-medium text-muted-foreground">{t("common.descriptionLabel")}</label>
                                <textarea
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    rows={2}
                                    className="w-full resize-none rounded-lg border border-border bg-background px-3 py-1.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                                />
                            </div>
                            <div>
                                <label className="mb-1 block text-xs font-medium text-muted-foreground">{t("common.color")}</label>
                                <div className="flex gap-2">
                                    {colorOptions.map((c) => (
                                        <button
                                            key={c.value}
                                            onClick={() => setColor(c.value)}
                                            title={t(c.labelKey)}
                                            className={`h-6 w-6 rounded-full ${c.className} ring-offset-background transition-all ${color === c.value ? "ring-2 ring-primary ring-offset-2" : ""}`}
                                        />
                                    ))}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div>
                            <div className="flex items-center gap-2">
                                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${colorClass[role.color] ?? colorClass.gray}`}>
                                    {role.label}
                                </span>
                                <code className="text-xs text-muted-foreground">{role.name}</code>
                            </div>
                            <p className="mt-2 text-sm text-muted-foreground">{role.description}</p>
                        </div>
                    )}
                </div>

                <div className="flex shrink-0 gap-1">
                    {editing ? (
                        <>
                            <button
                                onClick={handleSave}
                                disabled={isPending}
                                className="flex items-center gap-1 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
                            >
                                <Check className="h-3.5 w-3.5" />
                                {t("common.save")}
                            </button>
                            <button
                                onClick={handleCancel}
                                className="flex items-center gap-1 rounded-lg border border-border bg-secondary px-3 py-1.5 text-xs font-medium text-foreground hover:bg-secondary/80 transition-colors"
                            >
                                <X className="h-3.5 w-3.5" />
                                {t("common.cancel")}
                            </button>
                        </>
                    ) : (
                        <button
                            onClick={() => setEditing(true)}
                            className="flex items-center gap-1 rounded-lg border border-border bg-secondary px-3 py-1.5 text-xs font-medium text-foreground hover:bg-secondary/80 transition-colors"
                        >
                            <Pencil className="h-3.5 w-3.5" />
                            {t("common.edit")}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
