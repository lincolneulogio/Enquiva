import { env } from "@/env";

const CULQI_API = "https://api.culqi.com/v2";

export type CulqiCredentials = {
  secretKey: string;
  publicKey?: string;
};

type CulqiApiError = {
  merchant_message?: string;
  user_message?: string;
};

async function culqiApiRequest<T>(
  path: string,
  credentials: CulqiCredentials,
  init: RequestInit & { recurrent?: boolean } = {},
): Promise<T> {
  const { recurrent, headers: extraHeaders, ...rest } = init;
  const response = await fetch(`${CULQI_API}${path}`, {
    ...rest,
    headers: {
      Authorization: `Bearer ${credentials.secretKey}`,
      "Content-Type": "application/json",
      ...(recurrent ? { "X-Charge-Channel": "recurrent" } : {}),
      ...extraHeaders,
    },
  });

  const data = await response.json();
  if (!response.ok) {
    const err = data as CulqiApiError;
    throw new Error(err?.merchant_message || err?.user_message || "Error en API Culqi");
  }

  return data as T;
}

type CulqiChargeInput = {
  amount: number;
  currencyCode?: string;
  email: string;
  sourceId: string;
  description: string;
  metadata?: Record<string, string>;
  recurrent?: boolean;
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

  const creds = credentials ?? { secretKey };
  return culqiApiRequest<{
    id: string;
    amount: number;
    currency_code: string;
    outcome: { type: string };
  }>("/charges", creds, {
    method: "POST",
    recurrent: input.recurrent,
    body: JSON.stringify({
      amount: Math.round(input.amount * 100),
      currency_code: input.currencyCode ?? "PEN",
      email: input.email,
      source_id: input.sourceId,
      description: input.description,
      metadata: input.metadata,
    }),
  });
}

export async function createCulqiCustomer(
  input: { email: string; firstName?: string; lastName?: string },
  credentials?: CulqiCredentials,
) {
  const creds = credentials ?? getPlatformCulqiCredentials();
  if (!creds) throw new Error("Culqi no configurado");

  return culqiApiRequest<{ id: string }>("/customers", creds, {
    method: "POST",
    body: JSON.stringify({
      email: input.email,
      first_name: input.firstName ?? "Organizador",
      last_name: input.lastName ?? "EncuentroDeFe",
    }),
  });
}

export async function createCulqiCard(
  input: { customerId: string; tokenId: string },
  credentials?: CulqiCredentials,
) {
  const creds = credentials ?? getPlatformCulqiCredentials();
  if (!creds) throw new Error("Culqi no configurado");

  return culqiApiRequest<{
    id: string;
    last_four?: string;
    iin?: { card_brand?: string };
  }>("/cards", creds, {
    method: "POST",
    body: JSON.stringify({
      customer_id: input.customerId,
      token_id: input.tokenId,
    }),
  });
}

export async function deleteCulqiCard(cardId: string, credentials?: CulqiCredentials) {
  const creds = credentials ?? getPlatformCulqiCredentials();
  if (!creds) throw new Error("Culqi no configurado");

  await culqiApiRequest(`/cards/${cardId}`, creds, { method: "DELETE" });
}
