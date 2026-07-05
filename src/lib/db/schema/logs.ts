import { pgTable, text, timestamp, uuid, index, pgEnum, integer, jsonb } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { users } from "./auth";

export const activityLogs = pgTable("activity_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  actorId: text("actor_id").references(() => users.id, { onDelete: "set null" }),
  actorName: text("actor_name").notNull(),
  action: text("action").notNull(), // e.g. "user.role_change", "payment.status_update", "event.delete"
  entityType: text("entity_type").notNull(), // e.g. "user", "payment", "event"
  entityId: text("entity_id").notNull(),
  details: text("details"),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => [
  index("activity_logs_actor_idx").on(t.actorId),
  index("activity_logs_action_idx").on(t.action),
]);

export const broadcastJobStatusEnum = pgEnum("broadcast_job_status", [
  "pending",
  "processing",
  "completed",
  "failed",
]);

export const broadcastLogs = pgTable("broadcast_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  eventId: uuid("event_id").notNull(),
  senderId: text("sender_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  subject: text("subject").notNull(),
  message: text("message").notNull(),
  recipientCount: text("recipient_count").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => [
  index("broadcast_logs_event_idx").on(t.eventId),
]);

export const broadcastJobs = pgTable(
  "broadcast_jobs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    eventId: uuid("event_id").notNull(),
    senderId: text("sender_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    subject: text("subject").notNull(),
    message: text("message").notNull(),
    recipientStatus: text("recipient_status").notNull(),
    channels: jsonb("channels").notNull().$type<{
      email: boolean;
      inApp: boolean;
      pusher: boolean;
      push?: boolean;
    }>(),
    locale: text("locale").notNull().default("es"),
    status: broadcastJobStatusEnum("status").notNull().default("pending"),
    totalRecipients: integer("total_recipients").notNull().default(0),
    successCount: integer("success_count").notNull().default(0),
    failureCount: integer("failure_count").notNull().default(0),
    errorMessage: text("error_message"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    startedAt: timestamp("started_at"),
    completedAt: timestamp("completed_at"),
  },
  (t) => [
    index("broadcast_jobs_status_idx").on(t.status),
    index("broadcast_jobs_sender_idx").on(t.senderId),
  ],
);

export const broadcastJobsRelations = relations(broadcastJobs, ({ one }) => ({
  sender: one(users, { fields: [broadcastJobs.senderId], references: [users.id] }),
}));

export const activityLogsRelations = relations(activityLogs, ({ one }) => ({
  actor: one(users, { fields: [activityLogs.actorId], references: [users.id] }),
}));

export const broadcastLogsRelations = relations(broadcastLogs, ({ one }) => ({
  sender: one(users, { fields: [broadcastLogs.senderId], references: [users.id] }),
}));

export const pushSubscriptions = pgTable("push_subscriptions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  endpoint: text("endpoint").notNull().unique(),
  p256dh: text("p256dh").notNull(),
  auth: text("auth").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => [
  index("push_subscriptions_user_idx").on(t.userId),
]);

export const pushSubscriptionsRelations = relations(pushSubscriptions, ({ one }) => ({
  user: one(users, { fields: [pushSubscriptions.userId], references: [users.id] }),
}));

export type PushSubscription = typeof pushSubscriptions.$inferSelect;
export type NewPushSubscription = typeof pushSubscriptions.$inferInsert;
