export type PaymentMethodType = "yape" | "plin" | "cash" | "culqi";
export type PaymentMethodScope = "platform" | "organizer";

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

export function isLegacyWalletType(type: string) {
  return type === "yape" || type === "plin";
}
