import { headers } from "next/headers";
import {
  authIdentityRatelimit,
  enforceRateLimit,
  otpVerificationRatelimit,
} from "@/lib/redis";

/** Actions públicas de auth: rate-limit por IP (no requieren sesión). */
export async function assertPublicAuthRateLimit(bucket: string) {
  const headersList = await headers();
  const ip = headersList.get("x-forwarded-for")?.split(",")[0]?.trim() || "anonymous";
  const rate = await enforceRateLimit(authIdentityRatelimit, `${bucket}:${ip}`, {
    failClosed: false,
  });
  if (!rate.ok) {
    throw new Error("Demasiados intentos. Espera un momento e inténtalo de nuevo.");
  }
}

export async function assertVerificationCodeRateLimit(email: string) {
  const headersList = await headers();
  const ip = headersList.get("x-forwarded-for")?.split(",")[0]?.trim() || "anonymous";
  const keys = [`confirm-otp:ip:${ip}`, `confirm-otp:email:${email.toLowerCase()}`];

  const results = await Promise.all(
    keys.map((key) =>
      enforceRateLimit(otpVerificationRatelimit, key, {
        failClosed: true,
      }),
    ),
  );
  if (results.some((result) => !result.ok)) {
    throw new Error("Demasiados intentos. Espera un momento e inténtalo de nuevo.");
  }
}
