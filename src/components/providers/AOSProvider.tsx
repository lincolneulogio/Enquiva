"use client";

import { useEffect, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import AOS from "aos";

interface AOSProviderProps {
  children: ReactNode;
}

const DASHBOARD_PREFIXES = ["/dashboard", "/admin", "/superadmin", "/member", "/organizer"];

function isDashboardPath(pathname: string): boolean {
  return DASHBOARD_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

export function AOSProvider({ children }: AOSProviderProps) {
  const pathname = usePathname();

  useEffect(() => {
    if (isDashboardPath(pathname ?? "/")) return;

    let cancelled = false;
    void import("aos/dist/aos.css").then(() => {
      if (cancelled) return;
      AOS.init({
        once: true,
        duration: 700,
        easing: "ease-out-cubic",
        offset: 60,
        anchorPlacement: "top-bottom",
      });
    });

    return () => {
      cancelled = true;
    };
  }, [pathname]);

  useEffect(() => {
    if (isDashboardPath(pathname ?? "/")) return;
    const id = window.requestAnimationFrame(() => {
      AOS.refreshHard();
    });
    return () => window.cancelAnimationFrame(id);
  }, [pathname]);

  return <>{children}</>;
}
