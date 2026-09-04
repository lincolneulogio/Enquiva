import { pgTable, text, timestamp, boolean, integer, numeric, doublePrecision, pgEnum, uuid, index, uniqueIndex, jsonb } from "drizzle-orm/pg-core";
import { relations, sql } from "drizzle-orm";
import { users } from "./auth";
import { organizations } from "./organizations";
import type { EventScheduleSlot } from "@/lib/validations/event";

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
    organizationId: uuid("organization_id").references(() => organizations.id, {
      onDelete: "set null",
    }),
    title: text("title").notNull(),
    slug: text("slug").notNull().unique(),
    description: text("description").notNull(),
    coverImage: text("cover_image"),
    category: text("category").notNull().default("other"),
    schedules: jsonb("schedules").$type<EventScheduleSlot[]>(),
    date: timestamp("date").notNull(),
    endDate: timestamp("end_date"),
    location: text("location"),
    locationUrl: text("location_url"),
    latitude: doublePrecision("latitude"),
    longitude: doublePrecision("longitude"),
    isVirtual: boolean("is_virtual").notNull().default(false),
    virtualLink: text("virtual_link"),
    capacity: integer("capacity"),
    status: eventStatusEnum("status").notNull().default("draft"),
    isFeatured: boolean("is_featured").notNull().default(false),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    price: numeric("price", { precision: 10, scale: 2 }),
    hasTransport: boolean("has_transport").notNull().default(false),
    /** Minutos de reserva de cupo tras registrarse (pago con tarjeta/Culqi). */
    holdMinutesCard: integer("hold_minutes_card").notNull().default(30),
    /** Horas de reserva si elige efectivo u otro método manual/legacy. */
    holdHoursManual: integer("hold_hours_manual").notNull().default(24),
    /** Ventana previa al evento (horas) en la que el hold se acorta. */
    nearEventWindowHours: integer("near_event_window_hours").notNull().default(48),
    /** Minutos de hold dentro de la ventana cercana al evento. */
    nearEventHoldMinutes: integer("near_event_hold_minutes").notNull().default(15),
    /** Cierra ventas N horas antes del inicio (null = hasta el inicio). */
    salesCutoffHoursBefore: integer("sales_cutoff_hours_before"),
    viewCount: integer("view_count").notNull().default(0),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [
    index("events_organizer_idx").on(t.organizerId),
    index("events_organization_idx").on(t.organizationId),
    index("events_status_idx").on(t.status),
    index("events_date_idx").on(t.date),
    index("events_category_idx").on(t.category),
    index("events_status_date_idx").on(t.status, t.date),
    index("events_featured_status_date_idx").on(t.isFeatured, t.status, t.date),
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

export const categories = pgTable(
  "categories",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id").references(() => organizations.id, {
      onDelete: "cascade",
    }),
    slug: text("slug").notNull(),
    label: text("label").notNull(),
    description: text("description"),
    colorClass: text("color_class").notNull().default("bg-gray-100 text-gray-800"),
    isActive: boolean("is_active").notNull().default(true),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
    createdBy: text("created_by").references(() => users.id),
  },
  (t) => [
    index("categories_organization_idx").on(t.organizationId),
    uniqueIndex("categories_org_slug_unique_idx")
      .on(t.organizationId, t.slug)
      .where(sql`${t.organizationId} IS NOT NULL`),
    uniqueIndex("categories_platform_slug_unique_idx")
      .on(t.slug)
      .where(sql`${t.organizationId} IS NULL`),
  ],
);

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
