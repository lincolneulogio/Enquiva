import { z } from "zod";
import { peruPhoneRegex } from "./auth";

const normalizePeruPhoneValue = (value: unknown) => {
  if (typeof value !== "string") return value;
  const digits = value.replace(/\D/g, "");
  if (digits.startsWith("51") && digits.length === 11) return `+${digits}`;
  if (digits.length === 9) return `+51${digits}`;
  return value.trim();
};

export const createRegistrationSchema = z.object({
  eventId: z.string().uuid(),
  contactPhone: z.preprocess(
    normalizePeruPhoneValue,
    z.string().regex(peruPhoneRegex, "Phone must follow format +519XXXXXXXX")
  ).optional(),
  notes: z.string().max(500).optional(),
  routeId: z.string().uuid().optional().nullable(),
  seats: z.number().int().min(1).max(10).optional().nullable(),
  guests: z.array(
    z.object({
      name: z.string().min(2, "El nombre del invitado debe tener al menos 2 caracteres"),
      phone: z.preprocess(
        normalizePeruPhoneValue,
        z.string().regex(peruPhoneRegex, "Format +519XXXXXXXX").optional().or(z.literal(""))
      ).optional().nullable(),
    })
  ).optional().nullable(),
});

export const checkInSchema = z.object({
  registrationId: z.string().uuid(),
  eventId: z.string().uuid(),
});

export type CreateRegistrationInput = z.infer<typeof createRegistrationSchema>;
export type CheckInInput = z.infer<typeof checkInSchema>;
