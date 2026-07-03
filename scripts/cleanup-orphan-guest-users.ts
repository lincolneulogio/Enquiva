/**
 * Limpia usuarios guest_* y offline_* sin inscripciones activas.
 * Idempotente.
 */
import { cleanupOrphanGuestUsers } from "@/lib/events/lifecycle";

async function main() {
  const result = await cleanupOrphanGuestUsers();
  console.log(
    `Orphan guest cleanup: scanned ${result.scanned}, deleted ${result.deleted}`,
  );
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Cleanup failed:", err);
    process.exit(1);
  });
