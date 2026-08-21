/**
 * Smoke del flujo crítico (staging / local):
 * registro → pago cash → aprobación → ticket firmado → check-in.
 *
 * Uso:
 *   pnpm run seed:staging
 *   pnpm run smoke:critical
 *
 * Opcional Culqi (solo valida config + capabilities, no cobra):
 *   SMOKE_CULQI=1 pnpm run smoke:critical
 */
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { payments, registrations, tickets } from "@/lib/db/schema";
import { RegistrationService } from "@/services/registrations/registration.service";
import { PaymentService } from "@/services/payments/payment.service";
import { TicketCheckInService } from "@/lib/tickets/check-in";
import {
  buildTicketPublicUrl,
  verifyTicketSignature,
} from "@/lib/tickets/signature";
import { isPlatformCulqiConfigured } from "@/lib/culqi/client";
import { parseCulqiPublicKey, parseCulqiSecretKey } from "@/lib/culqi/keys";
import { env } from "@/env";
import { STAGING_FIXTURES } from "./staging-constants";
import {
  loadStagingFixtures,
  resetMemberOnEvent,
  type StagingFixtures,
} from "./lib/staging-critical";

type Fixtures = StagingFixtures;

function loadFixtures(): Fixtures {
  return loadStagingFixtures();
}

function step(ok: boolean, label: string, detail?: string) {
  const mark = ok ? "✓" : "✗";
  console.log(`${mark} ${label}${detail ? ` — ${detail}` : ""}`);
  if (!ok) throw new Error(`Smoke falló: ${label}${detail ? ` (${detail})` : ""}`);
}

async function runPaidCashFlow(fixtures: Fixtures) {
  console.log("\n== Flujo pago (cash) ==");
  await resetMemberOnEvent(fixtures.member.id, fixtures.paidEvent.id);

  const reg = await RegistrationService.registerForEvent(
    fixtures.member.id,
    fixtures.member.email,
    STAGING_FIXTURES.member.name,
    { eventId: fixtures.paidEvent.id },
  );
  step(
    reg.status === "registered" && reg.requiresPayment === true,
    "Registro evento de pago",
    `registrationId=${reg.registrationId}`,
  );

  const paymentResult = await PaymentService.createPayment(fixtures.member.id, {
    registrationId: reg.registrationId,
    amount: Number(fixtures.paidEvent.price),
    currency: "PEN",
    method: "cash",
    reference: `SMOKE-${Date.now()}`,
    notes: "Smoke staging cash",
  });
  step(paymentResult.success === true, "Pago cash pendiente registrado");

  const [pendingPayment] = await db
    .select()
    .from(payments)
    .where(eq(payments.registrationId, reg.registrationId))
    .limit(1);
  step(
    pendingPayment?.status === "pending",
    "Pago en estado pending",
    pendingPayment?.id,
  );
  if (!pendingPayment) return;

  const approved = await PaymentService.updatePaymentStatus(
    fixtures.organizer.id,
    "organizer",
    {
      paymentId: pendingPayment.id,
      status: "approved",
      notes: "Aprobado por smoke staging",
    },
  );
  step(approved.payment.status === "approved", "Pago aprobado por organizer");

  const [ticket] = await db
    .select()
    .from(tickets)
    .where(eq(tickets.registrationId, reg.registrationId))
    .limit(1);

  step(Boolean(ticket), "Ticket emitido tras aprobación");
  if (!ticket) return;

  const sig = ticket.signature ?? "";
  step(verifyTicketSignature(ticket, sig), "Firma HMAC del ticket válida");

  const publicUrl = buildTicketPublicUrl(ticket.code, sig);
  step(publicUrl.includes(`/ticket/${ticket.code}?s=`), "URL pública del ticket", publicUrl);

  const checkIn = await TicketCheckInService.checkInByTicketCode(
    { code: ticket.code, signature: sig },
    {
      scannedByUserId: fixtures.organizer.id,
      scanLog: { ipAddress: "127.0.0.1", userAgent: "smoke-critical" },
    },
  );
  step(checkIn.success === true, "Check-in por código QR");

  const [regAfter] = await db
    .select({ status: registrations.status })
    .from(registrations)
    .where(eq(registrations.id, reg.registrationId))
    .limit(1);
  step(regAfter?.status === "checked_in", "Registro marcado checked_in");
}

async function runFreeTicketFlow(fixtures: Fixtures) {
  console.log("\n== Flujo gratis (ticket inmediato) ==");
  await resetMemberOnEvent(fixtures.member.id, fixtures.freeEvent.id);

  const reg = await RegistrationService.registerForEvent(
    fixtures.member.id,
    fixtures.member.email,
    STAGING_FIXTURES.member.name,
    { eventId: fixtures.freeEvent.id },
  );
  step(
    reg.status === "registered" && !reg.requiresPayment,
    "Registro evento gratis",
    `registrationId=${reg.registrationId}`,
  );

  const [ticket] = await db
    .select()
    .from(tickets)
    .where(eq(tickets.registrationId, reg.registrationId))
    .limit(1);
  step(Boolean(ticket?.signature), "Ticket gratis emitido con firma");
}

async function runCulqiConfigCheck() {
  console.log("\n== Culqi TEST (config) ==");
  const configured = isPlatformCulqiConfigured();
  step(configured, "CULQI_SECRET_KEY presente en env");

  const secret = env.CULQI_SECRET_KEY ?? "";
  const pub = env.NEXT_PUBLIC_CULQI_PUBLIC_KEY ?? "";
  const secretParsed = parseCulqiSecretKey(secret);
  step(secretParsed.ok, "Formato sk_test_/sk_live_ válido");
  if (secretParsed.ok) {
    step(secretParsed.env === "test", "Secret en modo TEST (sk_test_)", secretParsed.env);
  }

  if (pub) {
    const pubParsed = parseCulqiPublicKey(pub);
    step(pubParsed.ok, "Formato pk_test_/pk_live_ válido");
    if (pubParsed.ok && secretParsed.ok) {
      step(
        pubParsed.env === secretParsed.env,
        "Public/Secret mismo entorno",
        `${pubParsed.env}/${secretParsed.env}`,
      );
      step(pubParsed.env === "test", "Public key en modo TEST");
    }
  } else {
    console.log("⚠ NEXT_PUBLIC_CULQI_PUBLIC_KEY no definida — checkout browser no se podrá probar");
  }

  if (env.CULQI_WEBHOOK_SECRET) {
    step(env.CULQI_WEBHOOK_SECRET.length >= 8, "CULQI_WEBHOOK_SECRET configurado");
  } else {
    console.log("⚠ CULQI_WEBHOOK_SECRET vacío — obligatorio en prod si Culqi activo");
  }

  console.log(
    "  Manual restante: cobro real con tarjeta de prueba Culqi en /member/payments/new/…",
  );
}

async function main() {
  const fixtures = loadFixtures();
  console.log(`Smoke critical @ ${env.NEXT_PUBLIC_APP_URL}`);
  console.log(`Organizer ${fixtures.organizer.email} · Member ${fixtures.member.email}`);

  await runPaidCashFlow(fixtures);
  await runFreeTicketFlow(fixtures);

  if (process.env.SMOKE_CULQI === "1") {
    await runCulqiConfigCheck();
  } else {
    console.log("\n(Culqi config omitido — usa SMOKE_CULQI=1 para validar llaves TEST)");
  }

  console.log("\n✓ Flujo crítico OK — listo para validación UI / promoción a prod");
  process.exit(0);
}

main().catch((err) => {
  console.error("\n✗ Smoke critical falló");
  console.error(err);
  process.exit(1);
});
