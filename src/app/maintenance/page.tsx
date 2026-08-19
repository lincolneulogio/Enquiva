import Link from "next/link";
import { Clock, Wrench } from "lucide-react";
import { getRequestSession } from "@/lib/request-context";
import { normalizeRole } from "@/lib/auth/rbac";
import { getPlatformOpsStatus, getSystemSettings } from "@/lib/settings";
import { BrandLogo } from "@/components/shared/BrandLogo";
import { ContactEmailLink } from "@/components/shared/BrandText";
import { formatDateTimeInTimezone } from "@/lib/settings/platform-locale";
import { getI18n } from "@/lib/i18n/server";
import { MaintenanceCountdown } from "@/components/shared/MaintenanceCountdown";

export default async function MaintenancePage() {
  const [{ locale }, ops, settings, session] = await Promise.all([
    getI18n(),
    getPlatformOpsStatus(),
    getSystemSettings(),
    getRequestSession().catch(() => null),
  ]);

  const isSuperAdmin =
    session?.user && normalizeRole(session.user.role) === "super_admin";

  const message =
    ops.maintenanceMessage ||
    (locale === "en"
      ? "We are improving the platform. Please try again in a few minutes."
      : "Estamos realizando mejoras en la plataforma. Vuelve a intentarlo en unos minutos.");

  const endsLabel = ops.maintenanceEndsAt
    ? formatDateTimeInTimezone(ops.maintenanceEndsAt, {
        timeZone: settings.defaultTimezone,
        locale,
        dateStyle: "medium",
        timeStyle: "short",
      })
    : null;

  const title = locale === "en" ? "Under maintenance" : "En mantenimiento";

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
            {title}
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed whitespace-pre-wrap">
            {message}
          </p>
        </div>

        {ops.maintenanceEndsAt ? (
          <div className="mx-auto inline-flex flex-col items-center gap-1 rounded-xl border border-border bg-card/80 px-4 py-3">
            <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              <Clock className="h-3.5 w-3.5" />
              {locale === "en" ? "Estimated return" : "Retorno estimado"}
            </span>
            {endsLabel ? (
              <p className="text-sm font-semibold text-foreground">{endsLabel}</p>
            ) : null}
            <MaintenanceCountdown
              endsAt={ops.maintenanceEndsAt}
              locale={locale}
            />
          </div>
        ) : null}

        <p className="text-xs text-muted-foreground">
          {locale === "en" ? "Need help?" : "¿Necesitas ayuda?"}{" "}
          <ContactEmailLink className="text-primary underline-offset-2 hover:underline" />
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          {isSuperAdmin ? (
            <Link
              href="/superadmin/settings"
              className="inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2.5 text-xs font-semibold text-primary-foreground hover:bg-primary/95 transition"
            >
              {locale === "en" ? "Manage in settings" : "Gestionar en configuración"}
            </Link>
          ) : (
            <Link
              href="/superadmin/login"
              className="inline-flex items-center justify-center rounded-lg border border-border bg-card px-4 py-2.5 text-xs font-semibold text-foreground hover:bg-muted transition"
            >
              {locale === "en" ? "Ops access" : "Acceso operaciones"}
            </Link>
          )}
          <Link
            href="/login"
            className="inline-flex items-center justify-center rounded-lg border border-border bg-card px-4 py-2.5 text-xs font-semibold text-foreground hover:bg-muted transition"
          >
            {locale === "en" ? "Sign in" : "Iniciar sesión"}
          </Link>
        </div>

        {!ops.maintenanceMode && (
          <p className="text-xs text-muted-foreground pt-4">
            {locale === "en" ? "Maintenance has ended." : "El mantenimiento ya terminó."}{" "}
            <Link href="/" className="text-primary underline-offset-2 hover:underline">
              {locale === "en" ? "Back home" : "Volver al inicio"}
            </Link>
          </p>
        )}
      </div>
    </main>
  );
}
