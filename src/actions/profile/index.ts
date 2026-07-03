"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { updatePasswordSchema, updateProfileSchema } from "@/lib/validations";
import { headers } from "next/headers";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { normalizePeruPhone } from "@/lib/utils";
import { z } from "zod";

function getDashboardBasePath(role?: string | null) {
    if (role === "organizer") return "/organizer";
    if (role === "admin" || role === "super_admin") return "/admin";
    return "/member";
}

export async function updateCurrentUserProfile(input: unknown) {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) throw new Error("Unauthorized");

    let data;
    try {
        data = updateProfileSchema.parse(input);
    } catch (error) {
        if (error instanceof z.ZodError) {
            throw new Error(error.issues[0]?.message ?? "Datos de perfil inválidos");
        }
        throw error;
    }

    const phone = data.phone?.trim() ? normalizePeruPhone(data.phone) : null;

    // Obtener la imagen anterior del usuario para purgarla de UploadThing si se actualiza o borra
    const [existingUser] = await db
        .select({ image: users.image })
        .from(users)
        .where(eq(users.id, session.user.id))
        .limit(1);

    await db
        .update(users)
        .set({
            name: data.name.trim(),
            phone,
            address: data.address?.trim() || null,
            bio: data.bio?.trim() || null,
            image: data.image?.trim() || null,
            updatedAt: new Date(),
        })
        .where(eq(users.id, session.user.id));

    // Purga asíncrona en segundo plano del avatar reemplazado o eliminado de UploadThing
    if (existingUser && existingUser.image && existingUser.image !== data.image) {
        const { deleteUploadThingFile } = await import("@/lib/uploadthing/delete");
        deleteUploadThingFile(existingUser.image).catch((err) =>
            console.error("Failed to delete old user avatar from UploadThing:", err)
        );
    }

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
