import { z } from "zod";
import { isPlatformSpecialPlan } from "@/lib/billing/plans";

export const planSlugSchema = z
  .string()
  .trim()
  .toLowerCase()
  .regex(/^[a-z0-9_-]+$/, "Slug inválido")
  .refine((slug) => !isPlatformSpecialPlan(slug), {
    message: "Ese identificador está reservado para el plan especial del superadmin",
  });

const nullablePositiveInt = z.number().int().positive().nullable().optional();
const nonNegativeNumber = z.number().nonnegative();

export const createPlanSchema = z.object({
  slug: planSlugSchema,
  name: z.string().trim().min(2).max(120),
  description: z.string().trim().max(2000).optional(),
  priceMonthly: nonNegativeNumber,
  maxActiveEvents: nullablePositiveInt,
  maxAttendeesPerEvent: nullablePositiveInt,
  commissionPercent: nonNegativeNumber.optional(),
  commissionPerRegistration: nonNegativeNumber.optional(),
  maxBroadcastsPerMonth: nullablePositiveInt,
  maxAiMessagesPerMonth: nullablePositiveInt,
  maxOrganizers: nullablePositiveInt,
  featureCulqi: z.boolean().optional(),
  featureTransport: z.boolean().optional(),
  featureAi: z.boolean().optional(),
  featureExports: z.boolean().optional(),
  featureCustomBranding: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
});

export const updatePlanSchema = z.object({
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9_-]+$/, "Slug inválido")
    .optional(),
  name: z.string().trim().min(2).max(120).optional(),
  description: z.string().trim().max(2000).optional().nullable(),
  priceMonthly: nonNegativeNumber.optional(),
  maxActiveEvents: z.number().int().positive().nullable().optional(),
  maxAttendeesPerEvent: z.number().int().positive().nullable().optional(),
  commissionPercent: nonNegativeNumber.optional(),
  commissionPerRegistration: nonNegativeNumber.optional(),
  maxBroadcastsPerMonth: z.number().int().positive().nullable().optional(),
  maxAiMessagesPerMonth: z.number().int().positive().nullable().optional(),
  maxOrganizers: z.number().int().positive().nullable().optional(),
  featureCulqi: z.boolean().optional(),
  featureTransport: z.boolean().optional(),
  featureAi: z.boolean().optional(),
  featureExports: z.boolean().optional(),
  featureCustomBranding: z.boolean().optional(),
  isActive: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
});

export type CreatePlanInput = z.infer<typeof createPlanSchema>;
export type UpdatePlanInput = z.infer<typeof updatePlanSchema>;
