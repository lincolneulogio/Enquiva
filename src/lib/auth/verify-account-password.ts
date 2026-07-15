import { db } from "@/lib/db";
import { accounts } from "@/lib/db/schema";
import { and, eq, inArray } from "drizzle-orm";
import { verifyPassword } from "better-auth/crypto";
import { passwordVerifyRatelimit } from "@/lib/redis";

export type PasswordVerifyErrorCode =
  | "PASSWORD_REQUIRED"
  | "PASSWORD_INVALID"
  | "PASSWORD_NOT_SET"
  | "PASSWORD_RATE_LIMITED";

export class AccountPasswordError extends Error {
  code: PasswordVerifyErrorCode;

  constructor(code: PasswordVerifyErrorCode) {
    super(code);
    this.name = "AccountPasswordError";
    this.code = code;
  }
}

export async function hasLocalPasswordAccount(userId: string): Promise<boolean> {
  const [account] = await db
    .select({ password: accounts.password })
    .from(accounts)
    .where(
      and(
        eq(accounts.userId, userId),
        inArray(accounts.providerId, ["email", "credential"]),
      ),
    )
    .limit(1);
  return Boolean(account?.password);
}

/**
 * Verifies the user's local email/password credential for destructive actions.
 * Always requires a password; OAuth-only accounts get PASSWORD_NOT_SET.
 */
export async function verifyAccountPassword(userId: string, password: string | undefined) {
  const limited = await passwordVerifyRatelimit.limit(userId);
  if (!limited.success) {
    throw new AccountPasswordError("PASSWORD_RATE_LIMITED");
  }

  if (!password?.trim()) {
    throw new AccountPasswordError("PASSWORD_REQUIRED");
  }

  const [account] = await db
    .select({ password: accounts.password })
    .from(accounts)
    .where(
      and(
        eq(accounts.userId, userId),
        inArray(accounts.providerId, ["email", "credential"]),
      ),
    )
    .limit(1);

  if (!account?.password) {
    throw new AccountPasswordError("PASSWORD_NOT_SET");
  }

  const isValid = await verifyPassword({
    hash: account.password,
    password: password.trim(),
  });

  if (!isValid) {
    throw new AccountPasswordError("PASSWORD_INVALID");
  }
}
