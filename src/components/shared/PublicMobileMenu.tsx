"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Menu, X, LogOut, User } from "lucide-react";
import { useEffect, useState } from "react";
import { signOut } from "@/lib/auth/client";
import { useLocale, useTranslations } from "@/components/providers/LocaleProvider";
import { getRoleLabel } from "@/lib/i18n/core";
import { normalizeRole, ROLE_BADGE_STYLES } from "@/lib/auth/rbac";
import { cn } from "@/lib/utils";
import type { PublicNavLink } from "@/lib/navigation/public-header-nav";

type PublicMobileMenuProps = {
  links: PublicNavLink[];
  primaryHref: string;
  primaryLabel: string;
  secondaryHref?: string;
  secondaryLabel?: string;
  user?: {
    name?: string | null;
    email?: string | null;
    role?: string | null;
  } | null;
};

export function PublicMobileMenu({
  links,
  primaryHref,
  primaryLabel,
  secondaryHref,
  secondaryLabel,
  user,
}: PublicMobileMenuProps) {
  const router = useRouter();
  const t = useTranslations();
  const { locale } = useLocale();
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setIsOpen(false);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const closeMenu = () => setIsOpen(false);

  const handleSignOut = async () => {
    closeMenu();
    await signOut({
      fetchOptions: {
        onSuccess: () => {
          router.push("/login");
          router.refresh();
        },
      },
    });
  };

  const normalizedRole = user ? normalizeRole(user.role) : null;
  const roleLabel = normalizedRole ? getRoleLabel(normalizedRole, locale) : null;

  return (
    <div className="relative md:hidden">
      <button
        type="button"
        aria-expanded={isOpen}
        aria-label={isOpen ? "Cerrar menú" : "Abrir menú"}
        onClick={() => setIsOpen((current) => !current)}
        className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-secondary/40 text-foreground shadow-xs transition-colors hover:bg-secondary"
      >
        {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      {isOpen ? (
        <div className="absolute right-0 top-[calc(100%+0.75rem)] z-50 w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-border bg-card/95 p-3 shadow-2xl backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150">
          {user ? (
            <div className="mb-3 rounded-xl bg-secondary/40 p-3">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-xs font-bold text-primary">
                  <User className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-bold text-foreground">
                    {user.name ?? "Usuario"}
                  </p>
                  <p className="truncate text-[11px] text-muted-foreground">
                    {user.email}
                  </p>
                </div>
              </div>
              {roleLabel && normalizedRole ? (
                <div className="mt-2">
                  <span
                    className={cn(
                      "inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-semibold",
                      ROLE_BADGE_STYLES[normalizedRole],
                    )}
                  >
                    {roleLabel}
                  </span>
                </div>
              ) : null}
            </div>
          ) : null}

          <div className="flex flex-col gap-1">
            {links.map((link) => (
              <Link
                key={`${link.href}-${link.label}`}
                href={link.href}
                onClick={closeMenu}
                className="rounded-xl px-3.5 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-secondary"
              >
                {link.label}
              </Link>
            ))}

            <div className="my-1 h-px bg-border/60" />

            <Link
              href={primaryHref}
              onClick={closeMenu}
              className="rounded-xl bg-primary px-4 py-2.5 text-center text-sm font-bold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
            >
              {primaryLabel}
            </Link>

            {secondaryHref && secondaryLabel ? (
              <Link
                href={secondaryHref}
                onClick={closeMenu}
                className="rounded-xl border border-border px-4 py-2.5 text-center text-sm font-medium text-foreground transition-colors hover:bg-secondary"
              >
                {secondaryLabel}
              </Link>
            ) : null}

            {user ? (
              <button
                type="button"
                onClick={handleSignOut}
                className="mt-1 flex items-center justify-center gap-2 rounded-xl border border-destructive/20 bg-destructive/10 px-4 py-2 text-sm font-medium text-destructive transition-colors hover:bg-destructive/15"
              >
                <LogOut className="h-4 w-4" />
                <span>{t("common.signOut")}</span>
              </button>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
