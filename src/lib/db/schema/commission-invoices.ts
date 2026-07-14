import {
  pgTable,
  text,
  timestamp,
  uuid,
  numeric,
  index,
} from "drizzle-orm/pg-core";
import { users } from "./auth";
import { organizations } from "./organizations";

export const commissionInvoices = pgTable(
  "commission_invoices",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizerId: text("organizer_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    organizationId: uuid("organization_id").references(() => organizations.id, {
      onDelete: "set null",
    }),
    amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
    currency: text("currency").notNull().default("PEN"),
    status: text("status").notNull().default("draft"),
    periodStart: timestamp("period_start"),
    periodEnd: timestamp("period_end"),
    notes: text("notes"),
    issuedAt: timestamp("issued_at"),
    paidAt: timestamp("paid_at"),
    createdBy: text("created_by"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [
    index("commission_invoices_organizer_idx").on(t.organizerId),
    index("commission_invoices_status_idx").on(t.status),
  ],
);

export type CommissionInvoice = typeof commissionInvoices.$inferSelect;
