"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut, Crown, ShieldCheck, Briefcase, UserRound } from "lucide-react";
import Image from "next/image";
import { signOut } from "@/lib/auth/client";
import { cn } from "@/lib/utils";
import { useTranslations, useLocale } from "@/components/providers/LocaleProvider";
import { getRoleLabel } from "@/lib/i18n/core";
import { ROLE_BADGE_STYLES, normalizeRole } from "@/lib/auth/rbac";

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
  const { locale } = useLocale();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
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

  return (
    <div ref={menuRef} className="relative flex shrink-0 items-center gap-2">
      <button
        type="button"
        onClick={() => setIsMobileMenuOpen((prev) => !prev)}
        title={user.name ?? "User"}
        className="inline-flex h-10 items-center gap-2 rounded-xl border border-border bg-secondary/50 px-1.5 md:hidden"
      >
        <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded-lg bg-secondary">
          {user.image ? (
            <Image src={user.image} alt={user.name ?? ""} fill sizes="32px" className="object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-xs font-semibold text-foreground/70">
              {user.name?.[0]?.toUpperCase()}
            </div>
          )}
        </div>
      </button>

      {isMobileMenuOpen && (
        <div className="absolute right-0 top-full z-50 mt-2 w-64 rounded-xl border border-border bg-background p-2 shadow-xl md:hidden">
          <div className="mb-2 rounded-lg bg-secondary/40 px-3 py-2">
            <p className="truncate text-sm font-medium text-foreground">{user.name}</p>
            <p className="mt-0.5 truncate text-xs text-muted-foreground">{user.email}</p>
          </div>

          <button
            onClick={handleSignOut}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
          >
            <LogOut className="h-4 w-4" />
            {t("common.signOut")}
          </button>
        </div>
      )}

      {/* User info: avatar + nombre + rol */}
      <div className="hidden h-10 items-center gap-2.5 rounded-xl border border-border bg-secondary/50 px-1.5 pr-2 md:inline-flex">
        <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded-lg bg-secondary">
          {user.image ? (
            <Image src={user.image} alt={user.name ?? ""} fill sizes="32px" className="object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-xs font-semibold text-foreground/70">
              {user.name?.[0]?.toUpperCase()}
            </div>
          )}
        </div>

        <div className="hidden min-w-0 md:block">
          <p className="max-w-[100px] truncate text-xs font-semibold leading-none text-foreground lg:max-w-[150px]">
            {user.name}
          </p>
          <p className="mt-0.5 max-w-[100px] truncate text-[10px] leading-none text-muted-foreground lg:max-w-[150px]">
            {user.email}
          </p>
        </div>

        <span
          className={cn(
            "hidden h-8 items-center gap-1 whitespace-nowrap rounded-lg px-2.5 text-[11px] font-semibold tracking-normal shadow-sm lg:inline-flex",
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
        className="hidden h-10 items-center gap-1.5 rounded-xl border border-border bg-secondary/50 px-3 text-sm text-muted-foreground transition-colors hover:border-destructive/30 hover:bg-destructive/10 hover:text-destructive md:inline-flex"
      >
        <LogOut className="h-4 w-4" />
        <span className="hidden lg:inline">{t("common.signOut")}</span>
      </button>
    </div>
  );
}
