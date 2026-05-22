"use server";

import { z } from "zod";
import { randomInt, randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { env } from "@/env";
import { users, verifications } from "@/lib/db/schema";
import { sendPasswordChangedEmail, sendVerificationCodeEmail } from "@/lib/mail";

const authIdentitySchema = z.object({
    email: z.string().trim().toLowerCase().email(),
});

const verificationCodeSchema = z.object({
    email: z.string().trim().toLowerCase().email(),
    code: z.string().trim().regex(/^\d{6}$/),
});

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

    await sendVerificationCodeEmail({ email, name, code });
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

export async function sendVerificationCode(input: { email: string }) {
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

    await db.transaction(async (trx) => {
        await trx
            .update(users)
            .set({ emailVerified: true })
            .where(eq(users.email, validated.email));

        await trx.delete(verifications).where(eq(verifications.identifier, identifier));
    });

    return { verified: true };
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
