"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { requireAuthWithHeaders } from "@/lib/auth/guards";
import { normalizeRole } from "@/lib/auth/rbac";

export async function saveOrganizerCertificateSignatureAction(input: {
  signatureUrl?: string | null;
  signatureTitle?: string | null;
}) {
  const { user } = await requireAuthWithHeaders();
  const role = normalizeRole(user.role);
  if (role !== "admin" && role !== "super_admin" && role !== "organizer") {
    throw new Error("No autorizado");
  }

  const cleanUrl = input.signatureUrl?.trim() || null;
  const cleanTitle = input.signatureTitle?.trim() || null;

  await db
    .update(users)
    .set({
      signatureUrl: cleanUrl,
      signatureTitle: cleanTitle,
      updatedAt: new Date(),
    })
    .where(eq(users.id, user.id));

  revalidatePath("/organizer/settings");
  revalidatePath("/organizer/profile");
  revalidatePath("/member/certificates");

  return { success: true, signatureUrl: cleanUrl, signatureTitle: cleanTitle };
}
