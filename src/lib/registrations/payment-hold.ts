/** Defaults sensatos para reserva temporal de cupo (hold). */
export const DEFAULT_PAYMENT_HOLD = {
  holdMinutesCard: 30,
  holdHoursManual: 24,
  nearEventWindowHours: 48,
  nearEventHoldMinutes: 15,
} as const;

export type EventHoldConfig = {
  date: Date | string;
  holdMinutesCard?: number | null;
  holdHoursManual?: number | null;
  nearEventWindowHours?: number | null;
  nearEventHoldMinutes?: number | null;
  salesCutoffHoursBefore?: number | null;
};

function num(value: number | null | undefined, fallback: number) {
  return typeof value === "number" && Number.isFinite(value) && value > 0 ? value : fallback;
}

export function normalizeHoldConfig(event: EventHoldConfig) {
  return {
    date: new Date(event.date),
    holdMinutesCard: num(event.holdMinutesCard, DEFAULT_PAYMENT_HOLD.holdMinutesCard),
    holdHoursManual: num(event.holdHoursManual, DEFAULT_PAYMENT_HOLD.holdHoursManual),
    nearEventWindowHours: num(event.nearEventWindowHours, DEFAULT_PAYMENT_HOLD.nearEventWindowHours),
    nearEventHoldMinutes: num(event.nearEventHoldMinutes, DEFAULT_PAYMENT_HOLD.nearEventHoldMinutes),
    salesCutoffHoursBefore:
      event.salesCutoffHoursBefore != null && event.salesCutoffHoursBefore > 0
        ? event.salesCutoffHoursBefore
        : null,
  };
}

export function isNearEventWindow(event: EventHoldConfig, now = new Date()) {
  const cfg = normalizeHoldConfig(event);
  return cfg.date.getTime() - now.getTime() <= cfg.nearEventWindowHours * 3_600_000;
}

/** true si ya no se aceptan nuevas inscripciones por corte de ventas. */
export function isPastSalesCutoff(event: EventHoldConfig, now = new Date()) {
  const cfg = normalizeHoldConfig(event);
  if (cfg.salesCutoffHoursBefore == null) return false;
  return now.getTime() >= cfg.date.getTime() - cfg.salesCutoffHoursBefore * 3_600_000;
}

/** Hold inicial al registrarse (tarjeta / ventana corta). */
export function computeInitialHoldExpiresAt(event: EventHoldConfig, from = new Date()) {
  const cfg = normalizeHoldConfig(event);
  const minutes = isNearEventWindow(cfg, from)
    ? Math.min(cfg.holdMinutesCard, cfg.nearEventHoldMinutes)
    : cfg.holdMinutesCard;
  return {
    expiresAt: new Date(from.getTime() + minutes * 60_000),
    minutes,
    kind: "card" as const,
  };
}

/** Extiende el hold al enviar pago manual (efectivo residual / Yape-Plin legacy). */
export function computeManualHoldExpiresAt(event: EventHoldConfig, from = new Date()) {
  const cfg = normalizeHoldConfig(event);
  if (isNearEventWindow(cfg, from)) {
    return {
      expiresAt: new Date(from.getTime() + cfg.nearEventHoldMinutes * 60_000),
      minutes: cfg.nearEventHoldMinutes,
      kind: "near" as const,
    };
  }
  const minutes = cfg.holdHoursManual * 60;
  return {
    expiresAt: new Date(from.getTime() + cfg.holdHoursManual * 3_600_000),
    minutes,
    kind: "manual" as const,
  };
}

export function holdMinutesRemaining(expiresAt: Date | string | null | undefined, now = new Date()) {
  if (!expiresAt) return null;
  const ms = new Date(expiresAt).getTime() - now.getTime();
  if (ms <= 0) return 0;
  return Math.max(1, Math.ceil(ms / 60_000));
}
