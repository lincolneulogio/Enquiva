"use client";

const CULQI_SCRIPT = "https://js.culqi.com/checkout-js";
const CULQI_READY_TIMEOUT_MS = 8000;
/** Espera tras cerrar: Culqi necesita liberar el modal antes de un nuevo open(). */
const CULQI_REOPEN_DELAY_MS = 300;
/** Ignora onClose disparado en el mismo tick que open(). */
const CULQI_CLOSE_GRACE_MS = 200;

interface CulqiCheckoutWithState extends CulqiCheckoutInstance {
  token?: { id: string };
  error?: CulqiError;
  order?: { id?: string; state?: string };
}

export interface OpenCulqiCheckoutParams {
  publicKey: string;
  title: string;
  /** Amount in PEN (soles), not cents */
  amount: number;
  /** Correo de la cuenta (sesión). Se envía a Culqi y se oculta el campo. */
  email?: string | null;
  /** Orden Culqi (ord_*) — habilita Yape y billeteras */
  orderId?: string | null;
  /** Habilitar Yape en checkout (requiere orderId y monto >= S/ 6) */
  enableYape?: boolean;
}

export type CulqiCheckoutResult =
  | { type: "token"; tokenId: string }
  | { type: "order_paid"; orderId: string };

/** Usuario cerró el modal o navegó fuera (atrás / cambio de ruta). */
export class CulqiCheckoutCancelledError extends Error {
  constructor(message = "CHECKOUT_CANCELLED") {
    super(message);
    this.name = "CulqiCheckoutCancelledError";
  }
}

export function isCulqiCheckoutCancelled(error: unknown): boolean {
  return (
    error instanceof CulqiCheckoutCancelledError ||
    (error instanceof Error &&
      (error.name === "CulqiCheckoutCancelledError" || error.message === "CHECKOUT_CANCELLED"))
  );
}

type ActiveSession = {
  id: number;
  checkout: CulqiCheckoutWithState;
  cancel: () => void;
};

let sessionSeq = 0;
let activeSession: ActiveSession | null = null;
/** Última vez que se cerró un checkout (para esperar antes de reabrir). */
let lastClosedAt = 0;

function scrubCulqiBodyClass() {
  document.body.classList.remove("culqi-checkout-open");
}

/** Limpia la clase body de Culqi (seguro llamar desde botones de la UI). */
export function resetCulqiCheckoutUi() {
  scrubCulqiBodyClass();
}

