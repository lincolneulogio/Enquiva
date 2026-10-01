import { z } from "zod";

export const paymentStatusValues = ["pending", "approved", "rejected"] as const;

export const createPaymentSchema = z.object({
  registrationId: z.string().uuid(),
  amount: z.number().positive("Amount must be greater than zero"),
  currency: z.string().length(3, "Use ISO currency code").transform((value) => value.toUpperCase()),
  method: z.string().min(3).max(100),
  reference: z.string().max(100).optional(),
  receiptUrl: z
    .string()
    .refine(
      (val) => {
        if (val.startsWith("/")) return true;
        try {
          const u = new URL(val);
          return u.protocol === "http:" || u.protocol === "https:";
        } catch {
          return false;
        }
      },
      { message: "Ingresa una URL válida" }
    )
    .optional(),
  receiptFileName: z.string().max(200).optional(),
  notes: z.string().max(500).optional(),
});

export const updatePaymentStatusSchema = z.object({
  paymentId: z.string().uuid(),
  status: z.enum(paymentStatusValues),
  notes: z.string().max(500).optional(),
});

export const culqiChargeBodySchema = z.object({
  paymentId: z.string().uuid(),
  sourceId: z.string().min(1, "sourceId es requerido"),
});

export const culqiOrderBodySchema = z.object({
  paymentId: z.string().uuid(),
});

export type CreatePaymentInput = z.infer<typeof createPaymentSchema>;
export type UpdatePaymentStatusInput = z.infer<typeof updatePaymentStatusSchema>;
export type CulqiChargeBody = z.infer<typeof culqiChargeBodySchema>;
export type CulqiOrderBody = z.infer<typeof culqiOrderBodySchema>;
