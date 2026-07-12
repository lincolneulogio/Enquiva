/**
 * Semilla idempotente para staging / e2e del flujo crítico:
 * registro → pago cash → aprobación → ticket QR → check-in.
 *
 * Uso: pnpm run seed:staging
 *
 * Crea (o actualiza):
 * - Organizer + Member verificados
 * - Medio de pago cash del organizer
 * - Evento de pago + evento gratis publicados
 * - Suscripción Free del organizer (límites)
 * - e2e/.staging-fixtures.json con IDs/slugs
 */
import { randomUUID } from "node:crypto";
import { hashPassword } from "better-auth/crypto";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  accounts,
  eventPaymentMethods,
  events,
  paymentMethods,
  users,
} from "@/lib/db/schema";
import { SubscriptionService } from "@/lib/billing/subscription.service";
import { CACHE_KEYS, invalidateCache } from "@/lib/redis";
import { writeFileSync, mkdirSync } from "node:fs";
import path from "node:path";
import { STAGING_FIXTURES } from "./staging-constants";

function createId() {
  return randomUUID();
}

async function upsertCredentialUser(input: {
  email: string;
  password: string;
  name: string;
  role: "organizer" | "member";
}) {
  const [existing] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, input.email))
    .limit(1);

  const userId = existing?.id ?? createId();
  const passwordHash = await hashPassword(input.password);
  const now = new Date();

  if (existing) {
    await db
      .update(users)
      .set({
        name: input.name,
        role: input.role,
        emailVerified: true,
        isActive: true,
        updatedAt: now,
      })
      .where(eq(users.id, userId));
  } else {
    await db.insert(users).values({
      id: userId,
      name: input.name,
      email: input.email,
      emailVerified: true,
      role: input.role,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });
  }

  const [account] = await db
    .select({ id: accounts.id })
    .from(accounts)
    .where(and(eq(accounts.userId, userId), eq(accounts.providerId, "credential")))
    .limit(1);

  if (account) {
    await db
      .update(accounts)
      .set({ password: passwordHash, updatedAt: now })
      .where(eq(accounts.id, account.id));
  } else {
    await db.insert(accounts).values({
      id: createId(),
      accountId: userId,
      providerId: "credential",
      userId,
      password: passwordHash,
      createdAt: now,
      updatedAt: now,
    });
  }

  return userId;
}

async function upsertEvent(input: {
  organizerId: string;
  slug: string;
  title: string;
  price: string | null;
  description: string;
}) {
  const eventDate = new Date();
  eventDate.setDate(eventDate.getDate() + 14);
  eventDate.setHours(19, 0, 0, 0);

  const [existing] = await db
    .select({ id: events.id })
    .from(events)
    .where(eq(events.slug, input.slug))
    .limit(1);

  const now = new Date();
  if (existing) {
    await db
      .update(events)
      .set({
        title: input.title,
        description: input.description,
        organizerId: input.organizerId,
        date: eventDate,
        status: "published",
        price: input.price,
        capacity: 100,
        category: "other",
        location: "Lima — Staging Evora",
        hasTransport: false,
        updatedAt: now,
      })
      .where(eq(events.id, existing.id));
    return existing.id;
  }

  const [created] = await db
    .insert(events)
    .values({
      organizerId: input.organizerId,
      title: input.title,
      slug: input.slug,
      description: input.description,
      category: "other",
      date: eventDate,
      location: "Lima — Staging Evora",
      capacity: 100,
      status: "published",
      price: input.price,
      hasTransport: false,
      createdAt: now,
      updatedAt: now,
    })
    .returning({ id: events.id });

  return created.id;
}

