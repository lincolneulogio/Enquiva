"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth/client";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export function TwoFactorForm() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [useBackup, setUseBackup] = useState(false);
  const [isPending, startTransition] = useTransition();

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      try {
        const result = useBackup
          ? await authClient.twoFactor.verifyBackupCode({ code })
          : await authClient.twoFactor.verifyTotp({ code });

        if (result.error) {
          toast.error(result.error.message ?? "Código inválido");
          return;
        }

        toast.success("Verificación correcta");
        router.push("/dashboard");
        router.refresh();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "No se pudo verificar");
      }
    });
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <label className="mb-1.5 block text-sm font-medium text-foreground">
          {useBackup ? "Código de respaldo" : "Código TOTP"}
        </label>
        <input
          value={code}
          onChange={(e) => setCode(e.target.value.trim())}
          inputMode="numeric"
          autoComplete="one-time-code"
          placeholder={useBackup ? "XXXX-XXXX" : "123456"}
          className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          required
        />
      </div>
      <button
        type="button"
        onClick={() => setUseBackup((v) => !v)}
        className="text-xs text-primary hover:underline"
      >
        {useBackup ? "Usar código de la app" : "Usar código de respaldo"}
      </button>
      <button
        type="submit"
        disabled={isPending || code.length < 4}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
      >
        {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Verificar"}
      </button>
    </form>
  );
}
