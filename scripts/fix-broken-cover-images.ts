/**
 * Corrige URLs de portada Unsplash rotas en eventos existentes.
 * Ejecutar: npx tsx --env-file=.env scripts/fix-broken-cover-images.ts
 */
import { db } from "@/lib/db";
import { events } from "@/lib/db/schema";
import { sql } from "drizzle-orm";

const REPLACEMENTS: Record<string, string> = {
  "photo-1507692049794-ef8b2f0a0b8b":
    "https://images.unsplash.com/photo-1540575467061-178a50c2df87?w=1200&q=80",
  "photo-1470101460543-b7272ff8350a":
    "https://images.unsplash.com/photo-1511578314322-379afb4768f1?w=1200&q=80",
};

async function main() {
  let updated = 0;

  for (const [brokenId, newUrl] of Object.entries(REPLACEMENTS)) {
    const result = await db
      .update(events)
      .set({ coverImage: newUrl })
      .where(sql`${events.coverImage} LIKE ${"%" + brokenId + "%"}`)
      .returning({ id: events.id, title: events.title });

    for (const row of result) {
      console.log(`  ✓ ${row.title}`);
      updated++;
    }
  }

  console.log(updated > 0 ? `Actualizados ${updated} evento(s).` : "No había portadas rotas en la BD.");
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => process.exit(0));
