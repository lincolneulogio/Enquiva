import Link from "next/link";
import { Wrench } from "lucide-react";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { normalizeRole } from "@/lib/auth/rbac";
import { getPlatformOpsStatus } from "@/lib/settings";
import { BrandLogo } from "@/components/shared/BrandLogo";
import { ContactEmailLink } from "@/components/shared/BrandText";

export default async function MaintenancePage() {
  const [ops, session] = await Promise.all([
    getPlatformOpsStatus(),
    auth.api.getSession({ headers: await headers() }).catch(() => null),
  ]);

  const isSuperAdmin =
    session?.user && normalizeRole(session.user.role) === "super_admin";

  const message =
    ops.maintenanceMessage ||
    "Estamos realizando mejoras en la plataforma. Vuelve a intentarlo en unos minutos.";

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-background px-4 py-16">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_oklch(0.75_0.12_75_/_0.18),_transparent_55%)]"
      />
      <div className="relative z-10 w-full max-w-lg text-center space-y-6">
        <div className="flex justify-center">
          <BrandLogo href="/maintenance" size="lg" showText />
        </div>

        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <Wrench className="h-7 w-7" aria-hidden />
        </div>

        <div className="space-y-2">
          <h1 className="font-display text-2xl sm:text-3xl font-semibold text-foreground">
            En mantenimiento
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed whitespace-pre-wrap">
            {message}
          </p>
        </div>

        <p className="text-xs text-muted-foreground">
          ¿Necesitas ayuda?{" "}
          <ContactEmailLink className="text-primary underline-offset-2 hover:underline" />
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          {isSuperAdmin ? (
            <Link
              href="/superadmin/settings"
              className="inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2.5 text-xs font-semibold text-primary-foreground hover:bg-primary/95 transition"
            >
              Desactivar en configuración
            </Link>
          ) : (
            <Link
              href="/superadmin/login"
              className="inline-flex items-center justify-center rounded-lg border border-border bg-card px-4 py-2.5 text-xs font-semibold text-foreground hover:bg-muted transition"
            >
              Acceso operaciones
            </Link>
          )}
          <Link
            href="/login"
            className="inline-flex items-center justify-center rounded-lg border border-border bg-card px-4 py-2.5 text-xs font-semibold text-foreground hover:bg-muted transition"
          >
            Iniciar sesión
          </Link>
        </div>

        {!ops.maintenanceMode && (
          <p className="text-xs text-muted-foreground pt-4">
            El mantenimiento ya terminó.{" "}
            <Link href="/" className="text-primary underline-offset-2 hover:underline">
              Volver al inicio
            </Link>
          </p>
        )}
      </div>
    </main>
  );
}
