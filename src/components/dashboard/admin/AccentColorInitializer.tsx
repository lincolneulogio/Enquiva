"use client";

import { useEffect } from "react";

export const ACCENT_COLORS = {
    amber: {
        name: "Ámbar / Naranja",
        class: "bg-[#d97706]",
        light: {
            primary: "32 91% 44%",
            ring: "32 91% 44%",
            accent: "29 48% 48%",
            background: "34 44% 93%",
            foreground: "25 60% 16%",
            border: "34 15% 82%",
            sidebarBackground: "25 60% 16%",
            sidebarAccent: "27 61% 24%",
            sidebarBorder: "27 61% 20%",
            sidebarForeground: "34 44% 93%",
        },
        dark: {
            primary: "32 91% 48%",
            ring: "32 91% 48%",
            accent: "29 48% 52%",
            background: "24 50% 5%",
            foreground: "34 44% 93%",
            border: "21 11% 18%",
            sidebarBackground: "300 7% 4%",
            sidebarAccent: "25 45% 10%",
            sidebarBorder: "21 11% 14%",
            sidebarForeground: "34 44% 93%",
        }
    },
    emerald: {
        name: "Esmeralda",
        class: "bg-[#10b981]",
        light: {
            primary: "142 70% 36%",
            ring: "142 70% 36%",
            accent: "142 65% 28%",
            background: "140 30% 95%",
            foreground: "160 50% 12%",
            border: "140 15% 84%",
            sidebarBackground: "160 50% 12%",
            sidebarAccent: "160 40% 18%",
            sidebarBorder: "160 40% 14%",
            sidebarForeground: "140 30% 93%",
        },
        dark: {
            primary: "142 65% 42%",
            ring: "142 65% 42%",
            accent: "142 55% 48%",
            background: "160 30% 6%",
            foreground: "140 30% 90%",
            border: "160 15% 18%",
            sidebarBackground: "160 35% 5%",
            sidebarAccent: "160 30% 12%",
            sidebarBorder: "160 30% 10%",
            sidebarForeground: "140 30% 90%",
        }
    },
    rose: {
        name: "Rosado Premium",
        class: "bg-[#f43f5e]",
        light: {
            primary: "330 81% 52%",
            ring: "330 81% 52%",
            accent: "330 75% 44%",
            background: "330 30% 96%",
            foreground: "330 50% 14%",
            border: "330 15% 86%",
            sidebarBackground: "330 50% 13%",
            sidebarAccent: "330 40% 19%",
            sidebarBorder: "330 40% 15%",
            sidebarForeground: "330 30% 93%",
        },
        dark: {
            primary: "330 80% 60%",
            ring: "330 80% 60%",
            accent: "330 70% 65%",
            background: "330 30% 6%",
            foreground: "330 30% 90%",
            border: "330 15% 18%",
            sidebarBackground: "330 35% 5%",
            sidebarAccent: "330 30% 12%",
            sidebarBorder: "330 30% 10%",
            sidebarForeground: "330 30% 90%",
        }
    },
    blue: {
        name: "Azul Eléctrico",
        class: "bg-[#2563eb]",
        light: {
            primary: "217 91% 56%",
            ring: "217 91% 56%",
            accent: "217 80% 45%",
            background: "215 30% 95%",
            foreground: "222 47% 11%",
            border: "215 15% 84%",
            sidebarBackground: "222 47% 11%",
            sidebarAccent: "222 40% 18%",
            sidebarBorder: "222 40% 14%",
            sidebarForeground: "210 40% 93%",
        },
        dark: {
            primary: "217 91% 60%",
            ring: "217 91% 60%",
            accent: "217 80% 65%",
            background: "222 40% 6%",
            foreground: "210 40% 90%",
            border: "222 15% 18%",
            sidebarBackground: "222 35% 5%",
            sidebarAccent: "222 30% 12%",
            sidebarBorder: "222 30% 10%",
            sidebarForeground: "210 40% 90%",
        }
    },
};

export type AccentColor = keyof typeof ACCENT_COLORS;

export function applyAccentColor(color: AccentColor, isDark?: boolean) {
    if (typeof window === "undefined") return;
    
    const root = document.documentElement;
    const config = ACCENT_COLORS[color] || ACCENT_COLORS.amber;
    
    // Detect dark mode if not explicitly provided
    const darkActive = isDark !== undefined ? isDark : root.classList.contains("dark");
    const modeConfig = darkActive ? config.dark : config.light;
    
    root.style.setProperty("--primary", modeConfig.primary);
    root.style.setProperty("--ring", modeConfig.ring);
    root.style.setProperty("--accent", modeConfig.accent);
    root.style.setProperty("--background", modeConfig.background);
    root.style.setProperty("--foreground", modeConfig.foreground);
    root.style.setProperty("--border", modeConfig.border);
    root.style.setProperty("--input", modeConfig.border);
    
    // Sidebar dynamic repainting
    root.style.setProperty("--sidebar-background", modeConfig.sidebarBackground);
    root.style.setProperty("--sidebar-accent", modeConfig.sidebarAccent);
    root.style.setProperty("--sidebar-border", modeConfig.sidebarBorder);
    root.style.setProperty("--sidebar-foreground", modeConfig.sidebarForeground);
    root.style.setProperty("--sidebar-primary", modeConfig.primary);
    root.style.setProperty("--sidebar-ring", modeConfig.primary);
    
    localStorage.setItem("brand-accent", color);
    window.dispatchEvent(new Event("brand-accent-changed"));
}

export function AccentColorInitializer() {
    useEffect(() => {
        const updateColors = () => {
            const saved = localStorage.getItem("brand-accent") as AccentColor;
            if (saved && ACCENT_COLORS[saved]) {
                const isDark = document.documentElement.classList.contains("dark");
                applyAccentColor(saved, isDark);
            }
        };

        // Run once initially
        updateColors();

        // Listen for class changes on HTML element (theme changes)
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.attributeName === "class") {
                    updateColors();
                }
            });
        });

        observer.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ["class"],
        });

        return () => observer.disconnect();
    }, []);

    return null;
}
