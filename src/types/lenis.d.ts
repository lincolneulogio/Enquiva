import type Lenis from "lenis";

declare global {
  interface Window {
    /** Smooth scroll instance used by public pages (Enquiva). */
    __enquivaLenis?: Lenis | null;
  }
}

export {};
