import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL);

const DEFAULT_CATEGORIES = [
  {
    slug: "worship",
    label: "Worship",
    description: "Praise and worship services",
    colorClass: "bg-violet-100 text-violet-800",
    sortOrder: 1,
  },
  {
    slug: "retreat",
    label: "Retreat",
    description: "Spiritual retreat and renewal",
    colorClass: "bg-green-100 text-green-800",
    sortOrder: 2,
  },
  {
    slug: "youth",
    label: "Youth",
    description: "Programs and activities for young members",
    colorClass: "bg-orange-100 text-orange-800",
    sortOrder: 3,
  },
  {
    slug: "charity",
    label: "Charity",
    description: "Community service and fundraising events",
    colorClass: "bg-pink-100 text-pink-800",
    sortOrder: 4,
  },
  {
    slug: "conference",
    label: "Conference",
    description: "Conferences, seminars, and teaching series",
    colorClass: "bg-blue-100 text-blue-800",
    sortOrder: 5,
  },
  {
    slug: "prayer",
    label: "Prayer",
    description: "Prayer meetings and intercession gatherings",
    colorClass: "bg-amber-100 text-amber-800",
    sortOrder: 6,
  },
  {
    slug: "bible_study",
    label: "Bible Study",
    description: "Guided scripture study and discussion groups",
    colorClass: "bg-teal-100 text-teal-800",
    sortOrder: 7,
  },
  {
    slug: "outreach",
    label: "Outreach",
    description: "Evangelism and community outreach activities",
    colorClass: "bg-red-100 text-red-800",
    sortOrder: 8,
  },
  {
    slug: "fellowship",
    label: "Fellowship",
    description: "Social gatherings and community building",
    colorClass: "bg-indigo-100 text-indigo-800",
    sortOrder: 9,
  },
  {
    slug: "other",
    label: "Other",
    description: "Other types of faith community events",
    colorClass: "bg-gray-100 text-gray-800",
    sortOrder: 10,
  },
];

async function run() {
  console.log("🔧 Setting up categories table...");

  // 1. Create categories table
  await sql`
    CREATE TABLE IF NOT EXISTS categories (
      id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
      slug       text        NOT NULL UNIQUE,
      label      text        NOT NULL,
      description text,
      color_class text       NOT NULL DEFAULT 'bg-gray-100 text-gray-800',
      is_active  boolean     NOT NULL DEFAULT true,
      sort_order integer     NOT NULL DEFAULT 0,
      created_at timestamp   NOT NULL DEFAULT now(),
      updated_at timestamp   NOT NULL DEFAULT now(),
      created_by text        REFERENCES users(id)
    )
  `;
  console.log("  ✓ categories table ready");

  // 2. Seed default categories
  for (const cat of DEFAULT_CATEGORIES) {
    await sql`
      INSERT INTO categories (slug, label, description, color_class, sort_order)
      VALUES (${cat.slug}, ${cat.label}, ${cat.description}, ${cat.colorClass}, ${cat.sortOrder})
      ON CONFLICT (slug) DO UPDATE SET
        label      = EXCLUDED.label,
        description = EXCLUDED.description,
        color_class = EXCLUDED.color_class,
        sort_order  = EXCLUDED.sort_order,
        updated_at  = now()
    `;
  }
  console.log(`  ✓ ${DEFAULT_CATEGORIES.length} default categories seeded`);

  // 3. Migrate events.category from enum to text (safe if already text)
  try {
    await sql`ALTER TABLE events ALTER COLUMN category TYPE text USING category::text`;
    console.log("  ✓ events.category column migrated to text");
  } catch (err) {
    if (err.message?.includes("cannot be cast")) {
      console.log("  ↳ events.category already text — skipped");
    } else {
      throw err;
    }
  }

  // 4. Drop old enum type if it exists (clean up)
  try {
    await sql`DROP TYPE IF EXISTS event_category`;
    console.log("  ✓ event_category enum type dropped");
  } catch {
    console.log("  ↳ event_category type not found — skipped");
  }

  console.log("\n✅ Categories migration complete!");
}

run().catch((err) => {
  console.error("❌ Migration failed:", err.message);
  process.exit(1);
});
