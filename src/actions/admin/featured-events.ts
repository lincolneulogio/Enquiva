"use server";

import { db } from "@/lib/db";
import { events } from "@/lib/db/schema";
import { eq, count } from "drizzle-orm";
import { requireSuperAdmin } from "@/lib/auth/guards";
import { revalidatePath } from "next/cache";

export async function toggleEventFeaturedAction(eventId: string, isFeatured: boolean) {
  await requireSuperAdmin();

  await db
    .update(events)
    .set({
      isFeatured,
      updatedAt: new Date(),
    })
    .where(eq(events.id, eventId));

  revalidatePath("/");
  revalidatePath("/events");
  revalidatePath("/admin/events");
  revalidatePath("/superadmin/events");

  return { success: true, isFeatured };
}

export async function getFeaturedEventsCountAction(): Promise<number> {
  await requireSuperAdmin();

  const [res] = await db
    .select({ count: count() })
    .from(events)
    .where(eq(events.isFeatured, true));

  return Number(res?.count ?? 0);
}
