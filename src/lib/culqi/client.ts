import { env } from "@/env";

const CULQI_API = "https://api.culqi.com/v2";

export type CulqiCredentials = {
  secretKey: string;
  publicKey?: string;
};

type CulqiChargeInput = {
  amount: number;
  currencyCode?: string;
  email: string;
  sourceId: string;
  description: string;
  metadata?: Record<string, string>;
};

/** Llaves Culqi de la plataforma (suscripciones SaaS → cuenta del super admin). */
export function isPlatformCulqiConfigured() {
  return Boolean(env.CULQI_SECRET_KEY && env.NEXT_PUBLIC_CULQI_PUBLIC_KEY);
}

export function getPlatformCulqiCredentials(): CulqiCredentials | null {
  if (!isPlatformCulqiConfigured()) return null;
  return {
    secretKey: env.CULQI_SECRET_KEY!,
    publicKey: env.NEXT_PUBLIC_CULQI_PUBLIC_KEY!,
  };
}

/** @deprecated Use isPlatformCulqiConfigured for billing or organizer-specific checks for events. */
export function isCulqiConfigured() {
  return isPlatformCulqiConfigured();
}

export async function createCulqiCharge(
  input: CulqiChargeInput,
  credentials?: CulqiCredentials,
) {
  const secretKey = credentials?.secretKey ?? env.CULQI_SECRET_KEY;
  if (!secretKey) {
    throw new Error("CULQI_SECRET_KEY no configurada");
  }

  const response = await fetch(`${CULQI_API}/charges`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secretKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      amount: Math.round(input.amount * 100),
      currency_code: input.currencyCode ?? "PEN",
      email: input.email,
      source_id: input.sourceId,
      description: input.description,
      metadata: input.metadata,
    }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data?.merchant_message || data?.user_message || "Error al procesar pago Culqi");
  }

  return data as {
    id: string;
    amount: number;
    currency_code: string;
    outcome: { type: string };
  };
}
