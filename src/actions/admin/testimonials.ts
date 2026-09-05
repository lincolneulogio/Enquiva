"use server";

import { db } from "@/lib/db";
import { testimonials, type Testimonial, type NewTestimonial } from "@/lib/db/schema/marketing";
import { eq, asc, desc } from "drizzle-orm";
import { requireSuperAdmin } from "@/lib/auth/guards";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const testimonialSchema = z.object({
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  role: z.string().min(2, "El cargo o rol es obligatorio"),
  company: z.string().min(2, "La empresa u organización es obligatoria"),
  quote: z.string().min(10, "El testimonio debe tener al menos 10 caracteres"),
  avatarUrl: z.string().url("URL de avatar no válida").optional().or(z.literal("")),
  rating: z.coerce.number().int().min(1).max(5).default(5),
  isFeatured: z.boolean().default(true),
  sortOrder: z.coerce.number().int().default(0),
});

export async function getAdminTestimonialsAction(): Promise<Testimonial[]> {
  await requireSuperAdmin();
  return db
    .select()
    .from(testimonials)
    .orderBy(asc(testimonials.sortOrder), desc(testimonials.createdAt));
}

export async function createTestimonialAction(data: z.infer<typeof testimonialSchema>) {
  await requireSuperAdmin();

  const parsed = testimonialSchema.safeParse(data);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Datos inválidos",
    };
  }

  const values: NewTestimonial = {
    name: parsed.data.name,
    role: parsed.data.role,
    company: parsed.data.company,
    quote: parsed.data.quote,
    avatarUrl: parsed.data.avatarUrl && parsed.data.avatarUrl.trim() !== "" ? parsed.data.avatarUrl : null,
    rating: parsed.data.rating,
    isFeatured: parsed.data.isFeatured,
    sortOrder: parsed.data.sortOrder,
  };

  const [created] = await db.insert(testimonials).values(values).returning();

  revalidatePath("/");
  revalidatePath("/superadmin/testimonials");

  return { success: true, testimonial: created };
}

export async function updateTestimonialAction(id: string, data: Partial<z.infer<typeof testimonialSchema>>) {
  await requireSuperAdmin();

  const updateValues: Partial<NewTestimonial> = {
    updatedAt: new Date(),
  };

  if (data.name !== undefined) updateValues.name = data.name;
  if (data.role !== undefined) updateValues.role = data.role;
  if (data.company !== undefined) updateValues.company = data.company;
  if (data.quote !== undefined) updateValues.quote = data.quote;
  if (data.avatarUrl !== undefined) {
    updateValues.avatarUrl = data.avatarUrl && data.avatarUrl.trim() !== "" ? data.avatarUrl : null;
  }
  if (data.rating !== undefined) updateValues.rating = data.rating;
  if (data.isFeatured !== undefined) updateValues.isFeatured = data.isFeatured;
  if (data.sortOrder !== undefined) updateValues.sortOrder = data.sortOrder;

  const [updated] = await db
    .update(testimonials)
    .set(updateValues)
    .where(eq(testimonials.id, id))
    .returning();

  revalidatePath("/");
  revalidatePath("/superadmin/testimonials");

  return { success: true, testimonial: updated };
}

export async function toggleTestimonialFeaturedAction(id: string, isFeatured: boolean) {
  await requireSuperAdmin();

  await db
    .update(testimonials)
    .set({ isFeatured, updatedAt: new Date() })
    .where(eq(testimonials.id, id));

  revalidatePath("/");
  revalidatePath("/superadmin/testimonials");

  return { success: true, isFeatured };
}

export async function deleteTestimonialAction(id: string) {
  await requireSuperAdmin();

  await db.delete(testimonials).where(eq(testimonials.id, id));

  revalidatePath("/");
  revalidatePath("/superadmin/testimonials");

  return { success: true };
}
