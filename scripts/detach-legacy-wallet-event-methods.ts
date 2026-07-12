/**
 * Quita Yape/Plin manuales de event_payment_methods (no borra el medio).
 * Uso: pnpm run db:detach:legacy-wallets
 */
import { db } from "../src/lib/db";
import { eventPaymentMethods, paymentMethods } from "../src/lib/db/schema";
import { eq, inArray, sql } from "drizzle-orm";

async function main() {
  console.log("Detaching legacy Yape/Plin from events...");

  const legacy = await db
    .select({ id: paymentMethods.id, type: paymentMethods.type })
    .from(paymentMethods)
    .where(inArray(paymentMethods.type, ["yape", "plin"]));

  if (legacy.length === 0) {
    console.log("No legacy wallet methods found.");
    return;
  }

  const ids = legacy.map((m) => m.id);
  const result = await db
    .delete(eventPaymentMethods)
    .where(inArray(eventPaymentMethods.paymentMethodId, ids));

  console.log(
    `Detached ${ids.length} legacy method(s) from events. Rows affected ≈ ${JSON.stringify(result)}.`,
  );

  const remaining = await db.execute(sql`
    SELECT COUNT(*)::int AS n
    FROM event_payment_methods epm
    INNER JOIN payment_methods pm ON pm.id = epm.payment_method_id
    WHERE pm.type IN ('yape', 'plin')
  `);
  console.log("Remaining event links to Yape/Plin:", remaining);
  console.log("Done. Organizers can still delete the legacy methods in Medios de pago.");
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
