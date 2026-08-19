"use client";

import Link from "next/link";
import { normalizeRole } from "@/lib/auth/rbac";
import { getRoleLabel } from "@/lib/i18n/core";
import { useLocale } from "@/components/providers/LocaleProvider";
import { useSession } from "@/lib/auth/client";
import { PublicMobileMenu } from "@/components/shared/PublicMobileMenu";
import { ThemeToggle } from "@/components/shared/ThemeToggle";
import { AccentToggle } from "@/components/shared/AccentToggle";
import { BrandLogo } from "@/components/shared/BrandLogo";
import {
  getPublicDashboardPath,
  getPublicHeaderDashboardLabel,
  getPublicHeaderNavLinks,
} from "@/lib/navigation/public-header-nav";

/**
 * Header público en cliente: la sesión no dynamiza /, /events ni /pricing.
 * Mientras carga, se muestra el chrome de invitado (el tráfico mayoritario).
 */
export function PublicHeader() {
  const { t, locale } = useLocale();
  const { data: session } = useSession();
  const user = session?.user;
  const role = user?.role ?? null;
  const normalizedRole = normalizeRole(role);
  const dashboardPath = getPublicDashboardPath(role);
  const dashboardLabel = getPublicHeaderDashboardLabel(
    role,
    locale === "en" ? "en" : "es",
    t("common.goToDashboard"),
  );

  const navLinks = getPublicHeaderNavLinks(role, {
    browseEvents: t("common.browseEvents"),
    plans: locale === "en" ? "For organizers" : "Para organizadores",
    tickets: t("dashboard.member.ticketsTitle"),
    myEvents:
      locale === "en"
        ? normalizedRole === "member"
          ? "My events"
          : "Events"
        : normalizedRole === "member"
          ? "Mis eventos"
          : "Eventos",
    scan: locale === "en" ? "Check-in" : "Check-in",
    saasPlans: locale === "en" ? "SaaS plans" : "Planes SaaS",
    entityPlan: locale === "en" ? "Entity plan" : "Plan entidad",
    billing: locale === "en" ? "Billing" : "Facturación",
    dashboard: dashboardLabel,
  });

  const roleLabel = user ? getRoleLabel(normalizedRole, locale) : null;

  return (
    <nav
      className="sticky z-50 border-b border-border bg-background/80 backdrop-blur-md"
      style={{ top: "var(--enquiva-banner-offset, 0px)" }}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-4">
        <BrandLogo href="/" size="md" priority className="shrink-0" />

        <div className="flex items-center gap-2 md:hidden">
          <ThemeToggle />
          <AccentToggle />
          <PublicMobileMenu
            links={navLinks}
            primaryHref={user ? dashboardPath : "/register"}
            primaryLabel={user ? dashboardLabel : t("common.getStarted")}
            secondaryHref={user ? undefined : "/login"}
            secondaryLabel={user ? undefined : t("common.signIn")}
          />
        </div>

        <div className="hidden items-center gap-5 lg:gap-6 md:flex">
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <AccentToggle />
          </div>

          {navLinks.map((link) => (
            <Link
              key={`${link.href}-${link.label}`}
              href={link.href}
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              {link.label}
            </Link>
          ))}

          {user ? (
            <div className="inline-flex h-10 items-center gap-2 rounded-xl border border-border bg-card/45 p-1 pl-1.5 shadow-sm transition-all duration-300 hover:border-primary/20 hover:bg-card/90 hover:shadow-md backdrop-blur-sm">
              <div className="relative flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-primary/20 bg-primary/10 text-xs font-bold text-primary select-none">
                {user.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={user.image}
                    alt={user.name ?? ""}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span>
                    {user.name
                      ? user.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .slice(0, 2)
                          .toUpperCase()
                      : "U"}
                  </span>
                )}
              </div>

              <div className="hidden min-w-0 flex-col justify-center text-left sm:flex">
                <span className="max-w-[140px] truncate text-xs font-bold leading-none text-foreground">
                  {user.name}
                </span>
                <span className="mt-0.5 max-w-[140px] truncate text-[10px] leading-none text-muted-foreground">
                  {roleLabel ?? user.email}
                </span>
              </div>

              <Link
                href={dashboardPath}
                className="inline-flex h-8 shrink-0 items-center rounded-lg bg-primary px-3 text-xs font-bold text-primary-foreground shadow-sm transition-all duration-300 hover:bg-primary/95"
              >
                {dashboardLabel}
              </Link>
            </div>
          ) : (
            <div className="inline-flex h-10 items-center gap-2 rounded-xl border border-border bg-card/45 p-1 pl-1.5 shadow-sm backdrop-blur-sm">
              <div className="relative flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border bg-secondary text-xs font-bold text-muted-foreground select-none">
                IN
              </div>
              <div className="hidden min-w-0 flex-col justify-center text-left sm:flex">
                <span className="max-w-[140px] truncate text-xs font-bold leading-none text-foreground">
                  {locale === "en" ? "Guest" : "Invitado"}
                </span>
                <span className="mt-0.5 max-w-[140px] truncate text-[10px] leading-none text-muted-foreground">
                  {locale === "en" ? "Browse without an account" : "Explora sin cuenta"}
                </span>
              </div>
              <Link
                href="/login"
                className="inline-flex h-8 shrink-0 items-center rounded-lg border border-border bg-background px-3 text-xs font-semibold text-foreground transition-colors hover:bg-secondary"
              >
                {t("common.signIn")}
              </Link>
              <Link
                href="/register"
                className="inline-flex h-8 shrink-0 items-center rounded-lg bg-primary px-3 text-xs font-bold text-primary-foreground shadow-sm transition-colors hover:bg-primary/95"
              >
                {t("common.getStarted")}
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
