import { db } from "@/lib/db";
import { events, users } from "@/lib/db/schema";
import { asc, eq, inArray } from "drizzle-orm";

type SeedEvent = {
    title: string;
    slug: string;
    description: string;
    category: string;
    date: Date;
    endDate?: Date;
    location?: string;
    locationUrl?: string;
    isVirtual: boolean;
    virtualLink?: string;
    isFeatured?: boolean;
    sourceUrl: string;
};

function withSource(description: string, sourceUrl: string) {
    return `${description}\n\nFuente: ${sourceUrl}`;
}

function nextWeekdayAt(weekday: number, hour: number, minute = 0) {
    const now = new Date();
    const date = new Date(now);
    const distance = (weekday - now.getDay() + 7) % 7;
    date.setDate(now.getDate() + (distance === 0 ? 7 : distance));
    date.setHours(hour, minute, 0, 0);
    return date;
}

async function getOrCreateOrganizerId() {
    const [existingOrganizer] = await db
        .select({ id: users.id, role: users.role })
        .from(users)
        .where(inArray(users.role, ["organizer", "admin", "super_admin", "member"]))
        .orderBy(asc(users.createdAt))
        .limit(1);

    if (existingOrganizer) {
        return existingOrganizer.id;
    }

    const organizerId = `seed-organizer-${crypto.randomUUID()}`;
    await db.insert(users).values({
        id: organizerId,
        name: "Seed Organizer",
        email: `seed-organizer-${Date.now()}@EncuentroDeFe.local`,
        role: "organizer",
        emailVerified: true,
        isActive: true,
    });

    console.log(`✓ Created fallback organizer user: ${organizerId}`);
    return organizerId;
}

function getSeedEvents(sourceLinks: Record<string, string>): SeedEvent[] {
    return [
        {
            title: "Convención Perú 2026 · Sede Arequipa",
            slug: "convencion-peru-2026-arequipa",
            description: withSource(
                "Convención nacional con enfoque en familia, enseñanza bíblica y fortalecimiento comunitario. Sede: Complejo deportivo Alto Selva Alegre.",
                sourceLinks.mmmConvencion
            ),
            category: "convention",
            date: new Date("2026-03-12T09:00:00-05:00"),
            endDate: new Date("2026-03-15T18:00:00-05:00"),
            location: "Arequipa, Perú · Complejo deportivo Alto Selva Alegre",
            isVirtual: false,
            isFeatured: true,
            sourceUrl: sourceLinks.mmmConvencion,
        },
        {
            title: "Convención Perú 2026 · Sede Lima",
            slug: "convencion-peru-2026-lima",
            description: withSource(
                "Jornadas de adoración, palabra y unidad familiar en la sede Lima de la convención nacional.",
                sourceLinks.mmmConvencion
            ),
            category: "convention",
            date: new Date("2026-03-19T09:00:00-05:00"),
            endDate: new Date("2026-03-22T18:00:00-05:00"),
            location: "Lima, Perú · Estadio de la Universidad Nacional Mayor de San Marcos",
            isVirtual: false,
            isFeatured: true,
            sourceUrl: sourceLinks.mmmConvencion,
        },
        {
            title: "Convención Perú 2026 · Sede Huánuco",
            slug: "convencion-peru-2026-huanuco",
            description: withSource(
                "Encuentro de impacto espiritual y comunitario para iglesias y familias en la región Huánuco.",
                sourceLinks.mmmConvencion
            ),
            category: "convention",
            date: new Date("2026-03-26T09:00:00-05:00"),
            endDate: new Date("2026-03-29T18:00:00-05:00"),
            location: "Huánuco, Perú · Estadio del Complejo Deportivo de Amarilis",
            isVirtual: false,
            sourceUrl: sourceLinks.mmmConvencion,
        },
        {
            title: "Congreso Centroamericano y del Caribe · Panamá",
            slug: "congreso-centroamericano-caribe-panama-2026",
            description: withSource(
                "Congreso regional de fe y formación ministerial, en el marco del aniversario 63 de la obra.",
                sourceLinks.mmmAgenda
            ),
            category: "conference",
            date: new Date("2026-02-13T19:00:00-05:00"),
            endDate: new Date("2026-02-17T21:00:00-05:00"),
            location: "Panamá · Panama Convention Center",
            isVirtual: false,
            sourceUrl: sourceLinks.mmmApertura,
        },
        {
            title: "Inauguración de Oficinas Internacionales MMM",
            slug: "inauguracion-oficinas-internacionales-mmm-puerto-rico",
            description: withSource(
                "Acto de inauguración y dedicación de nuevas oficinas internacionales del MMM en Trujillo Alto.",
                sourceLinks.mmmInauguracion,
            ),
            category: "community",
            date: new Date("2026-02-27T18:00:00-04:00"),
            location: "Trujillo Alto, Puerto Rico · Barrio Las Cuevas",
            isVirtual: false,
            sourceUrl: sourceLinks.mmmInauguracion,
        },
        {
            title: "Bethel Radio · Despierta con Bethel (Edición semanal)",
            slug: "bethel-radio-despierta-con-bethel-semanal",
            description: withSource(
                "Programa radial matutino con música, reflexión, oración y entrevistas. Inspirado en la programación oficial.",
                sourceLinks.bethelDespierta
            ),
            category: "family_faith",
            date: nextWeekdayAt(1, 6, 0),
            endDate: nextWeekdayAt(1, 8, 30),
            isVirtual: true,
            virtualLink: "https://envivo.bethel.fm/musica",
            sourceUrl: sourceLinks.bethelDespierta,
        },
        {
            title: "Bethel Radio · Hora Punta (Análisis en vivo)",
            slug: "bethel-radio-hora-punta-en-vivo",
            description: withSource(
                "Espacio de entrevistas y análisis periodístico sobre la actualidad nacional desde una perspectiva de valores.",
                sourceLinks.bethelHoraPunta
            ),
            category: "news_analysis",
            date: nextWeekdayAt(2, 9, 0),
            endDate: nextWeekdayAt(2, 11, 0),
            isVirtual: true,
            virtualLink: "https://envivo.bethel.fm/predicas",
            sourceUrl: sourceLinks.bethelHoraPunta,
            isFeatured: true,
        },
        {
            title: "Bethel Radio · Entre Notas (Comunidad y testimonios)",
            slug: "bethel-radio-entre-notas-comunidad",
            description: withSource(
                "Programa con conversaciones, historias y mensajes de esperanza para la comunidad oyente.",
                sourceLinks.bethelEntreNotas
            ),
            category: "music_testimony",
            date: nextWeekdayAt(3, 14, 0),
            endDate: nextWeekdayAt(3, 15, 0),
            isVirtual: true,
            virtualLink: "https://envivo.bethel.fm/musica",
            sourceUrl: sourceLinks.bethelEntreNotas,
        },
        {
            title: "Bethel TV · Transmisión especial EN VIVO",
            slug: "bethel-tv-transmision-especial-en-vivo",
            description: withSource(
                "Transmisión especial inspirada en la señal en vivo de Bethel TV para audiencia global.",
                sourceLinks.bethelTvHome
            ),
            category: "streaming",
            date: nextWeekdayAt(5, 20, 0),
            endDate: nextWeekdayAt(5, 21, 30),
            isVirtual: true,
            virtualLink: "https://betheltv.tv/",
            sourceUrl: sourceLinks.bethelTvHome,
        },
    ];
}

