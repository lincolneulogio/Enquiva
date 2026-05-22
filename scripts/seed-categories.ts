import { db } from "@/lib/db";
import { categories } from "@/lib/db/schema";

const seedCategories = [
  { slug: "worship", label: "Adoración", description: "Noches de alabanza y adoración", colorClass: "bg-purple-100 text-purple-800", sortOrder: 1 },
  { slug: "retreat", label: "Retiro", description: "Retiros espirituales y de convivencia", colorClass: "bg-green-100 text-green-800", sortOrder: 2 },
  { slug: "youth", label: "Juventud", description: "Eventos para jóvenes", colorClass: "bg-orange-100 text-orange-800", sortOrder: 3 },
  { slug: "charity", label: "Caridad", description: "Obras de caridad y voluntariado", colorClass: "bg-red-100 text-red-800", sortOrder: 4 },
  { slug: "conference", label: "Conferencia", description: "Conferencias y congresos", colorClass: "bg-blue-100 text-blue-800", sortOrder: 5 },
  { slug: "prayer", label: "Oración", description: "Cadenas de oración y vigilias", colorClass: "bg-indigo-100 text-indigo-800", sortOrder: 6 },
  { slug: "bible_study", label: "Estudio Bíblico", description: "Estudios y grupos bíblicos", colorClass: "bg-teal-100 text-teal-800", sortOrder: 7 },
  { slug: "outreach", label: "Misiones", description: "Actividades misioneras y de alcance", colorClass: "bg-amber-100 text-amber-800", sortOrder: 8 },
  { slug: "fellowship", label: "Comunión", description: "Eventos de confraternidad", colorClass: "bg-pink-100 text-pink-800", sortOrder: 9 },
  { slug: "other", label: "Otro", description: "Otros tipos de evento", colorClass: "bg-gray-100 text-gray-800", sortOrder: 10 },
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
