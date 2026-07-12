"use client";

import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import {
  getWebPushPublicKeyAction,
  subscribeWebPushAction,
  unsubscribeWebPushAction,
} from "@/actions/push";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
}

export function WebPushToggle() {
  const [enabled, setEnabled] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const [supported, setSupported] = useState(false);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    const pushSupported =
      typeof window !== "undefined" &&
      "serviceWorker" in navigator &&
      "PushManager" in window &&
      "Notification" in window;
    setSupported(pushSupported);

    void (async () => {
      const config = await getWebPushPublicKeyAction();
      setEnabled(config.enabled);
      if (!pushSupported || !config.enabled) return;

      const registration = await navigator.serviceWorker.getRegistration("/sw.js");
      const existing = await registration?.pushManager.getSubscription();
      setSubscribed(Boolean(existing));
    })();
  }, []);

  if (!supported || !enabled) return null;

  const toggle = () => {
    startTransition(async () => {
      try {
        const config = await getWebPushPublicKeyAction();
        if (!config.enabled || !config.publicKey) {
          toast.error("Web Push no está disponible");
          return;
        }

        let registration = await navigator.serviceWorker.getRegistration("/sw.js");
        if (!registration) {
          registration = await navigator.serviceWorker.register("/sw.js");
          await navigator.serviceWorker.ready;
        }

        if (subscribed) {
          const current = await registration.pushManager.getSubscription();
          if (current) {
            await unsubscribeWebPushAction(current.endpoint);
            await current.unsubscribe();
          }
          setSubscribed(false);
          toast.success("Notificaciones push desactivadas");
          return;
        }

        const permission = await Notification.requestPermission();
        if (permission !== "granted") {
          toast.error("Permiso de notificaciones denegado");
          return;
        }

        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(config.publicKey),
        });

        const json = subscription.toJSON();
        if (!json.endpoint || !json.keys?.p256dh || !json.keys?.auth) {
          throw new Error("Suscripción push incompleta");
        }

        await subscribeWebPushAction({
          endpoint: json.endpoint,
          keys: {
            p256dh: json.keys.p256dh,
            auth: json.keys.auth,
          },
        });
        setSubscribed(true);
        toast.success("Notificaciones push activadas");
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "No se pudo actualizar Web Push");
      }
    });
  };

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={pending}
      className="rounded-xl border border-border bg-background px-4 py-2 text-sm font-medium text-foreground hover:bg-secondary disabled:opacity-60"
    >
      {pending
        ? "Guardando…"
        : subscribed
          ? "Desactivar notificaciones push"
          : "Activar notificaciones push"}
    </button>
  );
}