async function main() {
    const organizerId = await getOrCreateOrganizerId();

    const sourceLinks = {
        mmmAgenda: "https://mmmoficial.org/agenda/",
        mmmConvencion: "https://mmmoficial.org/convencion-nacional-del-mmm-peru-2026/",
        mmmInauguracion:
            "https://mmmoficial.org/inauguracion-de-las-nuevas-oficinas-internacionales-del-movimiento-misionero-mundial-en-puerto-rico/",
        mmmApertura:
            "https://mmmoficial.org/solemne-apertura-63-anos-de-victoria-y-fe-en-el-corazon-de-panama/",
        bethelDespierta: "https://www.bethel.fm/programas/despierta-con-bethel",
        bethelHoraPunta: "https://www.bethel.fm/programas/hora-punta",
        bethelEntreNotas: "https://www.bethel.fm/programas/entre-notas",
        bethelTvHome: "https://betheltv.tv/",
    };

    const records = getSeedEvents(sourceLinks);

    for (const record of records) {
        await db
            .insert(events)
            .values({
                organizerId,
                title: record.title,
                slug: record.slug,
                description: record.description,
                category: record.category,
                date: record.date,
                endDate: record.endDate ?? null,
                location: record.location ?? null,
                locationUrl: record.locationUrl ?? null,
                isVirtual: record.isVirtual,
                virtualLink: record.virtualLink ?? null,
                status: "published",
                isFeatured: record.isFeatured ?? false,
            })
            .onConflictDoUpdate({
                target: events.slug,
                set: {
                    title: record.title,
                    description: record.description,
                    category: record.category,
                    date: record.date,
                    endDate: record.endDate ?? null,
                    location: record.location ?? null,
                    locationUrl: record.locationUrl ?? null,
                    isVirtual: record.isVirtual,
                    virtualLink: record.virtualLink ?? null,
                    status: "published",
                    isFeatured: record.isFeatured ?? false,
                    updatedAt: new Date(),
                    organizerId,
                },
            });

        console.log(`✓ Seeded event: ${record.title}`);
    }

    const count = await db
        .select({ slug: events.slug })
        .from(events)
        .where(eq(events.organizerId, organizerId));

    console.log();
    console.log(`Done. Organizer ${organizerId} now has ${count.length} event(s).`);
}

main().catch((error) => {
    console.error("Seed events failed:", error);
    process.exit(1);
});