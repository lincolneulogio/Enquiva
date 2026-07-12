"use client";

import { useEffect, useState, type ReactNode } from "react";
import { ThemeProvider } from "next-themes";

if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
    const orig = console.error;
    console.error = (...args: unknown[]) => {
        if (typeof args[0] === "string" && args[0].includes("Encountered a script tag")) return;
        orig.apply(console, args as Parameters<typeof console.error>);
    };
}

interface AppThemeProviderProps {
    children: ReactNode;
}

export function AppThemeProvider({ children }: AppThemeProviderProps) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) {
        return <>{children}</>;
    }

    return (
        <ThemeProvider
            attribute="class"
            defaultTheme="light"
            enableSystem={false}
            disableTransitionOnChange
        >
            {children}
        </ThemeProvider>
    );
}