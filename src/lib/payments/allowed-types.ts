/**
 * Tipos de medio de pago.
 *
 * Producto activo (crear): platform → culqi; organizer → cash | culqi.
 * Yape/Plin manuales son legacy (solo lectura / migración); Yape real va vía Culqi.
 */
export type PaymentMethodType = "yape" | "plin" | "cash" | "culqi";
export type PaymentMethodScope = "platform" | "organizer";

/** Medios que el producto permite crear hoy. */
export const ACTIVE_PAYMENT_METHOD_TYPES = {
  platform: ["culqi"] as const,
  organizer: ["cash", "culqi"] as const,
} as const;

export function isAllowedPaymentMethodType(
  scope: PaymentMethodScope,
  type: string,
): type is PaymentMethodType {
  if (scope === "platform") return type === "culqi";
  return type === "culqi" || type === "cash";
}

export function assertAllowedPaymentMethodType(scope: PaymentMethodScope, type: string) {
  if (scope === "platform" && type !== "culqi") {
    throw new Error(
      "Los cobros de plataforma solo usan Culqi. Tarjeta, Yape y billeteras se ofrecen en el mismo checkout.",
    );
  }
  if (scope === "organizer" && type !== "culqi" && type !== "cash") {
    throw new Error(
      "Solo puedes crear Efectivo o Tarjeta (Culqi). Yape y billeteras se pagan dentro de Culqi.",
    );
  }
}

/** Yape/Plin como métodos manuales del organizador (deprecados). */
export function isLegacyWalletType(type: string) {
  return type === "yape" || type === "plin";
}
