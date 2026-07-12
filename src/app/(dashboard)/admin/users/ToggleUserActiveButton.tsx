"use client";

import { setUserActive } from "@/actions/admin";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
import { confirmDeleteAction } from "@/lib/ui/confirm";

interface ToggleUserActiveButtonProps {
  userId: string;
  isActive: boolean;
  isSelf: boolean;
}

export function ToggleUserActiveButton({
  userId,
  isActive,
  isSelf,
}: ToggleUserActiveButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleToggle = async () => {
    if (isSelf && isActive) return;

    const nextActive = !isActive;
    if (!nextActive) {
      const confirmed = await confirmDeleteAction({
        title: "Suspender usuario",
        text: "El usuario perderá el acceso de inmediato y se cerrarán sus sesiones.",
        confirmText: "Suspender",
        cancelText: "Cancelar",
        tone: "danger",
      });
      if (!confirmed) return;
    }

    startTransition(async () => {
      try {
        await setUserActive(userId, nextActive);
        toast.success(nextActive ? "Usuario activado" : "Usuario suspendido");
        router.refresh();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "No se pudo actualizar el estado");
      }
    });
  };

  return (
    <button
      type="button"
      onClick={handleToggle}
      disabled={isPending || (isSelf && isActive)}
      title={isSelf && isActive ? "No puedes suspender tu propia cuenta" : undefined}
      className={
        isActive
          ? "rounded-lg border border-amber-200 bg-amber-50 px-2 py-1 text-xs font-medium text-amber-800 hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-amber-900/40 dark:bg-amber-900/20 dark:text-amber-300"
          : "rounded-lg border border-emerald-200 bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700 hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-emerald-900/40 dark:bg-emerald-900/20 dark:text-emerald-400"
      }
    >
      {isPending ? "..." : isActive ? "Suspender" : "Activar"}
    </button>
  );
}
