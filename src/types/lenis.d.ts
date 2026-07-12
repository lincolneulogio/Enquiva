import type Lenis from "lenis";

declare global {
  interface Window {
    /** Smooth scroll instance used by public pages (Evora). */
    __evoraLenis?: Lenis | null;
  }
}

export {};
