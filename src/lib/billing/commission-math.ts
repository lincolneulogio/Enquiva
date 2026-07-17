export function roundCommission(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function calculateNetCommission(
  grossCommission: number,
  refundReversals: number,
): number {
  return roundCommission(grossCommission - Math.abs(refundReversals));
}

export function calculateOutstandingCommission(
  netCommission: number,
  alreadyInvoiced: number,
): number {
  return Math.max(
    0,
    roundCommission(netCommission - alreadyInvoiced),
  );
}
