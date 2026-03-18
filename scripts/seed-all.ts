import { execSync } from "node:child_process";
import { db } from "@/lib/db";
import {
    eventAttachments,
    events,
    notifications,
    payments,
    registrations,
    tickets,
    transportBookings,
    transportRoutes,
    users,
} from "@/lib/db/schema";
import { and, asc, eq, ilike, inArray } from "drizzle-orm";

const SEED_MARK = "[seed-all]";

type DemoUser = {
    id: string;
    name: string;
    email: string;
    role: "super_admin" | "admin" | "organizer" | "member";
    phone: string;
};

const demoUsers: DemoUser[] = [
    { id: "demo-super-admin", name: "Demo Super Admin", email: "demo.superadmin@EncuentroDeFe.local", role: "super_admin", phone: "+51900000001" },
    { id: "demo-admin-01", name: "Demo Admin Uno", email: "demo.admin1@EncuentroDeFe.local", role: "admin", phone: "+51900000002" },
    { id: "demo-admin-02", name: "Demo Admin Dos", email: "demo.admin2@EncuentroDeFe.local", role: "admin", phone: "+51900000003" },
    { id: "demo-organizer-01", name: "Demo Organizer Uno", email: "demo.organizer1@EncuentroDeFe.local", role: "organizer", phone: "+51900000004" },
    { id: "demo-organizer-02", name: "Demo Organizer Dos", email: "demo.organizer2@EncuentroDeFe.local", role: "organizer", phone: "+51900000005" },
    { id: "demo-organizer-03", name: "Demo Organizer Tres", email: "demo.organizer3@EncuentroDeFe.local", role: "organizer", phone: "+51900000006" },
    ...Array.from({ length: 20 }).map((_, i) => {
        const n = i + 1;
        return {
            id: `demo-member-${String(n).padStart(2, "0")}`,
            name: `Demo Miembro ${n}`,
            email: `demo.member${String(n).padStart(2, "0")}@EncuentroDeFe.local`,
            role: "member" as const,
            phone: `+519${String(10000000 + n).slice(-8)}`,
        };
    }),
];

function run(command: string) {
    console.log(`\n$ ${command}`);
    execSync(command, { stdio: "inherit" });
}

function randomFrom<T>(items: T[], indexSeed: number): T {
    return items[indexSeed % items.length];
}

async function seedDemoUsers() {
    for (const user of demoUsers) {
        await db
            .insert(users)
            .values({
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                phone: user.phone,
                emailVerified: true,
                isActive: true,
                bio: `Usuario demo para pruebas ${SEED_MARK}`,
            })
            .onConflictDoUpdate({
                target: users.id,
                set: {
                    name: user.name,
                    email: user.email,
                    role: user.role,
                    phone: user.phone,
                    emailVerified: true,
                    isActive: true,
                    updatedAt: new Date(),
                },
            });
    }

    console.log(`✓ Demo users seeded: ${demoUsers.length}`);
}

async function seedRegistrationsAndPaymentsAndTickets() {
    const demoMembers = demoUsers.filter((u) => u.role === "member");
    const publishedEvents = await db
        .select({ id: events.id, title: events.title, date: events.date })
        .from(events)
        .where(eq(events.status, "published"))
        .orderBy(asc(events.date));

    if (!publishedEvents.length) {
        throw new Error("No published events found. Run event seed first.");
    }

    let registrationCount = 0;

    for (let i = 0; i < publishedEvents.length; i += 1) {
        const event = publishedEvents[i];
        const attendees = demoMembers.slice(0, 8 + (i % 5));

        for (let j = 0; j < attendees.length; j += 1) {
            const member = attendees[j];
            const status = randomFrom(["registered", "checked_in", "waitlisted", "cancelled"] as const, i + j);

            await db
                .insert(registrations)
                .values({
                    eventId: event.id,
                    userId: member.id,
                    status,
                    contactPhone: member.phone,
                    notes: `Registro demo ${SEED_MARK}`,
                })
                .onConflictDoUpdate({
                    target: [registrations.eventId, registrations.userId],
                    set: {
                        status,
                        contactPhone: member.phone,
                        notes: `Registro demo actualizado ${SEED_MARK}`,
                    },
                });

            registrationCount += 1;
        }
    }

    const demoRegistrationRows = await db
        .select({
            id: registrations.id,
            userId: registrations.userId,
            eventId: registrations.eventId,
            status: registrations.status,
        })
        .from(registrations)
        .where(inArray(registrations.userId, demoMembers.map((m) => m.id)));

    await db.delete(payments).where(ilike(payments.notes, `%${SEED_MARK}%`));

    let paymentCount = 0;
    for (let i = 0; i < demoRegistrationRows.length; i += 1) {
        const reg = demoRegistrationRows[i];
        if (reg.status === "cancelled") continue;

        const status = randomFrom(["pending", "approved", "rejected"] as const, i);
        const amount = randomFrom(["15.00", "25.00", "35.00", "50.00", "80.00"], i);

        await db.insert(payments).values({
            registrationId: reg.id,
            userId: reg.userId,
            amount,
            currency: "PEN",
            method: "manual",
            reference: `PAY-${reg.id.slice(0, 8).toUpperCase()}`,
            status,
            notes: `Pago demo ${SEED_MARK}`,
        });

        paymentCount += 1;
    }

    let ticketCount = 0;
    for (const reg of demoRegistrationRows) {
        if (reg.status !== "registered" && reg.status !== "checked_in") continue;
        const code = `TCK-${reg.id.replace(/-/g, "").slice(0, 12).toUpperCase()}`;
        const qrCode = `https://EncuentroDeFe.local/ticket/${code}`;

        await db
            .insert(tickets)
            .values({
                registrationId: reg.id,
                code,
                qrCode,
                status: reg.status === "checked_in" ? "used" : "active",
                metadata: { seed: "all", marker: SEED_MARK },
            })
            .onConflictDoUpdate({
                target: tickets.registrationId,
                set: {
                    code,
                    qrCode,
                    status: reg.status === "checked_in" ? "used" : "active",
                },
            });

        ticketCount += 1;
    }

    console.log(`✓ Registrations seeded/updated: ${registrationCount}`);
    console.log(`✓ Payments seeded: ${paymentCount}`);
    console.log(`✓ Tickets seeded/updated: ${ticketCount}`);

    return { demoRegistrationRows, publishedEvents };
}

