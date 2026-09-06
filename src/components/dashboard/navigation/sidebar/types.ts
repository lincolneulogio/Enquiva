import type { ComponentType } from "react";
import type { Permission } from "@/lib/auth/rbac";

export interface NavItem {
  labelKey: string;
  href: string;
  icon: ComponentType<{ className?: string }>;
  /** Si se define, el ítem solo aparece si el rol tiene al menos uno de estos permisos efectivos. */
  permissions?: readonly Permission[];
}

export interface NavSection {
  titleKey?: string;
  items: NavItem[];
}

export type OrganizerNavOptions = {
  showBroadcasts: boolean;
  showTransport: boolean;
  showExports: boolean;
};

export type AdminNavOptions = {
  variant: "super_admin" | "entity_admin" | "entity_admin_unassigned";
  showEntityTeam?: boolean;
  basePath?: "/admin" | "/superadmin";
};

export interface SidebarUser {
  id?: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  role?: string | null;
}

export interface DashboardSidebarProps {
  role: string;
  user: SidebarUser;
  /** Solo organizador: oculta ítems según plan (Comunicados, Transporte, Culqi, Exportaciones) */
  organizerNav?: OrganizerNavOptions;
  /** Solo panel admin: diferencia super_admin vs admin de entidad */
  adminNav?: AdminNavOptions;
  /**
   * Permisos efectivos del rol (defaults + overrides).
   * Si se omite, no se filtra por matriz.
   */
  allowedPermissions?: readonly Permission[];
}
