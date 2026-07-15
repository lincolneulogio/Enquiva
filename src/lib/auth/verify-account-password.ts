import { db } from "@/lib/db";
import { accounts } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";
import { verifyPassword } from "better-auth/crypto";

/**
 * Verifies the user's local email/password credential (same pattern as registration cancel).
 * If the account has no local password (e.g. OAuth-only), verification is skipped.
 */
export async function verifyAccountPassword(userId: string, password: string | undefined) {
  const [account] = await db
    .select({ password: accounts.password })
    .from(accounts)
    .where(and(eq(accounts.userId, userId), eq(accounts.providerId, "email")))
    .limit(1);

  if (!account?.password) {
    return;
  }

  if (!password?.trim()) {
    throw new Error("PASSWORD_REQUIRED");
  }

  const isValid = await verifyPassword({
    hash: account.password,
    password,
  });

  if (!isValid) {
    throw new Error("PASSWORD_INVALID");
  }
}
