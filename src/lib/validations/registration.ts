import { z } from "zod";
import { peruPhoneRegex } from "./auth";
import { normalizePeruPhoneValue } from "./phone";

export const createRegistrationSchema = z.object({
  eventId: z.string().uuid(),
  contactPhone: z.preprocess(
    normalizePeruPhoneValue,
    z.string().regex(peruPhoneRegex, "Phone must follow format +519XXXXXXXX")
  ).optional(),
  notes: z.string().max(500).optional(),
  routeId: z.string().uuid().optional().nullable(),
  seats: z.number().int().min(1).max(10).optional().nullable(),
  stopId: z.string().uuid().optional().nullable(),
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
