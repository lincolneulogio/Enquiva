import Link from "next/link";
import { Search, X } from "lucide-react";
import { getRoleLabel } from "@/lib/i18n/core";
import { staffDashboardPath, type StaffDashboardBase } from "@/lib/navigation/dashboard-paths";

interface UserFilterBarProps {
  staffBase: StaffDashboardBase;
  searchQuery: string;
  selectedRole: string;
  locale: "en" | "es";
  isPlatformScope: boolean;
  roleLabel: string;
  filterLabel: string;
}

export function UserFilterBar({
  staffBase,
  searchQuery,
  selectedRole,
  locale,
  isPlatformScope,
  roleLabel,
  filterLabel,
}: UserFilterBarProps) {
  return (
    <div className="bg-card border border-border/60 rounded-3xl p-6 shadow-sm">
      <form
        method="GET"
        action={staffDashboardPath(staffBase, "/users")}
        className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end"
      >
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-muted-foreground block">
            {locale === "en" ? "Search" : "Buscar"}
          </label>
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60" />
            <input
              type="text"
              name="search"
              defaultValue={searchQuery}
              placeholder={locale === "en" ? "Name, email, phone..." : "Nombre, correo, teléfono..."}
              className="w-full rounded-xl border border-border bg-background pl-10 pr-4 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary h-10 transition-all text-foreground"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-muted-foreground block">
            {roleLabel}
          </label>
          <select
            name="role"
            defaultValue={selectedRole}
            className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary h-10 transition-all text-foreground cursor-pointer"
          >
            <option value="">{locale === "en" ? "All Roles" : "Todos los roles"}</option>
            <option value="member">{getRoleLabel("member", locale)}</option>
            <option value="organizer">{getRoleLabel("organizer", locale)}</option>
            {isPlatformScope && (
              <>
                <option value="admin">{getRoleLabel("admin", locale)}</option>
                <option value="super_admin">{getRoleLabel("super_admin", locale)}</option>
              </>
            )}
          </select>
        </div>

        <div className="flex gap-2 h-10">
          <button
            type="submit"
            className="flex-1 rounded-xl bg-primary hover:bg-primary/95 text-primary-foreground font-semibold px-4 text-sm transition duration-200 cursor-pointer h-full"
          >
            {filterLabel}
          </button>
          {(searchQuery || selectedRole) && (
            <Link
              href={staffDashboardPath(staffBase, "/users")}
              className="rounded-xl border border-border bg-background hover:bg-secondary px-3.5 text-sm font-semibold flex items-center justify-center text-foreground transition-all h-full"
            >
              <X className="h-4 w-4" />
            </Link>
          )}
        </div>
      </form>
    </div>
  );
}
