"use client";

import { backfillPendingPayments } from "@/actions/admin";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Database } from "lucide-react";

export function BackfillPendingPaymentsButton() {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleClick = () => {
    startTransition(async () => {
      try {
        const result = await backfillPendingPayments();
        toast.success(
          result.inserted > 0
            ? `Backfill completado: ${result.inserted} pagos pendientes creados.`
            : "Backfill completado: no había registros pendientes por crear."
        );
        router.refresh();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "No se pudo ejecutar el backfill");
      }
    });
  };

  return (
    <button
      onClick={handleClick}
      disabled={isPending}
      className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
    >
      <Database className="h-4 w-4" />
      {isPending ? "Running backfill..." : "Run pending-payments backfill"}
    </button>
  );
}
