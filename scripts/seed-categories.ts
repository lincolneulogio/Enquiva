import { db } from "@/lib/db";
import { categories } from "@/lib/db/schema";

const seedCategories = [
  { slug: "campanas-evangelisticas", label: "Campañas Evangelísticas", description: "Campañas y eventos masivos de evangelización", colorClass: "bg-blue-100 text-blue-800", sortOrder: 1 },
  { slug: "confraternidades", label: "Confraternidades", description: "Eventos de confraternidad y comunión", colorClass: "bg-emerald-100 text-emerald-800", sortOrder: 2 },
];

async function main() {
  console.log("Seeding categories...");
  for (const cat of seedCategories) {
    await db.insert(categories).values(cat).onConflictDoNothing();
  }
  console.log(`Created ${seedCategories.length} categories`);
  process.exit(0);
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
