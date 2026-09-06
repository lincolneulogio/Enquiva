"use client";

import { useTransition } from "react";
import { RotateCcw } from "lucide-react";
import type { AppRole } from "@/lib/auth/rbac";
import { useTranslations } from "@/components/providers/LocaleProvider";
import { confirmDeleteAction } from "@/lib/ui/confirm";

export interface ResetRolePermissionsButtonProps {
  role: AppRole;
  roleLabel: string;
  modifiedCount: number;
  disabled?: boolean;
  /** Si se pasa, el padre aplica reset (borra overrides + sincroniza draft). */
  onConfirmReset?: (role: AppRole) => void | Promise<void>;
}

export function ResetRolePermissionsButton({
  role,
  roleLabel,
  modifiedCount,
  disabled = false,
  onConfirmReset,
}: ResetRolePermissionsButtonProps) {
  const [isPending, startTransition] = useTransition();
  const t = useTranslations();

  const onReset = async () => {
    const confirmed = await confirmDeleteAction({
      title: t("dashboard.admin.permissionsResetRole"),
      text: t("dashboard.admin.permissionsResetRoleConfirm", { role: roleLabel }),
      confirmText: t("dashboard.admin.permissionsResetRole"),
      cancelText: t("common.cancel"),
      tone: "warning",
    });
    if (!confirmed || !onConfirmReset) return;

    startTransition(async () => {
      await onConfirmReset(role);
    });
  };

  return (
    <button
      type="button"
      onClick={() => void onReset()}
      disabled={disabled || isPending || !onConfirmReset}
      title={t("dashboard.admin.permissionsResetRole")}
      className="inline-flex items-center gap-1 rounded-full border border-amber-300/70 bg-amber-50 px-2 py-0.5 text-[10px] font-medium text-amber-800 transition-colors hover:bg-amber-100 disabled:opacity-50 dark:border-amber-500/40 dark:bg-amber-900/30 dark:text-amber-200"
    >
      <RotateCcw className="h-3 w-3" />
      {t("dashboard.admin.permissionsResetRole")} ({modifiedCount})
    </button>
  );
}