function delay(ms: number) {
  return new Promise<void>((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

/**
 * Cierra el checkout activo.
 * Importante: no eliminar nodos del DOM de Culqi manualmente — corrompe el SDK
 * hasta recargar la página (open() deja de mostrar el modal).
 */
export function closeActiveCulqiCheckout() {
  const session = activeSession;
  if (!session) {
    scrubCulqiBodyClass();
    return;
  }
  session.cancel();
}

function waitForCulqiCheckout(): Promise<void> {
  return new Promise((resolve, reject) => {
    const started = Date.now();
    const tick = () => {
      if (window.CulqiCheckout) {
        resolve();
        return;
      }
      if (Date.now() - started >= CULQI_READY_TIMEOUT_MS) {
        reject(new Error("Culqi no terminó de cargar"));
        return;
      }
      window.setTimeout(tick, 50);
    };
    tick();
  });
}

export async function loadCulqiCheckoutScript(): Promise<void> {
  if (typeof window === "undefined") {
    throw new Error("SSR");
  }

  if (!document.querySelector(`script[src="${CULQI_SCRIPT}"]`)) {
    await new Promise<void>((resolve, reject) => {
      const script = document.createElement("script");
      script.src = CULQI_SCRIPT;
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error("No se pudo cargar Culqi"));
      document.body.appendChild(script);
    });
  }

  await waitForCulqiCheckout();
}

async function prepareFreshCheckout() {
  if (activeSession) {
    const prev = activeSession;
    try {
      prev.checkout.close();
    } catch {
      /* ignore */
    }
    try {
      prev.cancel();
    } catch {
      /* ignore */
    }
  }

  scrubCulqiBodyClass();

  // Solo esperar al reabrir; el primer open no debe “parpadear” por delay artificial.
  if (lastClosedAt > 0) {
    const waitMs = Math.max(CULQI_REOPEN_DELAY_MS - (Date.now() - lastClosedAt), 0);
    if (waitMs > 0) await delay(waitMs);
  }
}

export async function openCulqiCheckout(params: OpenCulqiCheckoutParams): Promise<CulqiCheckoutResult> {
  await loadCulqiCheckoutScript();

  if (!window.CulqiCheckout) {
    throw new Error("Culqi no disponible");
  }

  const email = params.email?.trim().toLowerCase();
  if (!email) {
    throw new Error("No se encontró el correo de tu cuenta para el pago.");
  }

  await prepareFreshCheckout();

  const CulqiCheckoutCtor = window.CulqiCheckout;
  const yapeEnabled = Boolean(params.orderId && params.enableYape);
  const sessionId = ++sessionSeq;

  return new Promise((resolve, reject) => {
    let settled = false;
    let acceptClose = false;
    let timeoutId: number | undefined;
    let graceId: number | undefined;
    let checkout: CulqiCheckoutWithState;

    const stopWatchers = () => {
      if (timeoutId !== undefined) window.clearTimeout(timeoutId);
      if (graceId !== undefined) window.clearTimeout(graceId);
      window.removeEventListener("popstate", onNavigateAway);
      window.removeEventListener("pagehide", onNavigateAway);
      window.removeEventListener("keydown", onEscape);
    };

    const finish = (fn: () => void) => {
      if (settled) return;
      settled = true;
      stopWatchers();
      if (activeSession?.id === sessionId) {
        activeSession = null;
      }
      lastClosedAt = Date.now();
      scrubCulqiBodyClass();
      fn();
    };

    const softClose = () => {
      try {
        checkout.close();
      } catch {
        /* ignore */
      }
    };

    const cancel = () => {
      if (settled || sessionId !== sessionSeq) return;
      softClose();
      finish(() => reject(new CulqiCheckoutCancelledError()));
    };

    try {
      checkout = new CulqiCheckoutCtor(params.publicKey, {
        settings: {
          title: params.title,
          currency: "PEN",
          amount: Math.round(params.amount * 100),
          ...(params.orderId ? { order: params.orderId } : {}),
        },
        client: { email },
        appearance: {
          hiddenEmail: true,
        },
        options: {
          lang: "auto",
          modal: true,
          installments: false,
          paymentMethods: {
            tarjeta: true,
            yape: yapeEnabled,
            billetera: yapeEnabled,
            bancaMovil: false,
            agente: false,
            cuotealo: false,
          },
        },
        // Solo después de la gracia: evita cancelar el open() al reintentar.
        // Siempre limpia la clase body para que el modal Evora vuelva a ser usable.
        onClose: () => {
          scrubCulqiBodyClass();
          if (acceptClose) cancel();
        },
      } as CulqiCheckoutConfig) as CulqiCheckoutWithState;
    } catch (error) {
      scrubCulqiBodyClass();
      reject(error instanceof Error ? error : new Error("Configuración de Culqi inválida"));
      return;
    }

    const onNavigateAway = () => cancel();
    const onEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") cancel();
    };

    const handleCulqi = () => {
      if (settled || sessionId !== sessionSeq) return;

      const instance = checkout as CulqiCheckoutWithState;
      const tokenId = instance.token?.id ?? window.Culqi?.token?.id;

      if (tokenId) {
        acceptClose = false;
        softClose();
        finish(() => resolve({ type: "token", tokenId }));
        return;
      }

      const orderState = instance.order?.state;
      const orderId = instance.order?.id ?? params.orderId;
      if (orderId && orderState === "paid") {
        acceptClose = false;
        softClose();
        finish(() => resolve({ type: "order_paid", orderId }));
        return;
      }

      const err = instance.error ?? window.Culqi?.error;
      if (err) {
        acceptClose = false;
        const message =
          err.user_message ?? err.merchant_message ?? "Pago rechazado por Culqi";
        softClose();
        finish(() => reject(new Error(message)));
      }
    };

    checkout.culqi = handleCulqi;
    window.culqi = handleCulqi;

    activeSession = { id: sessionId, checkout, cancel };

    timeoutId = window.setTimeout(() => {
      if (settled || sessionId !== sessionSeq) return;
      softClose();
      finish(() => reject(new Error("Tiempo de espera agotado. Intenta de nuevo.")));
    }, 5 * 60 * 1000);

    window.addEventListener("popstate", onNavigateAway);
    window.addEventListener("pagehide", onNavigateAway);
    window.addEventListener("keydown", onEscape);

    try {
      document.body.classList.add("culqi-checkout-open");
      checkout.open();
      graceId = window.setTimeout(() => {
        acceptClose = true;
      }, CULQI_CLOSE_GRACE_MS);
    } catch (error) {
      finish(() =>
        reject(error instanceof Error ? error : new Error("No se pudo abrir Culqi")),
      );
    }
  });
}
