"use server";

import { z } from "zod";
import { randomInt, randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { env } from "@/env";
import { users, verifications } from "@/lib/db/schema";
import { sendPasswordChangedEmail, sendVerificationCodeEmail } from "@/lib/mail";
import { getLocale } from "@/lib/i18n/server";

const authIdentitySchema = z.object({
    email: z.string().trim().toLowerCase().email(),
});

const verificationCodeSchema = z.object({
    email: z.string().trim().toLowerCase().email(),
    code: z.string().trim().regex(/^\d{6}$/),
});

import { OrganizationService, type SignupIntentPayload } from "@/lib/organizations/organization.service";

const signupIntentPayloadSchema = z.discriminatedUnion("type", [
    z.object({ type: z.literal("member") }),
    z.object({
        type: z.literal("organizer"),
        inviteCode: z.string().trim().min(4).max(20),
    }),
    z.object({
        type: z.literal("entity_admin"),
        orgName: z.string().trim().min(2).max(120),
    }),
]);

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

export async function checkAuthIdentityByEmail(input: { email: string }) {
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
    const validated = authIdentitySchema.parse(input);

    const [user] = await db
        .select({ name: users.name, emailVerified: users.emailVerified })
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
        if (payload.type === "organizer" && payload.inviteCode) {
            const org = await OrganizationService.getByInviteCode(payload.inviteCode);
            if (!org) throw new Error("Código de entidad inválido. Pide el código a tu administrador.");
        }
        await storeSignupIntent(validated.email, payload);
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
    const identifier = verificationIdentifier(validated.email);

    const [verification] = await db
        .select()
        .from(verifications)
        .where(eq(verifications.identifier, identifier))
        .limit(1);

    if (!verification || verification.value !== validated.code || verification.expiresAt < new Date()) {
        throw new Error("Código de confirmación inválido o vencido.");
    }

    const signupIntent = await consumeSignupIntent(validated.email);

    await db.transaction(async (trx) => {
        await trx
            .update(users)
            .set({ emailVerified: true })
            .where(eq(users.email, validated.email));

        await trx.delete(verifications).where(eq(verifications.identifier, identifier));
    });

    const [user] = await db
        .select({ id: users.id, role: users.role })
        .from(users)
        .where(eq(users.email, validated.email))
        .limit(1);

    if (user && user.role === "member") {
        if (signupIntent.type === "entity_admin") {
            await OrganizationService.createOrganizationForAdmin({
                name: signupIntent.orgName,
                ownerUserId: user.id,
            });
        } else if (signupIntent.type === "organizer") {
            await OrganizationService.joinOrganizationAsOrganizer({
                userId: user.id,
                inviteCode: signupIntent.inviteCode.trim(),
            });
        }
    }

    const accountType =
        signupIntent.type === "entity_admin"
            ? "entity_admin"
            : signupIntent.type === "organizer"
              ? "organizer"
              : "member";

    return { verified: true, accountType };
}

export async function resendVerificationCode(input: { email: string }) {
    return sendVerificationCode(input);
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
