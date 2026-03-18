"use client";

import { useEffect, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import AOS from "aos";

interface AOSProviderProps {
    children: ReactNode;
}

export function AOSProvider({ children }: AOSProviderProps) {
    const pathname = usePathname();

    useEffect(() => {
        AOS.init({
            once: true,
            duration: 700,
            easing: "ease-out-cubic",
            offset: 60,
            anchorPlacement: "top-bottom",
        });
    }, []);

    useEffect(() => {
        const id = window.requestAnimationFrame(() => {
            AOS.refreshHard();
        });

        return () => window.cancelAnimationFrame(id);
    }, [pathname]);

    return <>{children}</>;
}