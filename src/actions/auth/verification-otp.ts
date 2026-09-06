"use server";

import { z } from "zod";
import { randomInt, randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users, verifications } from "@/lib/db/schema";
import { sendVerificationCodeEmail, sendWelcomeEmail } from "@/lib/mail";
import { getLocale } from "@/lib/i18n/server";
import { OrganizationService, type SignupIntentPayload } from "@/lib/organizations/organization.service";
import { canUsePlatformOwnerSignupIntent } from "@/lib/auth/signup-intent-policy";
import { assertPublicAuthRateLimit, assertVerificationCodeRateLimit } from "./ratelimit";
import {
  signupIntentPayloadSchema,
  signupIntentIdentifier,
  storeSignupIntent,
  peekSignupIntent,
  consumeSignupIntent,
  resolveAccountType,
  applySignupIntent,
} from "./signup-intent";

const authIdentitySchema = z.object({
  email: z.string().trim().toLowerCase().email(),
});

const verificationCodeSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  code: z.string().trim().regex(/^\d{6}$/),
});

function verificationIdentifier(email: string) {
  return `email-verification:${email.toLowerCase()}`;
}

async function issueVerificationCode(email: string, name?: string | null) {
  const code = randomInt(100000, 1000000).toString();
  const identifier = verificationIdentifier(email);

  await db.delete(verifications).where(eq(verifications.identifier, identifier));
  await db.insert(verifications).values({
    id: randomUUID(),
    identifier,
    value: code,
    expiresAt: new Date(Date.now() + 15 * 60 * 1000),
  });

  const locale = await getLocale();
  await sendVerificationCodeEmail({ email, name, code, locale });
}

export async function sendVerificationCode(input: {
  email: string;
  signupPayload?: SignupIntentPayload;
}) {
  await assertPublicAuthRateLimit("send-otp");
  const validated = authIdentitySchema.parse(input);

  const [user] = await db
    .select({ name: users.name, emailVerified: users.emailVerified, role: users.role })
    .from(users)
    .where(eq(users.email, validated.email))
    .limit(1);

  if (!user) throw new Error("No encontramos una cuenta con ese correo.");
  if (user.emailVerified) throw new Error("Esta cuenta ya está verificada.");

  if (input.signupPayload) {
    const payload = signupIntentPayloadSchema.parse(input.signupPayload);
    if (payload.type === "platform_owner") {
      const preparedIntent = await peekSignupIntent(validated.email);
      if (
        !canUsePlatformOwnerSignupIntent({
          preparedIntentType: preparedIntent.type,
          existingUserRole: user.role,
        })
      ) {
        throw new Error("PLATFORM_OWNER_SIGNUP_NOT_PREPARED");
      }
      if (preparedIntent.type !== "platform_owner") {
        await storeSignupIntent(validated.email, { type: "platform_owner" });
      }
    } else if (payload.type === "organizer" && payload.inviteCode) {
      try {
        await OrganizationService.validateOrganizerInviteForSignup(payload.inviteCode.trim().toUpperCase());
      } catch {
        throw new Error("INVITE_CODE_INVALID");
      }
      await storeSignupIntent(validated.email, payload);
    } else {
      await storeSignupIntent(validated.email, payload);
    }
  } else {
    const [existingIntent] = await db
      .select({ value: verifications.value })
      .from(verifications)
      .where(eq(verifications.identifier, signupIntentIdentifier(validated.email)))
      .limit(1);
    if (!existingIntent) {
      await storeSignupIntent(validated.email, { type: "member" });
    }
  }

  await issueVerificationCode(validated.email, user.name);
  return { sent: true };
}

export async function confirmVerificationCode(input: { email: string; code: string }) {
  const validated = verificationCodeSchema.parse(input);
  await assertVerificationCodeRateLimit(validated.email);
  const identifier = verificationIdentifier(validated.email);
  const normalizedCode = validated.code.trim();
  const locale = await getLocale();

  const [existingUser] = await db
    .select({ id: users.id, role: users.role, name: users.name, emailVerified: users.emailVerified, organizationId: users.organizationId })
    .from(users)
    .where(eq(users.email, validated.email))
    .limit(1);

  if (!existingUser) throw new Error("No encontramos una cuenta con ese correo.");

  if (existingUser.emailVerified) {
    const leftoverIntent = await peekSignupIntent(validated.email);
    try {
      await applySignupIntent({
        userId: existingUser.id,
        userRole: existingUser.role,
        userName: existingUser.name,
        email: validated.email,
        signupIntent: leftoverIntent,
        locale,
      });
      await consumeSignupIntent(validated.email);
    } catch {
      // Si ya tiene entidad/rol, el leftover puede fallar — no bloquear el login.
    }

    const [fresh] = await db.select({ role: users.role }).from(users).where(eq(users.id, existingUser.id)).limit(1);
    const accountType =
      fresh?.role === "super_admin" ? ("platform_owner" as const) :
      fresh?.role === "admin" ? ("entity_admin" as const) :
      fresh?.role === "organizer" ? ("organizer" as const) :
      resolveAccountType(leftoverIntent);

    return {
      verified: true,
      alreadyVerified: true,
      accountType,
      loginPath: accountType === "platform_owner" ? "/superadmin/login" : "/login",
    };
  }

  const [verification] = await db.select().from(verifications).where(eq(verifications.identifier, identifier)).limit(1);
  if (!verification) throw new Error("VERIFICATION_CODE_NOT_FOUND");
  if (verification.expiresAt < new Date()) throw new Error("VERIFICATION_CODE_EXPIRED");
  if (verification.value !== normalizedCode) throw new Error("VERIFICATION_CODE_INVALID");

  const signupIntent = await peekSignupIntent(validated.email);
  await applySignupIntent({
    userId: existingUser.id,
    userRole: existingUser.role,
    userName: existingUser.name,
    email: validated.email,
    signupIntent,
    locale,
  });

  await db.transaction(async (trx) => {
    await trx.update(users).set({ emailVerified: true }).where(eq(users.email, validated.email));
    await trx.delete(verifications).where(eq(verifications.identifier, identifier));
    await trx.delete(verifications).where(eq(verifications.identifier, signupIntentIdentifier(validated.email)));
  });

  const accountType = resolveAccountType(signupIntent);
  try {
    await sendWelcomeEmail({ email: validated.email, name: existingUser.name, accountType, locale });
  } catch {
    // El alta ya quedó; no fallar por el correo de bienvenida.
  }

  return {
    verified: true,
    alreadyVerified: false,
    accountType,
    loginPath: signupIntent.type === "platform_owner" ? "/superadmin/login" : "/login",
  };
}

export async function resendVerificationCode(input: { email: string }) {
  await assertPublicAuthRateLimit("resend-otp");
  const validated = authIdentitySchema.parse(input);

  const [user] = await db
    .select({ emailVerified: users.emailVerified, role: users.role })
    .from(users)
    .where(eq(users.email, validated.email))
    .limit(1);

  if (!user) throw new Error("No encontramos una cuenta con ese correo.");
  if (user.emailVerified) {
    return {
      sent: false,
      alreadyVerified: true as const,
      loginPath: user.role === "super_admin" ? "/superadmin/login" : "/login",
    };
  }

  await sendVerificationCode(input);
  return { sent: true as const, alreadyVerified: false as const };
}
