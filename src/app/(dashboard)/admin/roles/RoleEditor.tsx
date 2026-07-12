"use client";

import { updateRole } from "@/actions/admin";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import {
  Pencil,
  Check,
  X,
  Crown,
  ShieldCheck,
  Briefcase,
  UserRound,
} from "lucide-react";
import type { Role } from "@/lib/db/schema";
import { useLocale, useTranslations } from "@/components/providers/LocaleProvider";
import { ROLE_BADGE_STYLES, type AppRole } from "@/lib/auth/rbac";
import { getRoleDescription, getRoleLabel } from "@/lib/i18n/core";

const colorOptions = [
  {
    value: "purple",
    labelKey: "dashboard.admin.colorViolet",
    className: "bg-purple-500",
  },
  {
    value: "blue",
    labelKey: "dashboard.admin.colorBlue",
    className: "bg-blue-500",
  },
  {
    value: "green",
    labelKey: "dashboard.admin.colorGreen",
    className: "bg-green-500",
  },
  {
    value: "orange",
    labelKey: "dashboard.admin.colorAmber",
    className: "bg-orange-500",
  },
  {
    value: "gray",
    labelKey: "dashboard.admin.colorGray",
    className: "bg-gray-500",
  },
  {
    value: "rose",
    labelKey: "dashboard.admin.colorRose",
    className: "bg-rose-500",
  },
  {
    value: "cyan",
    labelKey: "dashboard.admin.colorTeal",
    className: "bg-cyan-500",
  },
];

const roleIcons = {
  super_admin: Crown,
  admin: ShieldCheck,
  organizer: Briefcase,
  member: UserRound,
};

const isStandardRole = (name: string): name is AppRole => {
  return ["super_admin", "admin", "organizer", "member"].includes(name);
};

export function RoleEditor({ role }: { role: Role }) {
  const t = useTranslations();
  const { locale } = useLocale();
  const isStd = isStandardRole(role.name);

  const localizedLabel = isStd ? getRoleLabel(role.name, locale) : role.label;
  const localizedDescription = isStd
    ? getRoleDescription(role.name, locale) || role.description
    : role.description;

  const [editing, setEditing] = useState(false);
  const [label, setLabel] = useState(localizedLabel);
  const [description, setDescription] = useState(localizedDescription);
  const [color, setColor] = useState(role.color);
  const [isPending, startTransition] = useTransition();

  const RoleIcon = isStd ? roleIcons[role.name] : null;

  const startEditing = () => {
    setLabel(localizedLabel);
    setDescription(localizedDescription);
    setColor(role.color);
    setEditing(true);
  };

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
    setLabel(localizedLabel);
    setDescription(localizedDescription);
    setColor(role.color);
    setEditing(false);
  };

  const colorClass: Record<string, string> = {
    purple:
      "bg-purple-100 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400",
    blue: "bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400",
    green:
      "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400",
    orange:
      "bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400",
    gray: "bg-secondary text-foreground",
    rose: "bg-rose-100 text-rose-700 dark:bg-rose-900/20 dark:text-rose-400",
    cyan: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/20 dark:text-cyan-400",
  };

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          {editing ? (
            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">
                  {t("common.label")}
                </label>
                <input
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  className="w-full rounded-lg border border-border bg-background px-3 py-1.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">
                  {t("common.descriptionLabel")}
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                  className="w-full resize-none rounded-lg border border-border bg-background px-3 py-1.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">
                  {t("common.color")}
                </label>
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
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold shadow-sm ${
                    isStd
                      ? ROLE_BADGE_STYLES[role.name]
                      : (colorClass[role.color] ?? colorClass.gray)
                  }`}
                >
                  {RoleIcon && <RoleIcon className="h-3.5 w-3.5" />}
                  {localizedLabel}
                </span>
                <code className="text-xs text-muted-foreground">{role.name}</code>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">{localizedDescription}</p>
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
              onClick={startEditing}
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
