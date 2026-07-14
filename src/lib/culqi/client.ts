import { env } from "@/env";
import {
  resolveCulqiCustomerData,
  type CulqiUserProfile,
} from "@/lib/culqi/customer-data";
import { CULQI_ORDER_MIN_AMOUNT_PEN } from "@/lib/culqi/constants";

export { CULQI_ORDER_MIN_AMOUNT_PEN };

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
  customer?: CulqiUserProfile;
};

/** @deprecated Use customer profile via createCulqiCharge({ customer }). */
export type CulqiAntifraudInput = CulqiUserProfile;

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
  const customerProfile: CulqiUserProfile = input.customer ?? {
    name: null,
    email: input.email,
    phone: null,
    address: null,
  };
  const customer = resolveCulqiCustomerData(customerProfile);

  const body: Record<string, unknown> = {
    amount: Math.round(input.amount * 100),
    currency_code: input.currencyCode ?? "PEN",
    email: input.email,
    source_id: input.sourceId,
    description: input.description,
    metadata: input.metadata,
    capture: true,
    installments: 0,
    antifraud_details: customer.antifraud,
  };

  return culqiApiRequest<{
    id: string;
    amount: number;
    currency_code: string;
    outcome: { type: string };
  }>("/charges", creds, {
    method: "POST",
    recurrent: input.recurrent,
    body: JSON.stringify(body),
  });
}

export async function createCulqiCustomer(
  input: CulqiUserProfile,
  credentials?: CulqiCredentials,
) {
  const creds = credentials ?? getPlatformCulqiCredentials();
  if (!creds) throw new Error("Culqi no configurado");

  const customer = resolveCulqiCustomerData(input);

  return culqiApiRequest<{ id: string }>("/customers", creds, {
    method: "POST",
    body: JSON.stringify({
      email: input.email,
      first_name: customer.firstName,
      last_name: customer.lastName,
      phone_number: customer.antifraud.phone_number,
      address: customer.antifraud.address,
      address_city: customer.antifraud.address_city,
      country_code: customer.antifraud.country_code,
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

type CulqiOrderInput = {
  amount: number;
  description: string;
  orderNumber: string;
  email: string;
  customer: CulqiUserProfile;
  metadata?: Record<string, string>;
  expirationHours?: number;
  /**
   * false (default): Checkout confirma al pagar Yape/billeteras (Generar QR).
   * true: solo si confirmas tú vía API; rompe "Generar QR" en Checkout.
   */
  confirm?: boolean;
};

export async function createCulqiOrder(
  input: CulqiOrderInput,
  credentials: CulqiCredentials,
) {
  const customer = resolveCulqiCustomerData(input.customer);
  const amountCents = Math.round(input.amount * 100);
  if (amountCents < 600) {
    throw new Error("El monto mínimo para Yape vía Culqi es S/ 6.00");
  }

  const expirationDate = Math.floor(
    Date.now() / 1000 + (input.expirationHours ?? 24) * 3600,
  );

  return culqiApiRequest<{ id: string; state?: string; amount?: number }>("/orders", credentials, {
    method: "POST",
    body: JSON.stringify({
      amount: amountCents,
      currency_code: "PEN",
      description: input.description.slice(0, 80),
      order_number: input.orderNumber.slice(0, 36),
      expiration_date: expirationDate,
      client_details: {
        first_name: customer.firstName,
        last_name: customer.lastName,
        email: input.email,
        phone_number: customer.antifraud.phone_number,
      },
      // Checkout (Yape / billeteras / PagoEfectivo) confirma la orden al generar QR.
      confirm: input.confirm ?? false,
      metadata: input.metadata,
    }),
  });
}

export async function getCulqiCharge(chargeId: string, credentials: CulqiCredentials) {
  return culqiApiRequest<{
    id: string;
    outcome?: { type?: string };
    metadata?: Record<string, string>;
  }>(`/charges/${chargeId}`, credentials, { method: "GET" });
}

export async function getCulqiOrder(orderId: string, credentials: CulqiCredentials) {
  return culqiApiRequest<{
    id: string;
    state?: string;
    amount?: number;
    metadata?: Record<string, string>;
  }>(`/orders/${orderId}`, credentials, { method: "GET" });
}

/** Solicita reembolso de un cargo Culqi (parcial o total). amount en soles. */
export async function createCulqiRefund(
  input: {
    chargeId: string;
    amount?: number;
    reason?: string;
  },
  credentials: CulqiCredentials,
) {
  const body: Record<string, unknown> = {
    charge_id: input.chargeId,
    reason: input.reason ?? "solicitud_comprador",
  };
  if (input.amount != null) {
    body.amount = Math.round(input.amount * 100);
  }

  return culqiApiRequest<{
    id: string;
    amount: number;
    charge_id: string;
  }>("/refunds", credentials, {
    method: "POST",
    body: JSON.stringify(body),
  });
}
