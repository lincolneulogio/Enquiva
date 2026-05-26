"use client";

import { useState, useEffect, useTransition } from "react";
import { toast } from "sonner";
import { subscribeToPushAction, unsubscribeFromPushAction } from "@/actions/push-subscriptions";
import { BellRing, ShieldAlert, Loader2, Sparkles } from "lucide-react";
import { useLocale } from "@/components/providers/LocaleProvider";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/\-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function PushNotificationToggle() {
  const { locale } = useLocale();
  const [isPending, startTransition] = useTransition();
  
  const [isSupported, setIsSupported] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const [loading, setLoading] = useState(true);

  const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "";

  useEffect(() => {
    const checkSupportAndSubscription = async () => {
      if (
        typeof window !== "undefined" &&
        "serviceWorker" in navigator &&
        "PushManager" in window
      ) {
        setIsSupported(true);
        try {
          const registration = await navigator.serviceWorker.ready;
          const subscription = await registration.pushManager.getSubscription();
          setIsActive(!!subscription);
        } catch (e) {
          console.error("Failed to check push subscription status:", e);
        }
      } else {
        setIsSupported(false);
      }
      setLoading(false);
    };

    checkSupportAndSubscription();
  }, []);

  const handleToggleClick = async () => {
    if (!isSupported || !vapidPublicKey) {
      toast.error(
        locale === "en"
          ? "Push notifications are not supported or keys are missing."
          : "Las notificaciones push no están soportadas o faltan las llaves de seguridad."
      );
      return;
    }

    setLoading(true);
    startTransition(async () => {
      try {
        if (!isActive) {
          // 1. Register the Service Worker
          const registration = await navigator.serviceWorker.register("/sw.js", {
            scope: "/",
          });
          
          await navigator.serviceWorker.ready;

          // 2. Request browser permission
          const permission = await Notification.requestPermission();
          if (permission !== "granted") {
            toast.error(
              locale === "en"
                ? "Permission denied for browser notifications."
                : "Permiso denegado para mostrar notificaciones."
            );
            setLoading(false);
            return;
          }

          // 3. Generate native subscription
          const subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
          });

          // 4. Extract keys as strings safely
          const p256dh = subscription.getKey("p256dh");
          const auth = subscription.getKey("auth");
          
          if (!p256dh || !auth) {
            throw new Error("Failed to retrieve subscription cryptographic keys.");
          }

          const subscriptionKeys = {
            endpoint: subscription.endpoint,
            p256dh: btoa(String.fromCharCode.apply(null, Array.from(new Uint8Array(p256dh)))),
            auth: btoa(String.fromCharCode.apply(null, Array.from(new Uint8Array(auth)))),
          };

          // 5. Send to Database
          await subscribeToPushAction(subscriptionKeys);

          setIsActive(true);
          toast.success(
            locale === "en"
              ? "Push notifications enabled successfully!"
              : "¡Notificaciones push activadas correctamente!"
          );
        } else {
          // Unsubscribe logic
          const registration = await navigator.serviceWorker.ready;
          const subscription = await registration.pushManager.getSubscription();
          
          if (subscription) {
            // Delete from Database
            await unsubscribeFromPushAction(subscription.endpoint);
            // Revoke locally
            await subscription.unsubscribe();
          }

          setIsActive(false);
          toast.success(
            locale === "en"
              ? "Notifications disabled."
              : "Notificaciones push desactivadas."
          );
        }
      } catch (err) {
        console.error("Push toggle action error:", err);
        toast.error(
          locale === "en"
            ? "An error occurred during push activation."
            : "Ocurrió un error al configurar las notificaciones push."
        );
      } finally {
        setLoading(false);
      }
    });
  };

  if (!isSupported) {
    return (
      <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4 flex gap-3 text-xs text-amber-700 items-start">
        <ShieldAlert className="h-5 w-5 shrink-0 mt-0.5" />
        <div>
          <p className="font-bold">{locale === "en" ? "Web Push Not Supported" : "Web Push No Soportado"}</p>
          <p className="mt-1 leading-normal">
            {locale === "en"
              ? "Your browser or device does not support lock-screen push notifications. Try using Google Chrome or adding this site to your Home Screen on iOS."
              : "Tu navegador o dispositivo no soporta notificaciones nativas en pantalla de bloqueo. Intenta usar Google Chrome o añade este sitio a tu pantalla de inicio en iOS."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="fe-glass border border-border/80 bg-card rounded-2xl p-5 shadow-sm space-y-3.5 relative overflow-hidden group transition duration-300 hover:border-primary/25">
      {/* Decorative light spark */}
      <div className="absolute top-0 right-0 h-16 w-16 bg-primary/5 rounded-full blur-xl group-hover:bg-primary/10 transition-colors" />

      <div className="flex items-start justify-between gap-4">
        <div className="flex gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <BellRing className={`h-5 w-5 ${isActive ? "animate-bounce" : ""}`} />
          </div>
          <div className="space-y-1">
            <h3 className="font-bold text-foreground text-sm flex items-center gap-1.5">
              {locale === "en" ? "Lock-Screen Push Notifications" : "Alertas en Pantalla de Bloqueo"}
              <Sparkles className="h-3.5 w-3.5 text-amber-500 shrink-0" />
            </h3>
            <p className="text-xs text-muted-foreground leading-normal max-w-sm">
              {locale === "en"
                ? "Receive instant, native alerts on your phone whenever your payment is approved or when the bus routing details change."
                : "Recibe avisos nativos inmediatos en tu celular al aprobarse tu entrada o si cambian las coordinaciones del autobús."}
            </p>
          </div>
        </div>

        {/* Toggle Switch */}
        <button
          type="button"
          disabled={loading || isPending}
          onClick={handleToggleClick}
          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary/20 ${
            isActive ? "bg-primary" : "bg-muted"
          } disabled:opacity-50 mt-1.5`}
        >
          {loading || isPending ? (
            <span className="absolute inset-0 flex items-center justify-center">
              <Loader2 className="h-3.5 w-3.5 animate-spin text-foreground/80" />
            </span>
          ) : (
            <span
              aria-hidden="true"
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                isActive ? "translate-x-5" : "translate-x-0"
              }`}
            />
          )}
        </button>
      </div>
    </div>
  );
}
