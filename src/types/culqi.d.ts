export {};

declare global {
  interface CulqiToken {
    id: string;
    type?: string;
    email?: string;
  }

  interface CulqiError {
    merchant_message?: string;
    user_message?: string;
    type?: string;
  }

  interface CulqiCheckoutInstance {
    open: () => void;
    close: () => void;
    culqi?: () => void;
    token?: CulqiToken;
    error?: CulqiError;
    order?: { id?: string; state?: string };
  }

  interface CulqiCheckoutConfig {
    settings: {
      title: string;
      currency: string;
      amount: number;
      order?: string;
    };
    client?: {
      email?: string;
    };
    appearance?: {
      hiddenEmail?: boolean;
    };
    options?: {
      lang?: string;
      modal?: boolean;
      installments?: boolean;
      paymentMethods?: {
        tarjeta?: boolean;
        yape?: boolean;
        billetera?: boolean;
        bancaMovil?: boolean;
        agente?: boolean;
        cuotealo?: boolean;
      };
    };
  }

  interface Window {
    CulqiCheckout?: new (publicKey: string, config: CulqiCheckoutConfig) => CulqiCheckoutInstance;
    Culqi?: {
      token?: CulqiToken;
      error?: CulqiError;
    };
    culqi?: () => void;
  }
}
