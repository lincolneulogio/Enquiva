import {
  pgTable,
  text,
  timestamp,
  boolean,
  integer,
  numeric,
  pgEnum,
  uuid,
  index,
  uniqueIndex,
  jsonb,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { users } from "./auth";
import { payments } from "./transport";

export const subscriptionStatusEnum = pgEnum("subscription_status", [
  "active",
  "cancelled",
  "past_due",
  "trialing",
]);

export const platformTransactionTypeEnum = pgEnum("platform_transaction_type", [
  "subscription",
  "commission",
  "adjustment",
]);

export const subscriptionPaymentStatusEnum = pgEnum("subscription_payment_status", [
  "pending",
  "approved",
  "rejected",
]);

export const plans = pgTable(
  "plans",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    slug: text("slug").notNull().unique(),
    name: text("name").notNull(),
    description: text("description"),
    priceMonthly: numeric("price_monthly", { precision: 10, scale: 2 }).notNull().default("0"),
    currency: text("currency").notNull().default("PEN"),
    maxActiveEvents: integer("max_active_events"),
    maxAttendeesPerEvent: integer("max_attendees_per_event"),
    commissionPercent: numeric("commission_percent", { precision: 5, scale: 2 })
      .notNull()
      .default("0"),
    maxBroadcastsPerMonth: integer("max_broadcasts_per_month"),
    maxOrganizers: integer("max_organizers"),
    featureCulqi: boolean("feature_culqi").notNull().default(false),
    featureTransport: boolean("feature_transport").notNull().default(false),
    featureAi: boolean("feature_ai").notNull().default(false),
    featureExports: boolean("feature_exports").notNull().default(false),
    featureCustomBranding: boolean("feature_custom_branding").notNull().default(false),
    isActive: boolean("is_active").notNull().default(true),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [index("plans_active_idx").on(t.isActive), index("plans_sort_idx").on(t.sortOrder)],
);

export const subscriptions = pgTable(
  "subscriptions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    planId: uuid("plan_id")
      .notNull()
      .references(() => plans.id, { onDelete: "restrict" }),
    status: subscriptionStatusEnum("status").notNull().default("active"),
    currentPeriodStart: timestamp("current_period_start").notNull().defaultNow(),
    currentPeriodEnd: timestamp("current_period_end").notNull(),
    cancelledAt: timestamp("cancelled_at"),
    culqiSubscriptionId: text("culqi_subscription_id"),
    autoRenewEnabled: boolean("auto_renew_enabled").notNull().default(false),
    culqiCustomerId: text("culqi_customer_id"),
    culqiCardId: text("culqi_card_id"),
    culqiCardLastFour: text("culqi_card_last_four"),
    culqiCardBrand: text("culqi_card_brand"),
    renewalReminderSentAt: timestamp("renewal_reminder_sent_at"),
    autoRenewLastAttemptAt: timestamp("auto_renew_last_attempt_at"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("subscriptions_user_unique_idx").on(t.userId),
    index("subscriptions_plan_idx").on(t.planId),
    index("subscriptions_status_idx").on(t.status),
  ],
);

export const subscriptionPayments = pgTable(
  "subscription_payments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    planId: uuid("plan_id")
      .notNull()
      .references(() => plans.id, { onDelete: "restrict" }),
    amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
    currency: text("currency").notNull().default("PEN"),
    method: text("method").notNull(),
    reference: text("reference"),
    receiptUrl: text("receipt_url"),
    receiptFileName: text("receipt_file_name"),
    status: subscriptionPaymentStatusEnum("status").notNull().default("pending"),
    gatewayProvider: text("gateway_provider"),
    gatewayChargeId: text("gateway_charge_id"),
    notes: text("notes"),
    verifiedBy: text("verified_by").references(() => users.id),
    verifiedAt: timestamp("verified_at"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [
    index("subscription_payments_user_idx").on(t.userId),
    index("subscription_payments_status_idx").on(t.status),
    index("subscription_payments_plan_idx").on(t.planId),
    uniqueIndex("subscription_payments_gateway_charge_unique_idx").on(t.gatewayChargeId),
  ],
);

export const platformTransactions = pgTable(
  "platform_transactions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    type: platformTransactionTypeEnum("type").notNull(),
    amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
    currency: text("currency").notNull().default("PEN"),
    userId: text("user_id").references(() => users.id, { onDelete: "set null" }),
    paymentId: uuid("payment_id").references(() => payments.id, { onDelete: "set null" }),
    subscriptionId: uuid("subscription_id").references(() => subscriptions.id, {
      onDelete: "set null",
    }),
    subscriptionPaymentId: uuid("subscription_payment_id").references(() => subscriptionPayments.id, {
      onDelete: "set null",
    }),
    description: text("description"),
    metadata: jsonb("metadata"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [
    index("platform_transactions_type_idx").on(t.type),
    index("platform_transactions_user_idx").on(t.userId),
    index("platform_transactions_created_idx").on(t.createdAt),
    index("platform_transactions_subscription_payment_idx").on(t.subscriptionPaymentId),
  ],
);

export const plansRelations = relations(plans, ({ many }) => ({
  subscriptions: many(subscriptions),
  subscriptionPayments: many(subscriptionPayments),
}));

export const subscriptionPaymentsRelations = relations(subscriptionPayments, ({ one, many }) => ({
  user: one(users, { fields: [subscriptionPayments.userId], references: [users.id] }),
  plan: one(plans, { fields: [subscriptionPayments.planId], references: [plans.id] }),
  ledgerEntries: many(platformTransactions),
}));

export const platformTransactionsRelations = relations(platformTransactions, ({ one }) => ({
  subscriptionPayment: one(subscriptionPayments, {
    fields: [platformTransactions.subscriptionPaymentId],
    references: [subscriptionPayments.id],
  }),
  subscription: one(subscriptions, {
    fields: [platformTransactions.subscriptionId],
    references: [subscriptions.id],
  }),
}));

export const subscriptionsRelations = relations(subscriptions, ({ one }) => ({
  user: one(users, { fields: [subscriptions.userId], references: [users.id] }),
  plan: one(plans, { fields: [subscriptions.planId], references: [plans.id] }),
}));

export type Plan = typeof plans.$inferSelect;
export type NewPlan = typeof plans.$inferInsert;
export type Subscription = typeof subscriptions.$inferSelect;
export type PlatformTransaction = typeof platformTransactions.$inferSelect;
export type SubscriptionPayment = typeof subscriptionPayments.$inferSelect;
