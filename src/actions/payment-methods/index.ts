"use server";

import { db } from "@/lib/db";
import { paymentMethods, eventPaymentMethods } from "@/lib/db/schema";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";

async function requireAdminOrOrganizer() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) throw new Error("Unauthorized");
  if (!["admin", "super_admin", "organizer"].includes(session.user.role ?? "")) {
    throw new Error("Forbidden");
  }
  return session.user;
}

export async function getPaymentMethods() {
  await requireAdminOrOrganizer();
  return db.select().from(paymentMethods).orderBy(paymentMethods.createdAt);
}

export async function getActivePaymentMethods() {
  return db.select().from(paymentMethods).where(eq(paymentMethods.isActive, true)).orderBy(paymentMethods.createdAt);
}

export async function getEventPaymentMethods(eventId: string) {
  const rows = await db
    .select({ method: paymentMethods })
    .from(eventPaymentMethods)
    .innerJoin(paymentMethods, eq(eventPaymentMethods.paymentMethodId, paymentMethods.id))
    .where(eq(eventPaymentMethods.eventId, eventId));
  return rows.map((r) => r.method);
}

export async function createPaymentMethod(input: {
  type: "yape" | "plin" | "cash";
  label: string;
  qrCodeUrl?: string | null;
  phone?: string | null;
  holderName: string;
}) {
  await requireAdminOrOrganizer();
  await db.insert(paymentMethods).values({ ...input, isActive: true });
  revalidatePath("/(dashboard)/admin/payment-methods");
  revalidatePath("/(dashboard)/organizer/payment-methods");
  return { success: true };
}

export async function updatePaymentMethod(
  id: string,
  input: {
    type?: "yape" | "plin" | "cash";
    label?: string;
    qrCodeUrl?: string | null;
    phone?: string | null;
    holderName?: string;
    isActive?: boolean;
  }
) {
  await requireAdminOrOrganizer();
  await db.update(paymentMethods).set({ ...input, updatedAt: new Date() }).where(eq(paymentMethods.id, id));
  revalidatePath("/(dashboard)/admin/payment-methods");
  revalidatePath("/(dashboard)/organizer/payment-methods");
  return { success: true };
}

export async function deletePaymentMethod(id: string) {
  await requireAdminOrOrganizer();
  await db.delete(paymentMethods).where(eq(paymentMethods.id, id));
  revalidatePath("/(dashboard)/admin/payment-methods");
  revalidatePath("/(dashboard)/organizer/payment-methods");
  return { success: true };
}

export async function setEventPaymentMethods(eventId: string, methodIds: string[]) {
  await requireAdminOrOrganizer();
  await db.delete(eventPaymentMethods).where(eq(eventPaymentMethods.eventId, eventId));
  if (methodIds.length > 0) {
    await db.insert(eventPaymentMethods).values(methodIds.map((paymentMethodId) => ({ eventId, paymentMethodId })));
  }
  revalidatePath(`/events/${eventId}`);
  return { success: true };
}
