import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

/**
 * `next build` sets NODE_ENV=production while collecting page data.
 * Secrets must be required at real runtime, not during the build phase.
 */
const isProdRuntime =
  process.env.NODE_ENV === "production" &&
  process.env.NEXT_PHASE !== "phase-production-build";

export const env = createEnv({
  server: {
    DATABASE_URL: z.string().url(),
    BETTER_AUTH_SECRET: z.string().min(32),
    TICKET_SIGNING_KEY: z.string().min(32),
    SMTP_HOST: z.string().min(1),
    SMTP_PORT: z.coerce.number().int().positive(),
    SMTP_USER: z.string().min(1),
    SMTP_PASS: z.string().min(1),
    MAIL_FROM_EMAIL: z.string().email(),
    MAIL_FROM_NAME: z.string().min(1),
    PUSHER_APP_ID: z.string().min(1),
    PUSHER_SECRET: z.string().min(1),
    CLOUDINARY_CLOUD_NAME: z.string().min(1),
    CLOUDINARY_API_KEY: z.string().min(1),
    CLOUDINARY_API_SECRET: z.string().min(1),
    UPSTASH_REDIS_REST_URL: z.string().url(),
    UPSTASH_REDIS_REST_TOKEN: z.string().min(1),
    GEMINI_API_KEY: z.string().optional(),
    GEMINI_MODEL: z.string().default("gemini-3.5-flash"),
    /** Alternativa Gemini si el modelo principal falla (p. ej. cupo). */
    GEMINI_FALLBACK_MODEL: z.string().default("gemini-3.1-flash-lite"),
    OPENROUTER_API_KEY: z.string().optional(),
    /** Primer modelo OpenRouter (producción: Gemini Flash vía OpenRouter). */
    OPENROUTER_MODEL: z.string().default("google/gemini-2.5-flash"),
    /**
     * Lista CSV de alternativas OpenRouter si el principal falla.
     * Vacío = cadena estable (pago primero, free al final).
     */
    OPENROUTER_FALLBACK_MODELS: z.string().optional(),
    /** google = Gemini estable primero (recomendado producción). */
    AI_PROVIDER: z.enum(["google", "openrouter"]).default("google"),
    CULQI_SECRET_KEY: z.string().min(1).optional(),
    CULQI_WEBHOOK_SECRET: z.string().min(1).optional(),
    PLATFORM_FEE_PERCENT: z.coerce.number().min(0).max(100).optional(),
    CRON_SECRET: isProdRuntime
      ? z.string().min(16)
      : z.string().min(16).optional(),
    BROADCAST_BATCH_SIZE: z.coerce.number().int().min(1).max(50).optional(),
    PLATFORM_BOOTSTRAP_SECRET: isProdRuntime
      ? z.string().min(16)
      : z.string().min(16).optional(),
    VAPID_PUBLIC_KEY: z.string().min(1).optional(),
    VAPID_PRIVATE_KEY: z.string().min(1).optional(),
    VAPID_SUBJECT: z.string().min(1).optional(),
    /** Google OAuth (Better Auth social login). Ambos opcionales; si faltan, el botón no aparece. */
    GOOGLE_CLIENT_ID: z.string().min(1).optional(),
    GOOGLE_CLIENT_SECRET: z.string().min(1).optional(),
  },
  client: {
    NEXT_PUBLIC_APP_URL: z.string().url(),
    NEXT_PUBLIC_PUSHER_KEY: z.string().min(1),
    NEXT_PUBLIC_PUSHER_CLUSTER: z.string().min(1),
    NEXT_PUBLIC_CULQI_PUBLIC_KEY: z.string().min(1).optional(),
    NEXT_PUBLIC_GOOGLE_AUTH_ENABLED: z
      .enum(["true", "false"])
      .optional()
      .transform((v) => v === "true"),
  },
  runtimeEnv: {
    DATABASE_URL: process.env.DATABASE_URL,
    BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET,
    TICKET_SIGNING_KEY: process.env.TICKET_SIGNING_KEY,
    SMTP_HOST: process.env.SMTP_HOST,
    SMTP_PORT: process.env.SMTP_PORT,
    SMTP_USER: process.env.SMTP_USER,
    SMTP_PASS: process.env.SMTP_PASS,
    MAIL_FROM_EMAIL: process.env.MAIL_FROM_EMAIL,
    MAIL_FROM_NAME: process.env.MAIL_FROM_NAME,
    PUSHER_APP_ID: process.env.PUSHER_APP_ID,
    PUSHER_SECRET: process.env.PUSHER_SECRET,
    CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME,
    CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY,
    CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET,
    UPSTASH_REDIS_REST_URL: process.env.UPSTASH_REDIS_REST_URL,
    UPSTASH_REDIS_REST_TOKEN: process.env.UPSTASH_REDIS_REST_TOKEN,
    GEMINI_API_KEY: process.env.GEMINI_API_KEY,
    GEMINI_MODEL: process.env.GEMINI_MODEL,
    GEMINI_FALLBACK_MODEL: process.env.GEMINI_FALLBACK_MODEL,
    OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY,
    OPENROUTER_MODEL: process.env.OPENROUTER_MODEL,
    OPENROUTER_FALLBACK_MODELS: process.env.OPENROUTER_FALLBACK_MODELS,
    AI_PROVIDER: process.env.AI_PROVIDER,
    CULQI_SECRET_KEY: process.env.CULQI_SECRET_KEY,
    CULQI_WEBHOOK_SECRET: process.env.CULQI_WEBHOOK_SECRET,
    PLATFORM_FEE_PERCENT: process.env.PLATFORM_FEE_PERCENT,
    CRON_SECRET: process.env.CRON_SECRET,
    BROADCAST_BATCH_SIZE: process.env.BROADCAST_BATCH_SIZE,
    PLATFORM_BOOTSTRAP_SECRET: process.env.PLATFORM_BOOTSTRAP_SECRET,
    VAPID_PUBLIC_KEY: process.env.VAPID_PUBLIC_KEY,
    VAPID_PRIVATE_KEY: process.env.VAPID_PRIVATE_KEY,
    VAPID_SUBJECT: process.env.VAPID_SUBJECT,
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_PUSHER_KEY: process.env.NEXT_PUBLIC_PUSHER_KEY,
    NEXT_PUBLIC_PUSHER_CLUSTER: process.env.NEXT_PUBLIC_PUSHER_CLUSTER,
    NEXT_PUBLIC_CULQI_PUBLIC_KEY: process.env.NEXT_PUBLIC_CULQI_PUBLIC_KEY,
    NEXT_PUBLIC_GOOGLE_AUTH_ENABLED: process.env.NEXT_PUBLIC_GOOGLE_AUTH_ENABLED,
  },
  emptyStringAsUndefined: true,
  skipValidation:
    !!process.env.SKIP_ENV_VALIDATION ||
    process.env.npm_lifecycle_event === "lint" ||
    process.env.NEXT_PHASE === "phase-production-build" ||
    (process.env.NODE_ENV === "production" && !process.env.DATABASE_URL),
  /**
   * En producción, si Culqi está habilitado (secret key), el webhook secret es obligatorio.
   */
  createFinalSchema: (shape, isServer) =>
    z.object(shape).superRefine((data, ctx) => {
      if (!isServer) return;
      if (isProdRuntime && data.CULQI_SECRET_KEY && !data.CULQI_WEBHOOK_SECRET) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["CULQI_WEBHOOK_SECRET"],
          message:
            "CULQI_WEBHOOK_SECRET es obligatorio en producción cuando CULQI_SECRET_KEY está configurada",
        });
      }
    }),
});
