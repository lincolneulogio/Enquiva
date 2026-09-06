import { db } from "@/lib/db";
import { sql } from "drizzle-orm";

async function hasColumn(table: string, column: string): Promise<boolean> {
  const rows = await db.execute(sql`
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = ${table} and column_name = ${column}
    limit 1
  `);
  return rows.length > 0;
}

async function hasConstraint(name: string): Promise<boolean> {
  const rows = await db.execute(sql`
    select 1 from pg_constraint where conname = ${name} limit 1
  `);
  return rows.length > 0;
}

async function hasTable(table: string): Promise<boolean> {
  const rows = await db.execute(sql`
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = ${table}
    limit 1
  `);
  return rows.length > 0;
}

async function main() {
  // ── 0030 (parcial; event_types ya existía vía db:push) ─────────────
  if (!(await hasColumn("events", "event_type_id"))) {
    await db.execute(sql`ALTER TABLE "events" ADD COLUMN "event_type_id" uuid`);
    console.log("ADDED events.event_type_id");
  } else {
    console.log("SKIP events.event_type_id (exists)");
  }

  if (!(await hasConstraint("events_event_type_id_event_types_id_fk"))) {
    await db.execute(sql`
      ALTER TABLE "events"
        ADD CONSTRAINT "events_event_type_id_event_types_id_fk"
        FOREIGN KEY ("event_type_id") REFERENCES "public"."event_types"("id") ON DELETE set null
    `);
    console.log("ADDED events.event_type_id FK");
  } else {
    console.log("SKIP events.event_type_id FK (exists)");
  }

  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS "events_event_type_idx" ON "events" ("event_type_id")
  `);
  console.log("OK events_event_type_idx");

  // ── 0031 ───────────────────────────────────────────────────────────
  if (!(await hasColumn("categories", "label_en"))) {
    await db.execute(sql`ALTER TABLE "categories" ADD COLUMN "label_en" text`);
    console.log("ADDED categories.label_en");
  } else {
    console.log("SKIP categories.label_en (exists)");
  }

  if (!(await hasColumn("event_types", "label_en"))) {
    await db.execute(sql`ALTER TABLE "event_types" ADD COLUMN "label_en" text`);
    console.log("ADDED event_types.label_en");
  } else {
    console.log("SKIP event_types.label_en (exists)");
  }

  if (!(await hasTable("category_slug_aliases"))) {
    await db.execute(sql`
      CREATE TABLE "category_slug_aliases" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "category_id" uuid NOT NULL REFERENCES "categories"("id") ON DELETE CASCADE,
        "slug" text NOT NULL,
        "created_at" timestamp NOT NULL DEFAULT now()
      )
    `);
    await db.execute(sql`
      CREATE UNIQUE INDEX "category_slug_aliases_slug_unique_idx" ON "category_slug_aliases" ("slug")
    `);
    await db.execute(sql`
      CREATE INDEX "category_slug_aliases_category_idx" ON "category_slug_aliases" ("category_id")
    `);
    console.log("CREATED category_slug_aliases");
  } else {
    console.log("SKIP category_slug_aliases (exists)");
  }

  if (!(await hasTable("event_type_slug_aliases"))) {
    await db.execute(sql`
      CREATE TABLE "event_type_slug_aliases" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "event_type_id" uuid NOT NULL REFERENCES "event_types"("id") ON DELETE CASCADE,
        "category_slug" text NOT NULL,
        "slug" text NOT NULL,
        "created_at" timestamp NOT NULL DEFAULT now()
      )
    `);
    await db.execute(sql`
      CREATE UNIQUE INDEX "event_type_slug_aliases_cat_slug_unique_idx"
        ON "event_type_slug_aliases" ("category_slug", "slug")
    `);
    await db.execute(sql`
      CREATE INDEX "event_type_slug_aliases_type_idx" ON "event_type_slug_aliases" ("event_type_id")
    `);
    console.log("CREATED event_type_slug_aliases");
  } else {
    console.log("SKIP event_type_slug_aliases (exists)");
  }

  const cols = await db.execute(sql`
    select column_name from information_schema.columns
    where table_schema = 'public' and table_name = 'events'
      and column_name in ('category', 'event_type_id')
    order by column_name
  `);
  console.log("EVENTS_COLS:", JSON.stringify(cols));

  await backfillCategoryLabelEn();
  console.log("DONE");
}

async function backfillCategoryLabelEn() {
  const { EVENT_CATEGORIES } = await import("@/lib/events/taxonomy");
  const bySlug = new Map(EVENT_CATEGORIES.map((c) => [c.slug, c.labelEn]));
  const rows = await db.execute(sql`
    select id, slug from categories
    where organization_id is null and (label_en is null or label_en = '')
  `);
  let updated = 0;
  for (const row of rows as unknown as Array<{ id: string; slug: string }>) {
    const labelEn = bySlug.get(row.slug);
    if (!labelEn) continue;
    await db.execute(sql`update categories set label_en = ${labelEn} where id = ${row.id}`);
    updated += 1;
  }
  console.log("BACKFILL_CATEGORY_LABEL_EN:", updated);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("APPLY_ERROR:", err?.message ?? err);
    process.exit(1);
  });