"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { updatePasswordSchema, updateProfileSchema } from "@/lib/validations";
import { headers } from "next/headers";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

function getDashboardBasePath(role?: string | null) {
    if (role === "organizer") return "/organizer";
    if (role === "admin" || role === "super_admin") return "/admin";
    return "/member";
}

export async function updateCurrentUserProfile(input: unknown) {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) throw new Error("Unauthorized");

    const data = updateProfileSchema.parse(input);

    await db
        .update(users)
        .set({
            name: data.name.trim(),
            bio: data.bio?.trim() || null,
            image: data.image?.trim() || null,
            updatedAt: new Date(),
        })
        .where(eq(users.id, session.user.id));

    const basePath = getDashboardBasePath(session.user.role);
    revalidatePath(basePath);
    revalidatePath(`${basePath}/profile`);

    return { success: true };
}

export async function updateCurrentUserPassword(input: unknown) {
    const requestHeaders = await headers();
    const session = await auth.api.getSession({ headers: requestHeaders });
    if (!session?.user) throw new Error("Unauthorized");

    const data = updatePasswordSchema.parse(input);

    try {
        await auth.api.changePassword({
            headers: requestHeaders,
            body: {
                currentPassword: data.currentPassword,
                newPassword: data.newPassword,
                revokeOtherSessions: true,
            },
        });
    } catch (error) {
        if (error instanceof Error) {
            const message = error.message.toLowerCase();
            if (
                message.includes("invalid") ||
                message.includes("password") ||
                message.includes("credential")
            ) {
                throw new Error("La contraseña actual no es correcta.");
            }
        }
        throw new Error("No se pudo actualizar la contraseña. Intenta nuevamente.");
    }

    return { success: true };
}
