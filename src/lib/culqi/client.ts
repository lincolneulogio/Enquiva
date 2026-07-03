import { env } from "@/env";

const CULQI_API = "https://api.culqi.com/v2";

type CulqiChargeInput = {
  amount: number;
  currencyCode?: string;
  email: string;
  sourceId: string;
  description: string;
  metadata?: Record<string, string>;
};

export function isCulqiConfigured() {
  return Boolean(env.CULQI_SECRET_KEY && env.NEXT_PUBLIC_CULQI_PUBLIC_KEY);
}

export async function createCulqiCharge(input: CulqiChargeInput) {
  if (!env.CULQI_SECRET_KEY) {
    throw new Error("CULQI_SECRET_KEY no configurada");
  }

  const response = await fetch(`${CULQI_API}/charges`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.CULQI_SECRET_KEY}`,
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