async function seedTransportAndAttachments(
    publishedEvents: Array<{ id: string; title: string }>,
    demoRegistrationRows: Array<{ id: string; eventId: string; userId: string; status: string }>
) {
    await db.delete(transportRoutes).where(ilike(transportRoutes.name, `%[DEMO]%`));
    await db.delete(eventAttachments).where(ilike(eventAttachments.fileName, "seed-%"));

    const candidateEvents = publishedEvents.slice(0, Math.min(3, publishedEvents.length));
    let routeCount = 0;
    let bookingCount = 0;
    let attachmentCount = 0;

    for (let i = 0; i < candidateEvents.length; i += 1) {
        const event = candidateEvents[i];
        const depHour = 7 + i;
        const retHour = 21 + i;
        const depDate = new Date();
        depDate.setDate(depDate.getDate() + 5 + i);
        depDate.setHours(depHour, 0, 0, 0);
        const retDate = new Date(depDate);
        retDate.setHours(retHour, 0, 0, 0);

        const [route] = await db
            .insert(transportRoutes)
            .values({
                eventId: event.id,
                name: `[DEMO] Ruta ${i + 1} - ${event.title}`,
                departurePoint: `Punto demo ${i + 1}`,
                departureTime: depDate,
                returnTime: retDate,
                pricePerSeat: `${15 + i * 5}.00`,
                totalSeats: 40 + i * 10,
                description: `Ruta de transporte demo ${SEED_MARK}`,
                isActive: true,
            })
            .returning({ id: transportRoutes.id });

        routeCount += 1;

        const eventRegs = demoRegistrationRows
            .filter((r) => r.eventId === event.id && (r.status === "registered" || r.status === "checked_in"))
            .slice(0, 6);

        for (const reg of eventRegs) {
            await db.insert(transportBookings).values({
                routeId: route.id,
                registrationId: reg.id,
                userId: reg.userId,
                seats: 1,
                status: "confirmed",
                notes: `Reserva demo ${SEED_MARK}`,
            });
            bookingCount += 1;
        }

        await db.insert(eventAttachments).values({
            eventId: event.id,
            fileUrl: `https://example.com/seed/event-${i + 1}.pdf`,
            fileName: `seed-material-event-${i + 1}.pdf`,
            fileType: "application/pdf",
            fileSize: 120000 + i * 1000,
        });

        attachmentCount += 1;
    }

    console.log(`✓ Transport routes seeded: ${routeCount}`);
    console.log(`✓ Transport bookings seeded: ${bookingCount}`);
    console.log(`✓ Event attachments seeded: ${attachmentCount}`);
}

async function seedNotifications() {
    const demoUserIds = demoUsers.map((u) => u.id);
    await db
        .delete(notifications)
        .where(and(inArray(notifications.userId, demoUserIds), ilike(notifications.title, "%[DEMO]%")));

    let notificationCount = 0;
    for (let i = 0; i < demoUserIds.length; i += 1) {
        const userId = demoUserIds[i];

        const payloads = [
            {
                type: "event_published" as const,
                title: "[DEMO] Nuevo evento publicado",
                message: "Ya puedes revisar y registrarte al nuevo evento demo.",
            },
            {
                type: "registration_confirmed" as const,
                title: "[DEMO] Registro confirmado",
                message: "Tu registro demo fue confirmado correctamente.",
            },
            {
                type: "payment_status_updated" as const,
                title: "[DEMO] Estado de pago actualizado",
                message: "El pago demo cambió de estado. Revisa tu panel.",
            },
        ];

        for (const payload of payloads) {
            await db.insert(notifications).values({
                userId,
                type: payload.type,
                title: payload.title,
                message: payload.message,
                read: i % 2 === 0,
                metadata: { seed: "all", marker: SEED_MARK },
            });
            notificationCount += 1;
        }
    }

    console.log(`✓ Notifications seeded: ${notificationCount}`);
}

async function main() {
    run("npm run db:seed:roles");
    run("npm run db:seed:admin");
    run("npm run db:seed:categories");
    run("npm run db:seed:events");
    run("npm run db:sync:event-categories");

    await seedDemoUsers();
    const { demoRegistrationRows, publishedEvents } = await seedRegistrationsAndPaymentsAndTickets();
    await seedTransportAndAttachments(publishedEvents, demoRegistrationRows);
    await seedNotifications();

    console.log("\n✅ Seed maestro completado.");
}

main().catch((error) => {
    console.error("Seed all failed:", error);
    process.exit(1);
});