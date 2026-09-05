import { pgTable, text, timestamp, boolean, pgEnum, uuid, uniqueIndex, index, integer, type AnyPgColumn } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { organizations } from "./organizations";

export const roleEnum = pgEnum("role", [
  "super_admin",
  "admin",
  "organizer",
  "member",
  "scanner",
]);

export const users = pgTable("users", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  phone: text("phone"),
  address: text("address"),
  emailVerified: boolean("email_verified").notNull().default(false),
  image: text("image"),
  signatureUrl: text("signature_url"),
  signatureTitle: text("signature_title"),
  role: roleEnum("role").notNull().default("member"),
  organizationId: uuid("organization_id").references(
    (): AnyPgColumn => organizations.id,
    { onDelete: "set null" },
  ),
  bio: text("bio"),
  isActive: boolean("is_active").notNull().default(true),
  twoFactorEnabled: boolean("two_factor_enabled").notNull().default(false),
  lastSeenAt: timestamp("last_seen_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (t) => [
  index("users_organization_idx").on(t.organizationId),
  index("users_role_idx").on(t.role),
]);

/** Better Auth two-factor plugin storage. */
export const twoFactor = pgTable("two_factor", {
  id: text("id").primaryKey(),
  secret: text("secret").notNull(),
  backupCodes: text("backup_codes").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  verified: boolean("verified").default(true),
  failedVerificationCount: integer("failed_verification_count").default(0),
  lockedUntil: timestamp("locked_until"),
});

export const sessions = pgTable("sessions", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expires_at").notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
});

export const accounts = pgTable("accounts", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at"),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
  scope: text("scope"),
  password: text("password"),
  issuer: text("issuer"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const verifications = pgTable("verifications", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const roles = pgTable("roles", {
  name: text("name").primaryKey(),
  label: text("label").notNull(),
  description: text("description").notNull(),
  color: text("color").notNull().default("gray"),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const rolePermissions = pgTable("role_permissions", {
  id: uuid("id").primaryKey().defaultRandom(),
  roleName: text("role_name")
    .notNull()
    .references(() => roles.name, { onDelete: "cascade" }),
  permission: text("permission").notNull(),
  allowed: boolean("allowed").notNull().default(true),
  updatedBy: text("updated_by").references(() => users.id),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (t) => [
  uniqueIndex("role_permissions_role_permission_unique_idx").on(t.roleName, t.permission),
  index("role_permissions_role_idx").on(t.roleName),
]);

export const usersRelations = relations(users, ({ many }) => ({
  sessions: many(sessions),
  accounts: many(accounts),
}));

export const rolePermissionsRelations = relations(rolePermissions, ({ one }) => ({
  role: one(roles, { fields: [rolePermissions.roleName], references: [roles.name] }),
  updater: one(users, { fields: [rolePermissions.updatedBy], references: [users.id] }),
}));

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Role = typeof roles.$inferSelect;
export type RolePermission = typeof rolePermissions.$inferSelect;
export type NewRolePermission = typeof rolePermissions.$inferInsert;