async function upsertCashMethod(organizerId: string, paidEventId: string) {
  const [existing] = await db
    .select({ id: paymentMethods.id })
    .from(paymentMethods)
    .where(
      and(
        eq(paymentMethods.organizerId, organizerId),
        eq(paymentMethods.type, "cash"),
        eq(paymentMethods.label, "Efectivo Staging"),
      ),
    )
    .limit(1);

  let methodId = existing?.id;
  const now = new Date();

  if (methodId) {
    await db
      .update(paymentMethods)
      .set({
        holderName: "Evora Staging",
        isActive: true,
        updatedAt: now,
      })
      .where(eq(paymentMethods.id, methodId));
  } else {
    const [created] = await db
      .insert(paymentMethods)
      .values({
        organizerId,
        type: "cash",
        label: "Efectivo Staging",
        holderName: "Evora Staging",
        isActive: true,
        createdAt: now,
        updatedAt: now,
      })
      .returning({ id: paymentMethods.id });
    methodId = created.id;
  }

  await db
    .delete(eventPaymentMethods)
    .where(eq(eventPaymentMethods.eventId, paidEventId));

  await db.insert(eventPaymentMethods).values({
    eventId: paidEventId,
    paymentMethodId: methodId,
  });

  return methodId;
}

async function main() {
  console.log("→ Sync planes por defecto…");
  await SubscriptionService.ensureDefaultPlans();

  console.log("→ Usuarios staging…");
  const organizerId = await upsertCredentialUser({
    ...STAGING_FIXTURES.organizer,
    role: "organizer",
  });
  const memberId = await upsertCredentialUser({
    ...STAGING_FIXTURES.member,
    role: "member",
  });

  console.log("→ Suscripción organizer…");
  await SubscriptionService.getOrCreateSubscription(organizerId, "organizer");

  console.log("→ Eventos staging…");
  const paidEventId = await upsertEvent({
    organizerId,
    slug: STAGING_FIXTURES.paidEventSlug,
    title: "Staging — Evento de pago (cash)",
    price: "25.00",
    description:
      "Evento de staging para validar registro → pago efectivo → ticket → check-in. No usar en producción real.",
  });
  const freeEventId = await upsertEvent({
    organizerId,
    slug: STAGING_FIXTURES.freeEventSlug,
    title: "Staging — Evento gratis",
    price: null,
    description: "Evento gratis de staging para emitir ticket inmediato.",
  });

  console.log("→ Medio de pago cash…");
  const cashMethodId = await upsertCashMethod(organizerId, paidEventId);

  await invalidateCache(CACHE_KEYS.publicEvents);
  await invalidateCache(CACHE_KEYS.eventBySlug(STAGING_FIXTURES.paidEventSlug));
  await invalidateCache(CACHE_KEYS.eventBySlug(STAGING_FIXTURES.freeEventSlug));

  const fixtures = {
    generatedAt: new Date().toISOString(),
    organizer: {
      id: organizerId,
      email: STAGING_FIXTURES.organizer.email,
      password: STAGING_FIXTURES.organizer.password,
    },
    member: {
      id: memberId,
      email: STAGING_FIXTURES.member.email,
      password: STAGING_FIXTURES.member.password,
    },
    paidEvent: {
      id: paidEventId,
      slug: STAGING_FIXTURES.paidEventSlug,
      price: "25.00",
    },
    freeEvent: {
      id: freeEventId,
      slug: STAGING_FIXTURES.freeEventSlug,
    },
    cashMethodId,
  };

  const outDir = path.join(process.cwd(), "e2e");
  mkdirSync(outDir, { recursive: true });
  const outPath = path.join(outDir, ".staging-fixtures.json");
  writeFileSync(outPath, JSON.stringify(fixtures, null, 2), "utf8");

  console.log("✓ Staging fixtures listos");
  console.log(`  Organizer: ${fixtures.organizer.email}`);
  console.log(`  Member:    ${fixtures.member.email}`);
  console.log(`  Paid:      /events/${fixtures.paidEvent.slug}`);
  console.log(`  Free:      /events/${fixtures.freeEvent.slug}`);
  console.log(`  Wrote:     ${outPath}`);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
