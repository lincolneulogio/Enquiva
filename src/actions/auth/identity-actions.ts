"use server";

import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import {
  getSuperAdminRegisterGate,
  validateBootstrapSecret,
} from "@/lib/auth/platform-bootstrap";
import { OrganizationService } from "@/lib/organizations/organization.service";
import { assertPublicAuthRateLimit } from "./ratelimit";
import { storeSignupIntent } from "./signup-intent";

const authIdentitySchema = z.object({
  email: z.string().trim().toLowerCase().email(),
});

export async function getSuperAdminRegisterGateAction() {
  return getSuperAdminRegisterGate();
}

export async function preparePlatformOwnerSignup(input: {
  email: string;
  bootstrapSecret?: string;
}) {
  const email = authIdentitySchema.parse({ email: input.email }).email;
  const gate = await getSuperAdminRegisterGate();

  if (!gate.canRegister) {
    return {
      prepared: false as const,
      error: "La plataforma ya tiene un superadministrador configurado.",
    };
  }

  if (gate.requiresSecret) {
    try {
      validateBootstrapSecret(input.bootstrapSecret ?? "");
    } catch (error) {
      return {
        prepared: false as const,
        error:
          error instanceof Error
            ? error.message
            : "Clave de bootstrap inválida.",
      };
    }
  }

  await storeSignupIntent(email, { type: "platform_owner" });
  return { prepared: true as const };
}

export async function checkSuperAdminIdentity(input: { email: string }) {
  await assertPublicAuthRateLimit("superadmin-identity");
  const validated = authIdentitySchema.parse(input);

  const [user] = await db
    .select({ role: users.role, emailVerified: users.emailVerified })
    .from(users)
    .where(eq(users.email, validated.email))
    .limit(1);

  if (!user) {
    return { exists: false, isSuperAdmin: false, emailVerified: false };
  }

  return {
    exists: true,
    isSuperAdmin: user.role === "super_admin",
    emailVerified: Boolean(user.emailVerified),
  };
}

export async function checkAuthIdentityByEmail(input: { email: string }) {
  await assertPublicAuthRateLimit("auth-identity");
  const validated = authIdentitySchema.parse(input);

  const [user] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, validated.email))
    .limit(1);

  return { exists: Boolean(user) };
}

export async function validateOrganizerInviteAtSignup(inviteCode: string) {
  return OrganizationService.validateOrganizerInviteForSignup(inviteCode.trim().toUpperCase());
}
