/**
 * Imprime el ticket del member en el evento de pago (para E2E check-in).
 * Uso: pnpm exec tsx --env-file=.env --tsconfig tsconfig.json ./scripts/print-staging-ticket.ts
 */
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { registrations, tickets } from "@/lib/db/schema";
import { loadStagingFixtures } from "./lib/staging-critical";

async function main() {
  const fixtures = loadStagingFixtures();
  const [reg] = await db
    .select({ id: registrations.id, status: registrations.status })
    .from(registrations)
    .where(
      and(
        eq(registrations.userId, fixtures.member.id),
        eq(registrations.eventId, fixtures.paidEvent.id),
      ),
    )
    .limit(1);

  if (!reg) {
    throw new Error("No hay inscripción del member en el evento de pago");
  }

  const [ticket] = await db
    .select({
      code: tickets.code,
      signature: tickets.signature,
      status: tickets.status,
    })
    .from(tickets)
    .where(eq(tickets.registrationId, reg.id))
    .limit(1);

  if (!ticket?.code || !ticket.signature) {
    throw new Error("Ticket no emitido aún");
  }

  console.log(
    JSON.stringify({
      registrationId: reg.id,
      registrationStatus: reg.status,
      code: ticket.code,
      signature: ticket.signature,
      ticketStatus: ticket.status,
    }),
  );
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
