"use client";

const CULQI_SCRIPT = "https://js.culqi.com/checkout-js";
const CULQI_READY_TIMEOUT_MS = 8000;

interface CulqiCheckoutWithState extends CulqiCheckoutInstance {
  token?: { id: string };
  error?: CulqiError;
  order?: unknown;
}

export interface OpenCulqiCheckoutParams {
  publicKey: string;
  title: string;
  /** Amount in PEN (soles), not cents */
  amount: number;
  email?: string | null;
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

export async function openCulqiCheckout(params: OpenCulqiCheckoutParams): Promise<string> {
  await loadCulqiCheckoutScript();

  if (!window.CulqiCheckout) {
    throw new Error("Culqi no disponible");
  }

  const CulqiCheckoutCtor = window.CulqiCheckout;

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
          // Sin `order`: solo tarjeta. Culqi exige ord_live_* para Yape/billeteras.
        },
        ...(params.email ? { client: { email: params.email } } : {}),
        options: {
          lang: "auto",
          modal: true,
          installments: false,
          paymentMethods: {
            tarjeta: true,
            yape: false,
            billetera: false,
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
        finish(() => resolve(tokenId));
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
