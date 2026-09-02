"use client";

import { setUserActive } from "@/actions/admin";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
import { UserCheck, UserX } from "lucide-react";
import { confirmDeleteAction } from "@/lib/ui/confirm";
import { cn } from "@/lib/utils";

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
      className={cn(
        "inline-flex h-9 items-center justify-center gap-1.5 rounded-xl px-3 text-xs font-semibold transition-all active:scale-95 disabled:cursor-not-allowed disabled:opacity-50",
        isActive
          ? "border border-amber-500/30 bg-amber-500/10 text-amber-700 hover:bg-amber-500/20 dark:text-amber-300"
          : "border border-emerald-500/30 bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/20 dark:text-emerald-400",
      )}
    >
      {isActive ? <UserX className="h-3.5 w-3.5" /> : <UserCheck className="h-3.5 w-3.5" />}
      <span>{isPending ? "..." : isActive ? "Suspender" : "Activar"}</span>
    </button>
  );
}
