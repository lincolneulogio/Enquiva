"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { LogOut, Crown, ShieldCheck, Briefcase, UserRound, Globe, Moon, Sun, Palette } from "lucide-react";
import Image from "next/image";
import { signOut } from "@/lib/auth/client";
import { cn } from "@/lib/utils";
import { useTranslations, useLocale } from "@/components/providers/LocaleProvider";
import { getRoleLabel, localeOptions } from "@/lib/i18n/core";
import { ROLE_BADGE_STYLES, normalizeRole } from "@/lib/auth/rbac";
import { useAppTheme } from "@/components/providers/AppThemeProvider";
import {
  ACCENT_COLORS,
  DEFAULT_ACCENT_COLOR,
  isAccentColor,
  setAccentOverride,
  type AccentColor,
} from "@/lib/brand/accent";

const ACCENT_ORDER: AccentColor[] = ["amber", "emerald", "rose", "blue"];

interface TopbarUserMenuProps {
  user: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
    role?: string | null;
  };
}

export function TopbarUserMenu({ user }: TopbarUserMenuProps) {
  const router = useRouter();
  const t = useTranslations();
  const { locale, setLocale, isPending: isLocalePending } = useLocale();
  const { theme, setTheme } = useAppTheme();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeAccent, setActiveAccent] = useState<AccentColor>(DEFAULT_ACCENT_COLOR);
  const menuRef = useRef<HTMLDivElement | null>(null);

  const normalizedRole = normalizeRole(user.role);
  const RoleIcon =
    normalizedRole === "super_admin"
      ? Crown
      : normalizedRole === "admin"
        ? ShieldCheck
        : normalizedRole === "organizer"
          ? Briefcase
          : UserRound;

  useEffect(() => {
    const syncAccent = () => {
      const fromDom = document.documentElement.dataset.accent;
      setActiveAccent(isAccentColor(fromDom) ? fromDom : DEFAULT_ACCENT_COLOR);
    };
    syncAccent();
    window.addEventListener("brand-accent-changed", syncAccent);
    return () => window.removeEventListener("brand-accent-changed", syncAccent);
  }, []);

  const handleSignOut = async () => {
    setIsMobileMenuOpen(false);
    await signOut({ fetchOptions: { onSuccess: () => router.push("/login") } });
  };

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (!menuRef.current) return;
      if (menuRef.current.contains(event.target as Node)) return;
      setIsMobileMenuOpen(false);
    };

    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  const isDark = theme === "dark";

  return (
    <div ref={menuRef} className="relative flex shrink-0 items-center gap-2">
      {/* Botón de avatar para pantallas móviles / tablets (< 1024px) */}
      <button
        type="button"
        onClick={() => setIsMobileMenuOpen((prev) => !prev)}
        title={user.name ?? "User"}
        className="inline-flex h-10 items-center gap-2 rounded-xl border border-border bg-secondary/50 p-1 lg:hidden transition-colors hover:bg-secondary"
        aria-expanded={isMobileMenuOpen}
        aria-haspopup="true"
      >
        <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded-lg bg-secondary">
          {user.image ? (
            <Image src={user.image} alt={user.name ?? ""} fill sizes="32px" className="object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-xs font-bold text-foreground">
              {user.name?.[0]?.toUpperCase()}
            </div>
          )}
        </div>
      </button>

      {/* Popover enriquecido para móviles y tablets */}
      {isMobileMenuOpen && (
        <div className="fixed left-1/2 top-[calc(env(safe-area-inset-top)+4.25rem)] z-50 w-[calc(100vw-2rem)] max-w-[320px] -translate-x-1/2 overflow-hidden rounded-2xl border border-border bg-popover p-3 shadow-xl lg:hidden">
          {/* Cabecera de usuario */}
          <div className="flex items-center gap-3 rounded-xl bg-secondary/40 p-2.5">
            <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-xl bg-secondary">
              {user.image ? (
                <Image src={user.image} alt={user.name ?? ""} fill sizes="40px" className="object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-sm font-bold text-foreground">
                  {user.name?.[0]?.toUpperCase()}
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold text-foreground">{user.name}</p>
              <p className="truncate text-xs text-muted-foreground">{user.email}</p>
              <span
                className={cn(
                  "mt-1 inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-semibold",
                  ROLE_BADGE_STYLES[normalizedRole]
                )}
              >
                <RoleIcon className="h-2.5 w-2.5" />
                {getRoleLabel(normalizedRole, locale)}
              </span>
            </div>
          </div>

          {/* Acciones rápidas móviles */}
          <div className="mt-3 space-y-2 border-t border-border pt-3">
            {/* Link a web pública */}
            <Link
              href="/"
              onClick={() => setIsMobileMenuOpen(false)}
              className="flex w-full items-center gap-2.5 rounded-xl border border-border/70 bg-secondary/30 px-3 py-2 text-xs font-medium text-foreground transition-colors hover:bg-secondary"
            >
              <Globe className="h-4 w-4 text-primary" />
              <span className="flex-1">{t("common.visitWebsite") || "Ir a web pública"}</span>
            </Link>

            {/* Fila de controles: Tema, Color, Idioma */}
            <div className="grid grid-cols-2 gap-2">
              {/* Tema claro / oscuro */}
              <button
                type="button"
                onClick={() => setTheme(isDark ? "light" : "dark")}
                className="flex items-center justify-between rounded-xl border border-border/70 bg-secondary/30 px-2.5 py-2 text-xs font-medium text-foreground transition-colors hover:bg-secondary"
              >
                <span className="flex items-center gap-1.5">
                  {isDark ? <Sun className="h-3.5 w-3.5 text-amber-500" /> : <Moon className="h-3.5 w-3.5 text-indigo-500" />}
                  <span>{isDark ? "Claro" : "Oscuro"}</span>
                </span>
              </button>

              {/* Idioma ES / EN */}
              <div className="flex items-center justify-between rounded-xl border border-border/70 bg-secondary/30 p-1">
                {localeOptions.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    disabled={isLocalePending}
                    onClick={() => setLocale(opt.value)}
                    className={cn(
                      "flex-1 rounded-lg py-1 text-center text-[11px] font-bold transition-colors",
                      opt.value === locale
                        ? "bg-background text-foreground shadow-xs"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {opt.value.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            {/* Selector de color de acento */}
            <div className="flex items-center justify-between rounded-xl border border-border/70 bg-secondary/30 px-3 py-2 text-xs">
              <span className="flex items-center gap-1.5 font-medium text-muted-foreground">
                <Palette className="h-3.5 w-3.5 text-primary" />
                <span>Color</span>
              </span>
              <div className="flex items-center gap-1.5">
                {ACCENT_ORDER.map((color) => {
                  const selected = activeAccent === color;
                  return (
                    <button
                      key={color}
                      type="button"
                      onClick={() => {
                        setAccentOverride(color);
                        setActiveAccent(color);
                      }}
                      className={cn(
                        "h-5 w-5 rounded-full shadow-inner ring-1 ring-foreground/15 transition-transform",
                        ACCENT_COLORS[color].class,
                        selected && "scale-110 ring-2 ring-primary ring-offset-1 ring-offset-background"
                      )}
                      aria-label={color}
                    />
                  );
                })}
              </div>
            </div>
          </div>

          {/* Botón cerrar sesión */}
          <div className="mt-3 border-t border-border pt-2">
            <button
              onClick={handleSignOut}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-destructive/10 px-3 py-2.5 text-xs font-semibold text-destructive transition-colors hover:bg-destructive/20"
            >
              <LogOut className="h-3.5 w-3.5" />
              {t("common.signOut")}
            </button>
          </div>
        </div>
      )}

      {/* User info: avatar + nombre + rol en Desktop (>= 1024px) */}
      <div className="hidden h-10 items-center gap-2.5 rounded-xl border border-border bg-secondary/50 px-1.5 pr-2.5 lg:inline-flex">
        <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded-lg bg-secondary">
          {user.image ? (
            <Image src={user.image} alt={user.name ?? ""} fill sizes="32px" className="object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-xs font-bold text-foreground">
              {user.name?.[0]?.toUpperCase()}
            </div>
          )}
        </div>

        <div className="hidden min-w-0 lg:block">
          <p className="max-w-[120px] truncate text-xs font-semibold leading-none text-foreground xl:max-w-[160px]">
            {user.name}
          </p>
          <p className="mt-0.5 max-w-[120px] truncate text-[10px] leading-none text-muted-foreground xl:max-w-[160px]">
            {user.email}
          </p>
        </div>

        <span
          className={cn(
            "hidden h-7 items-center gap-1 whitespace-nowrap rounded-lg px-2 text-[11px] font-semibold tracking-normal shadow-xs xl:inline-flex",
            ROLE_BADGE_STYLES[normalizedRole]
          )}
        >
          <RoleIcon className="h-3 w-3" />
          {getRoleLabel(normalizedRole, locale)}
        </span>
      </div>

      <button
        onClick={handleSignOut}
        title={t("common.signOut")}
        className="hidden h-10 items-center gap-1.5 rounded-xl border border-border bg-secondary/50 px-3 text-sm text-muted-foreground transition-colors hover:border-destructive/30 hover:bg-destructive/10 hover:text-destructive lg:inline-flex"
      >
        <LogOut className="h-4 w-4" />
        <span className="hidden xl:inline">{t("common.signOut")}</span>
      </button>
    </div>
  );
}
