"use server";

import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { env } from "@/env";
import { users } from "@/lib/db/schema";
import { sendPasswordChangedEmail } from "@/lib/mail";

const passwordResetSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
});

const passwordUpdateSchema = z.object({
  token: z.string().min(1),
  newPassword: z.string().min(8),
  email: z.string().email().optional(),
});

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
