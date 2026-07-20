"use client";

import { useEffect, useMemo, useRef, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import Lenis from "lenis";

interface LenisProviderProps {
    children: ReactNode;
}

const DASHBOARD_PREFIXES = ["/dashboard", "/admin", "/superadmin", "/member", "/organizer"];

function isDashboardPath(pathname: string): boolean {
    return DASHBOARD_PREFIXES.some(
        (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
    );
}

export function LenisProvider({ children }: LenisProviderProps) {
    const pathname = usePathname();
    const lenisRef = useRef<Lenis | null>(null);

    const isDashboardRoute = useMemo(
        () => isDashboardPath(pathname ?? "/"),
        [pathname]
    );

    useEffect(() => {
        if (isDashboardRoute) {
            lenisRef.current?.destroy();
            lenisRef.current = null;
            return;
        }

        let cancelled = false;
        let lenis: Lenis | null = null;

        void import("lenis/dist/lenis.css").then(() => {
            if (cancelled) return;

            lenis = new Lenis({
                autoRaf: true,
                smoothWheel: true,
                gestureOrientation: "vertical",
                anchors: true,
            });

            lenisRef.current = lenis;
            if (typeof window !== "undefined") {
                window.__enquivaLenis = lenis;
            }
        });

        return () => {
            cancelled = true;
            lenis?.destroy();
            if (lenisRef.current === lenis) {
                lenisRef.current = null;
            }
            if (typeof window !== "undefined" && window.__enquivaLenis === lenis) {
                window.__enquivaLenis = null;
            }
        };
    }, [isDashboardRoute]);

    useEffect(() => {
        if (isDashboardRoute || !lenisRef.current) return;

        const rafId = window.requestAnimationFrame(() => {
            lenisRef.current?.resize();
        });

        return () => window.cancelAnimationFrame(rafId);
    }, [isDashboardRoute, pathname]);

    return <>{children}</>;
}