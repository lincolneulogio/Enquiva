import { db } from "@/lib/db";
import { categories, users } from "@/lib/db/schema";
import { asc, inArray } from "drizzle-orm";

type SeedCategory = {
    slug: string;
    label: string;
    description: string;
    colorClass: string;
    sortOrder: number;
    isActive?: boolean;
};

const SOURCE_REFERENCES = {
    mmmAgenda: "https://mmmoficial.org/agenda/",
    mmmEventos: "https://mmmoficial.org/category/eventos/",
    mmmConvencion: "https://mmmoficial.org/convencion-nacional-del-mmm-peru-2026/",
    bethelProgramas: "https://www.bethel.fm/programas",
    bethelDespierta: "https://www.bethel.fm/programas/despierta-con-bethel",
    bethelHoraPunta: "https://www.bethel.fm/programas/hora-punta",
    bethelEntreNotas: "https://www.bethel.fm/programas/entre-notas",
    bethelTv: "https://betheltv.tv/",
};

function withSource(description: string, sourceUrl: string) {
    return `${description} Fuente: ${sourceUrl}`;
}

function getCategorySeedData(): SeedCategory[] {
    return [
        {
            slug: "conference",
            label: "Conferencia",
            description: withSource(
                "Congresos y convenciones cristianas de alcance nacional e internacional.",
                SOURCE_REFERENCES.mmmAgenda
            ),
            colorClass: "bg-violet-100 text-violet-800",
            sortOrder: 1,
        },
        {
            slug: "convention",
            label: "Convención",
            description: withSource(
                "Eventos de convención con múltiples sedes y fechas dentro del año.",
                SOURCE_REFERENCES.mmmConvencion
            ),
            colorClass: "bg-indigo-100 text-indigo-800",
            sortOrder: 2,
        },
        {
            slug: "broadcast",
            label: "Programa radial",
            description: withSource(
                "Programas de radio con horario semanal como Despierta con Bethel, Hora Punta y Entre Notas.",
                SOURCE_REFERENCES.bethelProgramas
            ),
            colorClass: "bg-blue-100 text-blue-800",
            sortOrder: 3,
        },
        {
            slug: "streaming",
            label: "Transmisión en vivo",
            description: withSource(
                "Contenido en vivo para audiencia digital, incluyendo señales y emisiones especiales.",
                SOURCE_REFERENCES.bethelTv
            ),
            colorClass: "bg-teal-100 text-teal-800",
            sortOrder: 4,
        },
        {
            slug: "community",
            label: "Comunidad",
            description: withSource(
                "Actividades comunitarias, inauguraciones institucionales y encuentros de servicio.",
                SOURCE_REFERENCES.mmmEventos
            ),
            colorClass: "bg-green-100 text-green-800",
            sortOrder: 5,
        },
        {
            slug: "news_analysis",
            label: "Noticias y análisis",
            description: withSource(
                "Espacios informativos de análisis social y actualidad con enfoque de valores.",
                SOURCE_REFERENCES.bethelHoraPunta
            ),
            colorClass: "bg-amber-100 text-amber-800",
            sortOrder: 6,
        },
        {
            slug: "music_testimony",
            label: "Música y testimonio",
            description: withSource(
                "Programación de acompañamiento, reflexión, música y testimonios para la audiencia.",
                SOURCE_REFERENCES.bethelEntreNotas
            ),
            colorClass: "bg-rose-100 text-rose-800",
            sortOrder: 7,
        },
        {
            slug: "family_faith",
            label: "Familia y fe",
            description: withSource(
                "Contenido orientado a fortalecer la familia según principios bíblicos.",
                SOURCE_REFERENCES.mmmConvencion
            ),
            colorClass: "bg-gray-100 text-gray-800",
            sortOrder: 8,
        },
    ];
}

async function getCategoryOwnerId() {
    const [candidate] = await db
        .select({ id: users.id })
        .from(users)
        .where(inArray(users.role, ["super_admin", "admin", "organizer", "member"]))
        .orderBy(asc(users.createdAt))
        .limit(1);

    return candidate?.id ?? null;
}

async function main() {
    const createdBy = await getCategoryOwnerId();
    const records = getCategorySeedData();

    for (const record of records) {
        await db
            .insert(categories)
            .values({
                slug: record.slug,
                label: record.label,
                description: record.description,
                colorClass: record.colorClass,
                sortOrder: record.sortOrder,
                isActive: record.isActive ?? true,
                createdBy,
            })
            .onConflictDoUpdate({
                target: categories.slug,
                set: {
                    label: record.label,
                    description: record.description,
                    colorClass: record.colorClass,
                    sortOrder: record.sortOrder,
                    isActive: record.isActive ?? true,
                    updatedAt: new Date(),
                },
            });

        console.log(`✓ Seeded category: ${record.slug} (${record.label})`);
    }

    console.log();
    console.log(`Done. Seeded/updated ${records.length} category records.`);
}

main().catch((error) => {
    console.error("Seed categories failed:", error);
    process.exit(1);
});