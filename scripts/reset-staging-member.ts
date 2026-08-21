/**
 * Resetea la inscripción del member E2E en el evento de pago (para Playwright).
 * Uso: pnpm exec tsx --env-file=.env --tsconfig tsconfig.json ./scripts/reset-staging-member.ts
 */
import {
  loadStagingFixtures,
  resetMemberOnEvent,
} from "./lib/staging-critical";

async function main() {
  const fixtures = loadStagingFixtures();
  await resetMemberOnEvent(fixtures.member.id, fixtures.paidEvent.id);
  console.log(
    JSON.stringify({
      ok: true,
      memberId: fixtures.member.id,
      eventId: fixtures.paidEvent.id,
    }),
  );
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
