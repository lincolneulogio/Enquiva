import { pgTable, text, timestamp, boolean, integer, numeric, pgEnum, uuid, index } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { users } from "./auth";
import { organizations } from "./organizations";

export const eventStatusEnum = pgEnum("event_status", [
  "draft",
  "published",
  "cancelled",
  "completed",
]);

export const events = pgTable(
  "events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizerId: text("organizer_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    organizationId: uuid("organization_id"),
    title: text("title").notNull(),
    slug: text("slug").notNull().unique(),
    description: text("description").notNull(),
    coverImage: text("cover_image"),
    category: text("category").notNull().default("other"),
    date: timestamp("date").notNull(),
    endDate: timestamp("end_date"),
    location: text("location"),
    locationUrl: text("location_url"),
    isVirtual: boolean("is_virtual").notNull().default(false),
    virtualLink: text("virtual_link"),
    capacity: integer("capacity"),
    status: eventStatusEnum("status").notNull().default("draft"),
    isFeatured: boolean("is_featured").notNull().default(false),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    price: numeric("price", { precision: 10, scale: 2 }),
    hasTransport: boolean("has_transport").notNull().default(false),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [
    index("events_organizer_idx").on(t.organizerId),
    index("events_organization_idx").on(t.organizationId),
    index("events_status_idx").on(t.status),
    index("events_date_idx").on(t.date),
    index("events_category_idx").on(t.category),
  ]
);

export const eventAttachments = pgTable("event_attachments", {
  id: uuid("id").primaryKey().defaultRandom(),
  eventId: uuid("event_id")
    .notNull()
    .references(() => events.id, { onDelete: "cascade" }),
  fileUrl: text("file_url").notNull(),
  fileName: text("file_name").notNull(),
  fileType: text("file_type").notNull(),
  fileSize: integer("file_size"),
  uploadedAt: timestamp("uploaded_at").notNull().defaultNow(),
});

export const categories = pgTable("categories", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id").references(() => organizations.id, { onDelete: "cascade" }),
  slug: text("slug").notNull(),
  label: text("label").notNull(),
  description: text("description"),
  colorClass: text("color_class").notNull().default("bg-gray-100 text-gray-800"),
  isActive: boolean("is_active").notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  createdBy: text("created_by").references(() => users.id),
}, (t) => [
  index("categories_organization_idx").on(t.organizationId),
]);

export const eventsRelations = relations(events, ({ one, many }) => ({
  organizer: one(users, { fields: [events.organizerId], references: [users.id] }),
  attachments: many(eventAttachments),
}));

export const eventAttachmentsRelations = relations(eventAttachments, ({ one }) => ({
  event: one(events, { fields: [eventAttachments.eventId], references: [events.id] }),
}));

export type Event = typeof events.$inferSelect;
export type NewEvent = typeof events.$inferInsert;
export type EventAttachment = typeof eventAttachments.$inferSelect;
export type Category = typeof categories.$inferSelect;
