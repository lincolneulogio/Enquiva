import { db } from "@/lib/db";
import {
  users,
  events,
  paymentMethods,
  eventPaymentMethods,
  transportRoutes,
} from "@/lib/db/schema";
import { eq, inArray, sql } from "drizzle-orm";

function isCulqiEnvConfigured() {
  return Boolean(process.env.CULQI_SECRET_KEY && process.env.NEXT_PUBLIC_CULQI_PUBLIC_KEY);
}

function addDays(days: number, hour = 18): Date {
  const date = new Date();
  date.setDate(date.getDate() + days);
  date.setHours(hour, 0, 0, 0);
  return date;
}

async function resolveOrganizerId(): Promise<string> {
  const [privileged] = await db
    .select({ id: users.id, email: users.email, role: users.role })
    .from(users)
    .where(inArray(users.role, ["super_admin", "admin", "organizer"]))
    .limit(1);

  if (privileged) return privileged.id;

  const [anyUser] = await db.select({ id: users.id }).from(users).limit(1);
  if (!anyUser) {
    throw new Error(
      "No hay usuarios en la base de datos. Regístrate en la app antes de ejecutar el seed de eventos.",
    );
  }

  return anyUser.id;
}

async function ensurePaymentMethods(organizerId: string) {
  const existing = await db
    .select({ id: paymentMethods.id, type: paymentMethods.type })
    .from(paymentMethods)
    .where(eq(paymentMethods.organizerId, organizerId));
  const byType = new Map(existing.map((m) => [m.type, m.id]));

  const defaults = [
    {
      type: "yape" as const,
      label: "Yape",
      phone: "+51987654321",
      holderName: "Eventia",
    },
    {
      type: "plin" as const,
      label: "Plin",
      phone: "+51912345678",
      holderName: "Eventia",
    },
    {
      type: "cash" as const,
      label: "Efectivo en puerta",
      holderName: "Eventia",
    },
    ...(isCulqiEnvConfigured()
      ? [
          {
            type: "culqi" as const,
            label: "Tarjeta de crédito/débito",
            holderName: "Eventia",
          },
        ]
      : []),
  ];

  for (const method of defaults) {
    if (byType.has(method.type)) continue;
    const [created] = await db
      .insert(paymentMethods)
      .values({ ...method, organizerId })
      .returning({ id: paymentMethods.id, type: paymentMethods.type });
    if (created) byType.set(created.type, created.id);
  }

  return byType;
}

async function linkPaymentMethods(eventId: string, methodIds: string[]) {
  for (const paymentMethodId of methodIds) {
    await db
      .insert(eventPaymentMethods)
      .values({ eventId, paymentMethodId })
      .onConflictDoNothing();
  }
}

async function main() {
  console.log("Seeding demo events...");

  const organizerId = await resolveOrganizerId();
  const methodMap = await ensurePaymentMethods(organizerId);
  const paidMethodIds = [
    methodMap.get("yape"),
    methodMap.get("plin"),
    methodMap.get("cash"),
    methodMap.get("culqi"),
  ].filter(Boolean) as string[];

  const demoEvents = [
    {
      slug: "festival-comunitario-lima-2026",
      title: "Festival Comunitario Lima 2026",
      description:
        "Una jornada abierta para toda la familia con música en vivo, talleres para niños y jóvenes, y actividades para la comunidad.",
      category: "conference",
      date: addDays(30),
      endDate: addDays(30, 22),
      location: "Parque de la Muralla, Lima Centro",
      locationUrl: "https://maps.google.com/?q=Parque+de+la+Muralla+Lima",
      isVirtual: false,
      capacity: 500,
      status: "published" as const,
      isFeatured: true,
      price: "25.00",
      hasTransport: true,
      coverImage: "https://images.unsplash.com/photo-1540575467061-178a50c2df87?w=1200&q=80",
    },
    {
      slug: "networking-juvenil-2026",
      title: "Networking Juvenil 2026",
      description:
        "Encuentro juvenil con dinámicas, música en vivo y espacio para networking. Ideal para grupos universitarios y nuevos participantes.",
      category: "youth",
      date: addDays(45, 16),
      endDate: addDays(45, 21),
      location: "Auditorio Central, San Isidro",
      locationUrl: "https://maps.google.com/?q=San+Isidro+Lima",
      isVirtual: false,
      capacity: 200,
      status: "published" as const,
      isFeatured: false,
      price: "15.00",
      hasTransport: false,
      coverImage: "https://images.unsplash.com/photo-1529070538774-1843cb3265df?w=1200&q=80",
    },
    {
      slug: "webinar-liderazgo-digital",
      title: "Webinar de Liderazgo Digital",
      description:
        "Únete desde casa a una sesión de formación y networking profesional. Recibirás el enlace de acceso al confirmar tu registro.",
      category: "conference",
      date: addDays(14, 20),
      endDate: addDays(14, 22),
      location: null,
      locationUrl: null,
      isVirtual: true,
      virtualLink: "https://meet.google.com/demo-eventia",
      capacity: 1000,
      status: "published" as const,
      isFeatured: true,
      price: null,
      hasTransport: false,
      coverImage: "https://images.unsplash.com/photo-1511578314322-379afb4768f1?w=1200&q=80",
    },
  ];

  let created = 0;

  for (const demo of demoEvents) {
    const [existing] = await db
      .select({ id: events.id })
      .from(events)
      .where(eq(events.slug, demo.slug))
      .limit(1);

    if (existing) {
      console.log(`  · Ya existe: ${demo.title}`);
      continue;
    }

    const [event] = await db
      .insert(events)
      .values({
        organizerId,
        title: demo.title,
        slug: demo.slug,
        description: demo.description,
        category: demo.category,
        date: demo.date,
        endDate: demo.endDate,
        location: demo.location,
        locationUrl: demo.locationUrl,
        isVirtual: demo.isVirtual,
        virtualLink: demo.isVirtual ? demo.virtualLink : null,
        capacity: demo.capacity,
        status: demo.status,
        isFeatured: demo.isFeatured,
        price: demo.price,
        hasTransport: demo.hasTransport,
        coverImage: demo.coverImage,
      })
      .returning({ id: events.id, title: events.title, slug: events.slug });

    if (demo.price && paidMethodIds.length > 0) {
      await linkPaymentMethods(event.id, paidMethodIds);
    }

    if (demo.hasTransport) {
      await db.insert(transportRoutes).values({
        eventId: event.id,
        name: "Ruta Norte — Centro",
        departurePoint: "Plaza Norte",
        departureTime: addDays(30, 16),
        returnTime: addDays(30, 23),
        pricePerSeat: "10.00",
        totalSeats: 40,
        description: "Salida coordinada desde la zona norte de Lima.",
        isActive: true,
      });
    }

    created += 1;
    console.log(`  ✓ Creado: ${event.title} (/${event.slug})`);
  }

  const [{ count }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(events)
    .where(eq(events.status, "published"));

  console.log(`\nDemo seed listo. Eventos publicados en total: ${count} (${created} nuevos).`);
  process.exit(0);
}

main().catch((err) => {
  console.error("Seed demo events failed:", err);
  process.exit(1);
});
