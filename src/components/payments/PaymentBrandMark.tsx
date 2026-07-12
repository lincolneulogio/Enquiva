import { cn } from "@/lib/utils";

export type PaymentBrand =
  | "yape"
  | "plin"
  | "cash"
  | "culqi"
  | "visa"
  | "mastercard";

interface PaymentBrandMarkProps {
  brand: PaymentBrand;
  className?: string;
  size?: "sm" | "md" | "lg";
}

const sizeClass = {
  sm: "h-5 w-8",
  md: "h-6 w-10",
  lg: "h-7 w-12",
};

/** Marcas estilizadas propias (no logos oficiales con copyright). */
export function PaymentBrandMark({ brand, className, size = "md" }: PaymentBrandMarkProps) {
  const box = cn(
    "inline-flex items-center justify-center overflow-hidden rounded-md border border-border/60 bg-white px-1 shadow-sm dark:bg-zinc-100",
    sizeClass[size],
    className,
  );

  if (brand === "yape") {
    return (
      <span className={box} title="Yape" aria-label="Yape">
        <svg viewBox="0 0 48 24" className="h-full w-full" aria-hidden>
          <rect width="48" height="24" rx="4" fill="#7421F0" />
          <text
            x="24"
            y="16"
            textAnchor="middle"
            fill="white"
            fontSize="10"
            fontWeight="700"
            fontFamily="system-ui,sans-serif"
          >
            Yape
          </text>
        </svg>
      </span>
    );
  }

  if (brand === "plin") {
    return (
      <span className={box} title="Plin" aria-label="Plin">
        <svg viewBox="0 0 48 24" className="h-full w-full" aria-hidden>
          <rect width="48" height="24" rx="4" fill="#00A3E0" />
          <text
            x="24"
            y="16"
            textAnchor="middle"
            fill="white"
            fontSize="10"
            fontWeight="700"
            fontFamily="system-ui,sans-serif"
          >
            Plin
          </text>
        </svg>
      </span>
    );
  }

  if (brand === "cash") {
    return (
      <span className={box} title="Efectivo" aria-label="Efectivo">
        <svg viewBox="0 0 48 24" className="h-full w-full" aria-hidden>
          <rect width="48" height="24" rx="4" fill="#16A34A" />
          <text
            x="24"
            y="16"
            textAnchor="middle"
            fill="white"
            fontSize="9"
            fontWeight="700"
            fontFamily="system-ui,sans-serif"
          >
            Cash
          </text>
        </svg>
      </span>
    );
  }

  if (brand === "culqi") {
    return (
      <span className={box} title="Culqi" aria-label="Culqi">
        <svg viewBox="0 0 48 24" className="h-full w-full" aria-hidden>
          <rect width="48" height="24" rx="4" fill="#0D9488" />
          <text
            x="24"
            y="16"
            textAnchor="middle"
            fill="white"
            fontSize="9"
            fontWeight="700"
            fontFamily="system-ui,sans-serif"
          >
            Culqi
          </text>
        </svg>
      </span>
    );
  }

  if (brand === "visa") {
    return (
      <span className={box} title="Visa" aria-label="Visa">
        <svg viewBox="0 0 48 24" className="h-full w-full" aria-hidden>
          <rect width="48" height="24" rx="4" fill="#1A1F71" />
          <text
            x="24"
            y="16"
            textAnchor="middle"
            fill="white"
            fontSize="10"
            fontWeight="700"
            fontFamily="system-ui,sans-serif"
            fontStyle="italic"
          >
            VISA
          </text>
        </svg>
      </span>
    );
  }

  return (
    <span className={box} title="Mastercard" aria-label="Mastercard">
      <svg viewBox="0 0 48 24" className="h-full w-full" aria-hidden>
        <rect width="48" height="24" rx="4" fill="#252525" />
        <circle cx="20" cy="12" r="6" fill="#EB001B" />
        <circle cx="28" cy="12" r="6" fill="#F79E1B" />
        <path
          d="M24 7.2a6 6 0 0 1 0 9.6 6 6 0 0 1 0-9.6Z"
          fill="#FF5F00"
        />
      </svg>
    </span>
  );
}

export function brandsForPaymentType(
  type: "yape" | "plin" | "cash" | "culqi" | string,
): PaymentBrand[] {
  if (type === "yape") return ["yape"];
  if (type === "plin") return ["plin"];
  if (type === "cash") return ["cash"];
  if (type === "culqi") return ["visa", "mastercard", "culqi"];
  return [];
}
