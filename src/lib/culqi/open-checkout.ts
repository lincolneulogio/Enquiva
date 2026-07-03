"use client";

const CULQI_SCRIPT = "https://js.culqi.com/checkout-js";
const CULQI_READY_TIMEOUT_MS = 8000;

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

export async function openCulqiCheckout(params: OpenCulqiCheckoutParams): Promise<CulqiCheckoutResult> {
  await loadCulqiCheckoutScript();

  if (!window.CulqiCheckout) {
    throw new Error("Culqi no disponible");
  }

  const email = params.email?.trim().toLowerCase();
  if (!email) {
    throw new Error("No se encontró el correo de tu cuenta para el pago.");
  }

  const CulqiCheckoutCtor = window.CulqiCheckout;
  const yapeEnabled = Boolean(params.orderId && params.enableYape);

  return new Promise((resolve, reject) => {
    let settled = false;
    let timeoutId: number | undefined;

    const finish = (fn: () => void) => {
      if (settled) return;
      settled = true;
      if (timeoutId !== undefined) window.clearTimeout(timeoutId);
      document.body.classList.remove("culqi-checkout-open");
      fn();
    };

    let checkout: CulqiCheckoutWithState;

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
      }) as CulqiCheckoutWithState;
    } catch (error) {
      throw error instanceof Error ? error : new Error("Configuración de Culqi inválida");
    }

    const handleCulqi = () => {
      const instance = checkout as CulqiCheckoutWithState;
      const tokenId = instance.token?.id ?? window.Culqi?.token?.id;

      if (tokenId) {
        checkout.close();
        finish(() => resolve({ type: "token", tokenId }));
        return;
      }

      const orderState = instance.order?.state;
      const orderId = instance.order?.id ?? params.orderId;
      if (orderId && orderState === "paid") {
        checkout.close();
        finish(() => resolve({ type: "order_paid", orderId }));
        return;
      }

      const err = instance.error ?? window.Culqi?.error;
      if (err) {
        const message =
          err.user_message ?? err.merchant_message ?? "Pago rechazado por Culqi";
        finish(() => reject(new Error(message)));
      }
    };

    checkout.culqi = handleCulqi;
    window.culqi = handleCulqi;

    timeoutId = window.setTimeout(() => {
      checkout.close();
      finish(() => reject(new Error("Tiempo de espera agotado. Intenta de nuevo.")));
    }, 5 * 60 * 1000);

    try {
      document.body.classList.add("culqi-checkout-open");
      checkout.open();
    } catch (error) {
      finish(() =>
        reject(error instanceof Error ? error : new Error("No se pudo abrir Culqi")),
      );
    }
  });
}
