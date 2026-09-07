import { pgTable, text, timestamp, boolean, integer, uuid, index } from "drizzle-orm/pg-core";

/**
 * Secciones de contenido administrables por superadmin.
 * Permite páginas dinámicas (about, landing custom, etc.) con contenido bilingüe.
 */
export const pageSections = pgTable(
  "page_sections",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    pageKey: text("page_key").notNull().default("about"),
    kind: text("kind").notNull().default("section"),
    titleEs: text("title_es"),
    titleEn: text("title_en"),
    subtitleEs: text("subtitle_es"),
    subtitleEn: text("subtitle_en"),
    bodyEs: text("body_es"),
    bodyEn: text("body_en"),
    firstName: text("first_name"),
    lastName: text("last_name"),
    role: text("role"),
    imageUrl: text("image_url"),
    sortOrder: integer("sort_order").notNull().default(0),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [
    index("page_sections_page_key_idx").on(t.pageKey),
    index("page_sections_sort_order_idx").on(t.sortOrder),
  ],
);

export type PageSection = typeof pageSections.$inferSelect;
export type NewPageSection = typeof pageSections.$inferInsert;
