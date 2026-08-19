"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { usePathname } from "next/navigation";

interface MarketingMotionProviderProps {
  children: ReactNode;
}

/**
 * Lenis + AOS solo en marketing. Se cargan con import() (fuera del dashboard)
 * y se inicializan una vez: no se destruyen en cada navegación interna.
 */
export function MarketingMotionProvider({ children }: MarketingMotionProviderProps) {
  const pathname = usePathname();
  const aosReadyRef = useRef(false);
  const lenisRef = useRef<{ destroy: () => void; resize: () => void } | null>(null);

  useEffect(() => {
    let cancelled = false;

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

    return () => {
      cancelled = true;
      aosReadyRef.current = false;
      lenisRef.current?.destroy();
      lenisRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!aosReadyRef.current) return;
    void import("aos").then((aosMod) => {
      aosMod.default.refresh();
      lenisRef.current?.resize();
    });
  }, [pathname]);

  return <>{children}</>;
}
