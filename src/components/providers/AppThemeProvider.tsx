"use client";

import { useEffect, useState, type ReactNode } from "react";
import { ThemeProvider } from "next-themes";

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