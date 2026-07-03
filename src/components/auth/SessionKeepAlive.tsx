"use client";

import { useEffect } from "react";
import { getSession } from "@/lib/auth/client";

const REFRESH_INTERVAL_MS = 25 * 60 * 1000;

/** Mantiene la sesión activa durante jornadas largas (eventos, check-in). */
export function SessionKeepAlive() {
  useEffect(() => {
    const refresh = () => {
      void getSession().catch(() => undefined);
    };

    refresh();
    const timer = window.setInterval(refresh, REFRESH_INTERVAL_MS);

    const onActivity = () => refresh();
    window.addEventListener("focus", onActivity);
    document.addEventListener("visibilitychange", onActivity);

    return () => {
      window.clearInterval(timer);
      window.removeEventListener("focus", onActivity);
      document.removeEventListener("visibilitychange", onActivity);
    };
  }, []);

  return null;
}
