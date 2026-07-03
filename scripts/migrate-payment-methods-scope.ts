/**
 * Asigna organizer_id a medios de pago globales existentes.
 * - Si están ligados a eventos → organizer del evento
 * - Si no tienen evento → quedan como plataforma (organizer_id NULL) solo si son culqi/yape de licencia
 * - Si no tienen evento y son yape/plin/cash → asignar al primer organizador encontrado
 */
import { db } from "@/lib/db";
import { paymentMethods, eventPaymentMethods, events, users } from "@/lib/db/schema";
import { eq, isNull, sql } from "drizzle-orm";

async function main() {
  console.log("Migrating payment_methods → per-organizer scope...");

  const orphaned = await db
    .select({ id: paymentMethods.id, type: paymentMethods.type })
    .from(paymentMethods)
    .where(isNull(paymentMethods.organizerId));

  if (orphaned.length === 0) {
    console.log("No orphaned payment methods. Done.");
    return;
  }

  for (const method of orphaned) {
    const [linked] = await db
      .select({ organizerId: events.organizerId })
      .from(eventPaymentMethods)
      .innerJoin(events, eq(events.id, eventPaymentMethods.eventId))
      .where(eq(eventPaymentMethods.paymentMethodId, method.id))
      .limit(1);

    if (linked?.organizerId) {
      await db
        .update(paymentMethods)
        .set({ organizerId: linked.organizerId, updatedAt: new Date() })
        .where(eq(paymentMethods.id, method.id));
      console.log(`  ${method.id} (${method.type}) → organizer ${linked.organizerId}`);
      continue;
    }

    const [fallbackOrganizer] = await db
      .select({ id: users.id })
      .from(users)
      .where(sql`${users.role} IN ('organizer', 'super_admin', 'admin')`)
      .limit(1);

    if (fallbackOrganizer && method.type !== "culqi") {
      await db
        .update(paymentMethods)
        .set({ organizerId: fallbackOrganizer.id, updatedAt: new Date() })
        .where(eq(paymentMethods.id, method.id));
      console.log(`  ${method.id} (${method.type}) → fallback organizer ${fallbackOrganizer.id}`);
    } else {
      console.log(`  ${method.id} (${method.type}) → kept as platform (null organizer)`);
    }
  }

  console.log("Migration complete.");
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
