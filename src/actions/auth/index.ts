"use server";

import { z } from "zod";
import { randomInt, randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { env } from "@/env";
import { users, verifications } from "@/lib/db/schema";
import { sendPasswordChangedEmail, sendVerificationCodeEmail, sendWelcomeEmail } from "@/lib/mail";
import { getLocale } from "@/lib/i18n/server";
import type { Locale } from "@/lib/i18n/core";
import {
    authIdentityRatelimit,
    enforceRateLimit,
    otpVerificationRatelimit,
} from "@/lib/redis";

const authIdentitySchema = z.object({
    email: z.string().trim().toLowerCase().email(),
});

const verificationCodeSchema = z.object({
    email: z.string().trim().toLowerCase().email(),
    code: z.string().trim().regex(/^\d{6}$/),
});

import { OrganizationService, type SignupIntentPayload } from "@/lib/organizations/organization.service";
import {
    claimPlatformOwner,
    getSuperAdminRegisterGate,
    validateBootstrapSecret,
} from "@/lib/auth/platform-bootstrap";
import { canUsePlatformOwnerSignupIntent } from "@/lib/auth/signup-intent-policy";

const signupIntentPayloadSchema = z.discriminatedUnion("type", [
    z.object({ type: z.literal("member") }),
    z.object({ type: z.literal("platform_owner") }),
    z.object({
        type: z.literal("organizer"),
        inviteCode: z.string().trim().min(4).max(20).optional(),
    }),
    z.object({
        type: z.literal("entity_admin"),
        orgName: z.string().trim().min(2).max(120),
    }),
]);

/** Actions públicas de auth: rate-limit por IP (no requieren sesión). */
async function assertPublicAuthRateLimit(bucket: string) {
    const headersList = await headers();
    const ip = headersList.get("x-forwarded-for")?.split(",")[0]?.trim() || "anonymous";
    const rate = await enforceRateLimit(authIdentityRatelimit, `${bucket}:${ip}`, {
        failClosed: false,
    });
    if (!rate.ok) {
        throw new Error("Demasiados intentos. Espera un momento e inténtalo de nuevo.");
    }
}

async function assertVerificationCodeRateLimit(email: string) {
    const headersList = await headers();
    const ip = headersList.get("x-forwarded-for")?.split(",")[0]?.trim() || "anonymous";
    const keys = [`confirm-otp:ip:${ip}`, `confirm-otp:email:${email.toLowerCase()}`];

    const results = await Promise.all(
        keys.map((key) =>
            enforceRateLimit(otpVerificationRatelimit, key, {
                failClosed: true,
            }),
        ),
    );
    if (results.some((result) => !result.ok)) {
        throw new Error("Demasiados intentos. Espera un momento e inténtalo de nuevo.");
    }
}

function signupIntentIdentifier(email: string) {
    return `signup-intent:${email.toLowerCase()}`;
}

async function storeSignupIntent(email: string, payload: SignupIntentPayload) {
    const identifier = signupIntentIdentifier(email);
    await db.delete(verifications).where(eq(verifications.identifier, identifier));
    await db.insert(verifications).values({
        id: randomUUID(),
        identifier,
        value: OrganizationService.serializeSignupIntent(payload),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });
}

async function peekSignupIntent(email: string): Promise<SignupIntentPayload> {
    const identifier = signupIntentIdentifier(email);
    const [row] = await db
        .select()
        .from(verifications)
        .where(eq(verifications.identifier, identifier))
        .limit(1);

    if (!row || row.expiresAt < new Date()) {
        return { type: "member" };
    }

    return OrganizationService.parseSignupIntent(row.value);
}

async function consumeSignupIntent(email: string): Promise<SignupIntentPayload> {
    const identifier = signupIntentIdentifier(email);
    const [row] = await db
        .select()
        .from(verifications)
        .where(eq(verifications.identifier, identifier))
        .limit(1);

    if (!row || row.expiresAt < new Date()) {
        await db.delete(verifications).where(eq(verifications.identifier, identifier));
        return { type: "member" };
    }

    await db.delete(verifications).where(eq(verifications.identifier, identifier));
    return OrganizationService.parseSignupIntent(row.value);
}

function resolveAccountType(signupIntent: SignupIntentPayload) {
    const hasOrganizerInvite =
        signupIntent.type === "organizer" && Boolean(signupIntent.inviteCode?.trim());

    if (signupIntent.type === "platform_owner") return "platform_owner" as const;
    if (signupIntent.type === "entity_admin") return "entity_admin" as const;
    if (signupIntent.type === "organizer") {
        return hasOrganizerInvite ? ("organizer_pending" as const) : ("organizer" as const);
    }
    return "member" as const;
}

async function applySignupIntent(input: {
    userId: string;
    userRole: string | null;
    userName: string | null;
    email: string;
    signupIntent: SignupIntentPayload;
    locale: Locale;
}) {
    const { userId, userRole, userName, email, signupIntent, locale } = input;
    let joinedOrg: Awaited<
        ReturnType<typeof OrganizationService.requestJoinOrganizationAsOrganizer>
    > | null = null;

    if (signupIntent.type === "platform_owner") {
        await claimPlatformOwner(userId);
    } else if (userRole === "member" || userRole === "admin" || userRole === "organizer") {
        // member = alta fresca; admin/organizer = reintento tras fallo parcial
        if (signupIntent.type === "entity_admin") {
            const [existing] = await db
                .select({ organizationId: users.organizationId, role: users.role })
                .from(users)
                .where(eq(users.id, userId))
                .limit(1);

            if (!existing?.organizationId || existing.role !== "admin") {
                await OrganizationService.createOrganizationForAdmin({
                    name: signupIntent.orgName,
                    ownerUserId: userId,
                });
            }
        } else if (signupIntent.type === "organizer" && userRole === "member") {
            const inviteCode = signupIntent.inviteCode?.trim();
            if (inviteCode) {
                joinedOrg = await OrganizationService.requestJoinOrganizationAsOrganizer({
                    userId,
                    inviteCode,
                });
            } else {
                await OrganizationService.activateIndependentOrganizer({ userId });
            }
        }
    }

    if (joinedOrg) {
        const { notifyEntityAdminOfOrganizerRequest } = await import(
            "@/lib/organizations/organizer-request-notifications"
        );
        await notifyEntityAdminOfOrganizerRequest({
            org: joinedOrg,
            requesterName: userName ?? email,
            requesterEmail: email,
            locale,
        });
    }
}

const passwordResetSchema = z.object({
    email: z.string().trim().toLowerCase().email(),
});

const passwordUpdateSchema = z.object({
    token: z.string().min(1),
    newPassword: z.string().min(8),
    email: z.string().email().optional(),
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

    if (!user) {
        throw new Error("No encontramos una cuenta con ese correo.");
    }

    if (user.emailVerified) {
        throw new Error("Esta cuenta ya está verificada.");
    }

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
            // La intención privilegiada solo puede crearla preparePlatformOwnerSignup.
            // Una cuenta que ya es super_admin puede regenerarla solo para completar
            // su verificación; esto no eleva privilegios.
            if (preparedIntent.type !== "platform_owner") {
                await storeSignupIntent(validated.email, { type: "platform_owner" });
            }
        } else if (payload.type === "organizer" && payload.inviteCode) {
            try {
                await OrganizationService.validateOrganizerInviteForSignup(
                    payload.inviteCode.trim().toUpperCase(),
                );
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

export async function validateOrganizerInviteAtSignup(inviteCode: string) {
    return OrganizationService.validateOrganizerInviteForSignup(inviteCode.trim().toUpperCase());
}

export async function confirmVerificationCode(input: { email: string; code: string }) {
    const validated = verificationCodeSchema.parse(input);
    await assertVerificationCodeRateLimit(validated.email);
    const identifier = verificationIdentifier(validated.email);
    const normalizedCode = validated.code.trim();
    const locale = await getLocale();

    const [existingUser] = await db
        .select({
            id: users.id,
            role: users.role,
            name: users.name,
            emailVerified: users.emailVerified,
            organizationId: users.organizationId,
        })
        .from(users)
        .where(eq(users.email, validated.email))
        .limit(1);

    if (!existingUser) {
        throw new Error("No encontramos una cuenta con ese correo.");
    }

    // Idempotente: ya verificada → completar onboarding pendiente si hace falta y mandar a login.
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

        const [fresh] = await db
            .select({ role: users.role })
            .from(users)
            .where(eq(users.id, existingUser.id))
            .limit(1);

        const accountType =
            fresh?.role === "super_admin"
                ? ("platform_owner" as const)
                : fresh?.role === "admin"
                  ? ("entity_admin" as const)
                  : fresh?.role === "organizer"
                    ? ("organizer" as const)
                    : resolveAccountType(leftoverIntent);

        return {
            verified: true,
            alreadyVerified: true,
            accountType,
            loginPath: accountType === "platform_owner" ? "/superadmin/login" : "/login",
        };
    }

    const [verification] = await db
        .select()
        .from(verifications)
        .where(eq(verifications.identifier, identifier))
        .limit(1);

    if (!verification) {
        throw new Error("VERIFICATION_CODE_NOT_FOUND");
    }

    if (verification.expiresAt < new Date()) {
        throw new Error("VERIFICATION_CODE_EXPIRED");
    }

    if (verification.value !== normalizedCode) {
        throw new Error("VERIFICATION_CODE_INVALID");
    }

    const signupIntent = await peekSignupIntent(validated.email);

    // Primero onboarding (org/rol). Solo si OK, marcar email verificado.
    await applySignupIntent({
        userId: existingUser.id,
        userRole: existingUser.role,
        userName: existingUser.name,
        email: validated.email,
        signupIntent,
        locale,
    });

    await db.transaction(async (trx) => {
        await trx
            .update(users)
            .set({ emailVerified: true })
            .where(eq(users.email, validated.email));

        await trx.delete(verifications).where(eq(verifications.identifier, identifier));
        await trx
            .delete(verifications)
            .where(eq(verifications.identifier, signupIntentIdentifier(validated.email)));
    });

    const accountType = resolveAccountType(signupIntent);

    try {
        await sendWelcomeEmail({
            email: validated.email,
            name: existingUser.name,
            accountType,
            locale,
        });
    } catch {
        // El alta ya quedó; no fallar la verificación por el correo de bienvenida.
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

    if (!user) {
        throw new Error("No encontramos una cuenta con ese correo.");
    }

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

export async function requestPasswordReset(input: { email: string }) {
    const validated = passwordResetSchema.parse(input);
    const response = await fetch(new URL("/api/auth/request-password-reset", env.NEXT_PUBLIC_APP_URL), {
        method: "POST",
        headers: {
            "content-type": "application/json",
        },
        body: JSON.stringify({
            email: validated.email,
            redirectTo: `${env.NEXT_PUBLIC_APP_URL}/reset-password?email=${encodeURIComponent(validated.email)}`,
        }),
    });

    if (!response.ok) {
        throw new Error("No fue posible enviar el correo de recuperación.");
    }

    return { sent: true };
}

export async function resetPasswordWithToken(input: { token: string; newPassword: string; email?: string }) {
    const validated = passwordUpdateSchema.parse(input);
    const response = await fetch(new URL("/api/auth/reset-password", env.NEXT_PUBLIC_APP_URL), {
        method: "POST",
        headers: {
            "content-type": "application/json",
        },
        body: JSON.stringify({
            token: validated.token,
            newPassword: validated.newPassword,
        }),
    });

    if (!response.ok) {
        throw new Error("No fue posible actualizar la contraseña.");
    }

    if (validated.email) {
        const [user] = await db
            .select({ name: users.name })
            .from(users)
            .where(eq(users.email, validated.email))
            .limit(1);

        await sendPasswordChangedEmail({ email: validated.email, name: user?.name });
    }

    return { updated: true };
}
