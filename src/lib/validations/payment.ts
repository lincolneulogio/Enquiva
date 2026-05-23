import { z } from "zod";

export const paymentStatusValues = ["pending", "approved", "rejected"] as const;

export const createPaymentSchema = z.object({
  registrationId: z.string().uuid(),
  amount: z.number().positive("Amount must be greater than zero"),
  currency: z.string().length(3, "Use ISO currency code").transform((value) => value.toUpperCase()),
  method: z.string().min(3).max(100),
  reference: z.string().max(100).optional(),
  receiptUrl: z.string().url().optional(),
  receiptFileName: z.string().max(200).optional(),
  notes: z.string().max(500).optional(),
});

export const updatePaymentStatusSchema = z.object({
  paymentId: z.string().uuid(),
  status: z.enum(paymentStatusValues),
  notes: z.string().max(500).optional(),
});

export type CreatePaymentInput = z.infer<typeof createPaymentSchema>;
export type UpdatePaymentStatusInput = z.infer<typeof updatePaymentStatusSchema>;
