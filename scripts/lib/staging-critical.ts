/**
 * Helpers compartidos seed/smoke/e2e/integration del flujo crítico staging.
 */
import { and, eq, inArray } from "drizzle-orm";
import { readFileSync, existsSync } from "node:fs";
import path from "node:path";
import { db } from "@/lib/db";
import {
  payments,
  registrations,
  scanLogs,
  tickets,
} from "@/lib/db/schema";

export type StagingFixtures = {
  organizer: { id: string; email: string; password?: string };
  member: { id: string; email: string; password?: string };
  paidEvent: { id: string; slug: string; price: string };
  freeEvent: { id: string; slug: string };
};

export function loadStagingFixtures(): StagingFixtures {
  const file = path.join(process.cwd(), "e2e", ".staging-fixtures.json");
  if (!existsSync(file)) {
    throw new Error(
      "Falta e2e/.staging-fixtures.json. Ejecuta primero: pnpm run seed:staging",
    );
  }
  return JSON.parse(readFileSync(file, "utf8")) as StagingFixtures;
}

export async function resetMemberOnEvent(memberId: string, eventId: string) {
  const regs = await db
    .select({ id: registrations.id })
    .from(registrations)
    .where(and(eq(registrations.userId, memberId), eq(registrations.eventId, eventId)));

  if (regs.length === 0) return;

  const regIds = regs.map((r) => r.id);
  const ticketRows = await db
    .select({ id: tickets.id })
    .from(tickets)
    .where(inArray(tickets.registrationId, regIds));

  if (ticketRows.length > 0) {
    await db
      .delete(scanLogs)
      .where(inArray(scanLogs.ticketId, ticketRows.map((t) => t.id)));
  }

  await db.delete(tickets).where(inArray(tickets.registrationId, regIds));
  await db.delete(payments).where(inArray(payments.registrationId, regIds));
  await db.delete(registrations).where(inArray(registrations.id, regIds));
}

export async function getLatestTicketForRegistration(registrationId: string) {
  const [ticket] = await db
    .select()
    .from(tickets)
    .where(eq(tickets.registrationId, registrationId))
    .limit(1);
  return ticket ?? null;
}

export async function getLatestPaymentForRegistration(registrationId: string) {
  const [payment] = await db
    .select()
    .from(payments)
    .where(eq(payments.registrationId, registrationId))
    .limit(1);
  return payment ?? null;
}

export async function getRegistrationStatus(registrationId: string) {
  const [row] = await db
    .select({ status: registrations.status })
    .from(registrations)
    .where(eq(registrations.id, registrationId))
    .limit(1);
  return row?.status ?? null;
}
