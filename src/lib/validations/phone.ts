import { z } from "zod";
import { peruPhoneRegex } from "./auth";

/** Acepta 9 dígitos (912345678) o +51912345678 y normaliza a +519XXXXXXXX. */
export function normalizePeruPhoneValue(value: unknown): unknown {
  if (value === null || value === undefined) return value;
  if (typeof value !== "string") return value;

  const trimmed = value.trim();
  if (!trimmed) return "";

  const digits = trimmed.replace(/\D/g, "");
  if (digits.startsWith("51") && digits.length === 11) return `+${digits}`;
  if (digits.length === 9) return `+51${digits}`;

  return trimmed;
}

/** 9 dígitos locales peruanos (empiezan en 9). */
export const peruPhoneNineDigitsRegex = /^9\d{8}$/;

export const peruPhoneSchema = (
  message = "El teléfono debe tener 9 dígitos después de +51 (ej. 987654321)",
) =>
  z.preprocess(
    normalizePeruPhoneValue,
    z.union([z.string().regex(peruPhoneRegex, message), z.literal("")]),
  );
