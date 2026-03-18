"use server";

import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";

const authIdentitySchema = z.object({
    email: z.string().trim().toLowerCase().email(),
});

export async function checkAuthIdentityByEmail(input: { email: string }) {
    const validated = authIdentitySchema.parse(input);

    const [user] = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.email, validated.email))
        .limit(1);

    return { exists: Boolean(user) };
}
