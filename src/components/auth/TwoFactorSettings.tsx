"use client";

import { useState, useTransition } from "react";
import { authClient } from "@/lib/auth/client";
import { toast } from "sonner";
import { Loader2, ShieldCheck } from "lucide-react";

export function TwoFactorSettings({ enabled }: { enabled?: boolean }) {
  const [password, setPassword] = useState("");
  const [totpUri, setTotpUri] = useState<string | null>(null);
  const [backupCodes, setBackupCodes] = useState<string[] | null>(null);
  const [isPending, startTransition] = useTransition();
  const [isEnabled, setIsEnabled] = useState(Boolean(enabled));

  const enable = () => {
    startTransition(async () => {
      try {
        const result = await authClient.twoFactor.enable({ password });
        if (result.error) {
          toast.error(result.error.message ?? "No se pudo activar 2FA");
          return;
        }
        const data = result.data as {
          totpURI?: string;
          backupCodes?: string[];
        } | null;
        setTotpUri(data?.totpURI ?? null);
        setBackupCodes(data?.backupCodes ?? null);
        setIsEnabled(true);
        toast.success("2FA iniciado. Escanea el código y verifica en /two-factor tras el próximo login.");
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Error activando 2FA");
      }
    });
  };

  const disable = () => {
    startTransition(async () => {
      try {
        const result = await authClient.twoFactor.disable({ password });
        if (result.error) {
          toast.error(result.error.message ?? "No se pudo desactivar 2FA");
          return;
        }
        setIsEnabled(false);
        setTotpUri(null);
        setBackupCodes(null);
        toast.success("2FA desactivado");
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Error desactivando 2FA");
      }
    });
  };

  return (
    <div className="rounded-xl border border-border bg-card p-5 space-y-3">
      <div className="flex items-center gap-2">
        <ShieldCheck className="h-4 w-4 text-primary" />
        <h3 className="font-semibold text-foreground">Autenticación en dos pasos (2FA)</h3>
      </div>
      <p className="text-xs text-muted-foreground">
        Estado: {isEnabled ? "activado / pendiente de verificación" : "desactivado"}. Usa una app
        TOTP (Google Authenticator, Authy, etc.).
      </p>
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Tu contraseña"
        className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
      />
      <div className="flex flex-wrap gap-2">
        {!isEnabled ? (
          <button
            type="button"
            disabled={isPending || password.length < 8}
            onClick={enable}
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground disabled:opacity-50"
          >
            {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
            Activar 2FA
          </button>
        ) : (
          <button
            type="button"
            disabled={isPending || password.length < 8}
            onClick={disable}
            className="inline-flex items-center gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs font-semibold text-rose-700 disabled:opacity-50 dark:text-rose-300"
          >
            {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
            Desactivar 2FA
          </button>
        )}
      </div>
      {totpUri ? (
        <p className="break-all rounded-lg bg-muted/50 p-2 font-mono text-[10px] text-muted-foreground">
          {totpUri}
        </p>
      ) : null}
      {backupCodes?.length ? (
        <div className="rounded-lg border border-border p-3 text-xs">
          <p className="mb-1 font-semibold">Códigos de respaldo (guárdalos):</p>
          <ul className="grid grid-cols-2 gap-1 font-mono">
            {backupCodes.map((code) => (
              <li key={code}>{code}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
