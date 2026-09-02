"use client";

import Link from "next/link";
import { normalizeRole } from "@/lib/auth/rbac";
import { useLocale } from "@/components/providers/LocaleProvider";
import { useSession } from "@/lib/auth/client";
import { PublicMobileMenu } from "@/components/shared/PublicMobileMenu";
import { PublicUserMenu } from "@/components/shared/PublicUserMenu";
import { ThemeToggle } from "@/components/shared/ThemeToggle";
import { AccentToggle } from "@/components/shared/AccentToggle";
import { BrandLogo } from "@/components/shared/BrandLogo";
import {
  getPublicDashboardPath,
  getPublicHeaderDashboardLabel,
  getPublicHeaderNavLinks,
} from "@/lib/navigation/public-header-nav";

/**
 * Header público:
 * - Izquierda: Logo + Enlaces de navegación principales según rol de sesión.
 * - Derecha: Toggles de tema/acento + Acciones de usuario (Dropdown autenticado o Iniciar sesión / Comenzar).
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

  return (
    <nav
      className="sticky z-50 border-b border-border/80 bg-background/80 backdrop-blur-md"
      style={{ top: "var(--enquiva-banner-offset, 0px)" }}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 py-3.5">
        {/* Left section: Logo + Desktop Navigation Links */}
        <div className="flex items-center gap-4 lg:gap-8 min-w-0">
          <BrandLogo href="/" size="md" priority className="shrink-0" />

          <div className="hidden md:flex items-center gap-3 lg:gap-6 shrink-0">
            {navLinks.map((link) => (
              <Link
                key={`${link.href}-${link.label}`}
                href={link.href}
                className="whitespace-nowrap text-xs font-medium text-muted-foreground transition-colors hover:text-foreground lg:text-sm"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>

        {/* Right section: Theme/Accent Toggles + Auth Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
          {/* Toggles on the right */}
          <ThemeToggle />
          <AccentToggle />

          {/* Desktop Auth State */}
          <div className="hidden md:flex items-center gap-1.5 sm:gap-2 pl-0.5 sm:pl-1">
            {user ? (
              <PublicUserMenu
                user={user}
                dashboardPath={dashboardPath}
                dashboardLabel={dashboardLabel}
              />
            ) : (
              <>
                <Link
                  href="/login"
                  className="inline-flex h-9 items-center justify-center whitespace-nowrap rounded-xl px-2.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground sm:h-10 sm:px-3.5 sm:text-sm"
                >
                  {t("common.signIn")}
                </Link>
                <Link
                  href="/register"
                  className="inline-flex h-9 items-center justify-center whitespace-nowrap rounded-xl bg-primary px-3 text-xs font-bold text-primary-foreground shadow-sm transition-all duration-200 hover:bg-primary/90 hover:shadow-md sm:h-10 sm:px-4 sm:text-sm"
                >
                  {t("common.getStarted")}
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Trigger */}
          <div className="md:hidden">
            <PublicMobileMenu
              links={navLinks}
              primaryHref={user ? dashboardPath : "/register"}
              primaryLabel={user ? dashboardLabel : t("common.getStarted")}
              secondaryHref={user ? undefined : "/login"}
              secondaryLabel={user ? undefined : t("common.signIn")}
              user={user}
            />
          </div>
        </div>
      </div>
    </nav>
  );
}
