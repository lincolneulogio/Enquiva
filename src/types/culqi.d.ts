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
  }

  interface Window {
    CulqiCheckout?: new (
      publicKey: string,
      config: {
        settings: {
          title: string;
          currency: string;
          amount: number;
          order?: string;
        };
        options?: {
          paymentMethods?: {
            tarjeta?: boolean;
            yape?: boolean;
            billetera?: boolean;
            bancaMovil?: boolean;
            agente?: boolean;
            cuotealo?: boolean;
          };
        };
      },
    ) => CulqiCheckoutInstance;
    Culqi?: {
      token?: CulqiToken;
      error?: CulqiError;
    };
    culqi?: () => void;
  }
}
