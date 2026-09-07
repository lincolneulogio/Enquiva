"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { usePathname } from "next/navigation";

interface MarketingMotionProviderProps {
  children: ReactNode;
}

function onIdle(callback: () => void): (() => void) | void {
  if (typeof globalThis === "undefined") return undefined;
  if ("requestIdleCallback" in globalThis) {
    const id = (globalThis as Window & typeof globalThis).requestIdleCallback(callback, {
      timeout: 2000,
    });
    return () => (globalThis as Window & typeof globalThis).cancelIdleCallback(id);
  }
  const id = globalThis.setTimeout(callback, 200);
  return () => globalThis.clearTimeout(id);
}

/**
 * Lenis + AOS solo en marketing. Se cargan con import() (fuera del dashboard),
 * se inicializan en tiempo idle y solo una vez: no se destruyen en cada navegación.
 */
export function MarketingMotionProvider({ children }: MarketingMotionProviderProps) {
  const pathname = usePathname();
  const aosReadyRef = useRef(false);
  const lenisRef = useRef<{ destroy: () => void; resize: () => void } | null>(null);

  useEffect(() => {
    let cancelled = false;

    onIdle(() => {
      void Promise.all([
        import("lenis"),
        import("aos"),
        import("lenis/dist/lenis.css"),
        import("aos/dist/aos.css"),
      ]).then(([lenisMod, aosMod]) => {
        if (cancelled) return;

        const Lenis = lenisMod.default;
        const AOS = aosMod.default;

        lenisRef.current = new Lenis({
          autoRaf: true,
          smoothWheel: true,
          gestureOrientation: "vertical",
          anchors: true,
        });

        AOS.init({
          once: true,
          duration: 700,
          easing: "ease-out-cubic",
          offset: 60,
          anchorPlacement: "top-bottom",
        });
        aosReadyRef.current = true;
      });
    });

    return () => {
      cancelled = true;
      aosReadyRef.current = false;
      lenisRef.current?.destroy();
      lenisRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!aosReadyRef.current) return;
    onIdle(() => {
      void import("aos").then((aosMod) => {
        aosMod.default.refresh();
        lenisRef.current?.resize();
      });
    });
  }, [pathname]);

  return <>{children}</>;
}