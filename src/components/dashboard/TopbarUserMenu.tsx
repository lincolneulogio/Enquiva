"use client";

import { useRouter } from "next/navigation";
import { LogOut, Crown, ShieldCheck, Briefcase, UserRound } from "lucide-react";
import Image from "next/image";
import { signOut } from "@/lib/auth/client";
import { cn } from "@/lib/utils";
import { ROLE_BADGE_STYLES, ROLE_LABELS, normalizeRole } from "@/lib/rbac";

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
    await signOut({ fetchOptions: { onSuccess: () => router.push("/login") } });
  };

  return (
    <div className="flex items-center gap-2">
      {/* User info: avatar + nombre + rol */}
      <div className="flex items-center gap-3 rounded-xl border border-border bg-secondary/50 px-3 py-1.5">
        {/* Avatar */}
        <div className="relative h-7 w-7 overflow-hidden rounded-full bg-secondary shrink-0">
          {user.image ? (
            <Image src={user.image} alt={user.name ?? ""} fill className="object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-xs font-semibold text-foreground/70">
              {user.name?.[0]?.toUpperCase()}
            </div>
          )}
        </div>

        {/* Nombre y rol */}
        <div className="hidden sm:block">
          <p className="text-sm font-medium leading-none text-foreground">{user.name}</p>
          <p className="mt-0.5 text-xs text-muted-foreground truncate max-w-[120px]">{user.email}</p>
        </div>

        {/* Badge de rol */}
        <span
          className={cn(
            "hidden sm:inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-semibold tracking-normal shadow-sm",
            ROLE_BADGE_STYLES[normalizedRole]
          )}
        >
          <RoleIcon className="h-3 w-3" />
          {ROLE_LABELS[normalizedRole]}
        </span>
      </div>

      {/* Botón cerrar sesión */}
      <button
        onClick={handleSignOut}
        title="Sign out"
        className="flex items-center gap-1.5 rounded-xl border border-border bg-secondary/50 px-3 py-2 text-sm text-muted-foreground hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30 transition-colors"
      >
        <LogOut className="h-4 w-4" />
        <span className="hidden md:block">Sign Out</span>
      </button>
    </div>
  );
}
