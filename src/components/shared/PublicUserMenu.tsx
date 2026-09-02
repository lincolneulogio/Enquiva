"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  ChevronDown,
  LayoutDashboard,
  Ticket,
  Calendar,
  Settings,
  LogOut,
  Crown,
  ShieldCheck,
  Briefcase,
  UserRound,
  QrCode,
  type LucideIcon,
} from "lucide-react";
import { signOut } from "@/lib/auth/client";
import { cn } from "@/lib/utils";
import { useLocale, useTranslations } from "@/components/providers/LocaleProvider";
import { getRoleLabel } from "@/lib/i18n/core";
import { ROLE_BADGE_STYLES, normalizeRole, type AppRole } from "@/lib/auth/rbac";

interface PublicUserMenuProps {
  user: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
    role?: string | null;
  };
  dashboardPath: string;
  dashboardLabel: string;
}

const ROLE_ICONS: Record<AppRole, LucideIcon> = {
  super_admin: Crown,
  admin: ShieldCheck,
  organizer: Briefcase,
  member: UserRound,
  scanner: QrCode,
};

function getSettingsPath(role: AppRole): string {
  if (role === "super_admin") return "/superadmin/settings";
  if (role === "admin") return "/admin/settings";
  if (role === "organizer") return "/organizer/settings";
  if (role === "scanner") return "/scanner";
  return "/member/profile";
}

export function PublicUserMenu({
  user,
  dashboardPath,
  dashboardLabel,
}: PublicUserMenuProps) {
  const router = useRouter();
  const t = useTranslations();
  const { locale } = useLocale();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  const normalizedRole = normalizeRole(user.role);
  const RoleIcon = ROLE_ICONS[normalizedRole] ?? UserRound;
  const roleLabel = getRoleLabel(normalizedRole, locale);
  const settingsPath = getSettingsPath(normalizedRole);

  const initials = user.name
    ? user.name
        .split(" ")
        .filter(Boolean)
        .map((n) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "U";

  const handleSignOut = async () => {
    setIsOpen(false);
    await signOut({
      fetchOptions: {
        onSuccess: () => {
          router.push("/login");
          router.refresh();
        },
      },
    });
  };

  useEffect(() => {
    if (!isOpen) return;

    const handleOutsideClick = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen]);

  return (
    <div ref={menuRef} className="relative shrink-0">
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        aria-haspopup="menu"
        className={cn(
          "inline-flex h-10 items-center gap-2 rounded-xl border border-border bg-card/60 p-1 pl-1.5 pr-2.5 shadow-sm backdrop-blur-sm transition-all duration-200 hover:border-primary/30 hover:bg-card/90 hover:shadow-md",
          isOpen && "border-primary/40 bg-card ring-2 ring-primary/10",
        )}
      >
        <div className="relative flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-primary/20 bg-primary/10 text-xs font-bold text-primary select-none">
          {user.image ? (
            <Image
              src={user.image}
              alt={user.name ?? "Usuario"}
              fill
              sizes="32px"
              className="object-cover"
            />
          ) : (
            <span>{initials}</span>
          )}
        </div>

        <div className="hidden min-w-0 flex-col justify-center text-left lg:flex">
          <span className="max-w-[120px] truncate text-xs font-semibold leading-tight text-foreground xl:max-w-[160px]">
            {user.name ?? user.email}
          </span>
          <span className="max-w-[120px] truncate text-[10px] leading-tight text-muted-foreground xl:max-w-[160px]">
            {roleLabel}
          </span>
        </div>

        <ChevronDown
          className={cn(
            "h-3.5 w-3.5 text-muted-foreground transition-transform duration-200",
            isOpen && "rotate-180 text-foreground",
          )}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          role="menu"
          aria-orientation="vertical"
          className="absolute right-0 top-[calc(100%+0.5rem)] z-50 w-64 origin-top-right overflow-hidden rounded-2xl border border-border bg-card/95 p-1.5 shadow-2xl backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150"
        >
          {/* User Info Header */}
          <div className="rounded-xl bg-secondary/40 p-3 mb-1">
            <div className="flex items-center gap-2.5">
              <div className="relative flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-primary/20 bg-primary/15 text-xs font-bold text-primary">
                {user.image ? (
                  <Image
                    src={user.image}
                    alt={user.name ?? "Usuario"}
                    fill
                    sizes="36px"
                    className="object-cover"
                  />
                ) : (
                  <span>{initials}</span>
                )}
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

            <div className="mt-2.5 flex items-center">
              <span
                className={cn(
                  "inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-semibold tracking-wide shadow-xs",
                  ROLE_BADGE_STYLES[normalizedRole],
                )}
              >
                <RoleIcon className="h-3 w-3" />
                {roleLabel}
              </span>
            </div>
          </div>

          {/* Nav Links inside dropdown */}
          <div className="flex flex-col gap-0.5 py-1">
            <Link
              href={dashboardPath}
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium text-foreground transition-colors hover:bg-secondary"
            >
              <LayoutDashboard className="h-4 w-4 text-primary" />
              <span>{dashboardLabel}</span>
            </Link>

            {normalizedRole === "member" ? (
              <Link
                href="/member/tickets"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium text-foreground transition-colors hover:bg-secondary"
              >
                <Ticket className="h-4 w-4 text-muted-foreground" />
                <span>{t("dashboard.member.ticketsTitle")}</span>
              </Link>
            ) : null}

            {normalizedRole === "organizer" ? (
              <Link
                href="/organizer/events"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium text-foreground transition-colors hover:bg-secondary"
              >
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span>{locale === "en" ? "My events" : "Mis eventos"}</span>
              </Link>
            ) : null}

            <Link
              href={settingsPath}
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium text-foreground transition-colors hover:bg-secondary"
            >
              <Settings className="h-4 w-4 text-muted-foreground" />
              <span>{locale === "en" ? "Profile & Settings" : "Perfil y Ajustes"}</span>
            </Link>
          </div>

          <div className="my-1 h-px bg-border/60" />

          {/* Sign Out Button */}
          <button
            type="button"
            onClick={handleSignOut}
            className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
          >
            <LogOut className="h-4 w-4" />
            <span>{t("common.signOut")}</span>
          </button>
        </div>
      )}
    </div>
  );
}
