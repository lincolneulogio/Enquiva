"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useTranslations } from "@/components/providers/LocaleProvider";
import { deleteOrphanUploadAction } from "@/actions/admin/upload-cleanup";
import { sendNewsletterBroadcastAction } from "@/actions/admin/newsletter";

export function useNewsletterBroadcast(startTransition: (cb: () => Promise<void>) => void) {
  const t = useTranslations();
  const [isBroadcastModalOpen, setIsBroadcastModalOpen] = useState(false);
  const [broadcastSubject, setBroadcastSubject] = useState("");
  const [broadcastMessage, setBroadcastMessage] = useState("");
  const [broadcastImageUrl, setBroadcastImageUrl] = useState<string | null>(null);

  const resetBroadcastState = () => {
    setIsBroadcastModalOpen(false);
    setBroadcastSubject("");
    setBroadcastMessage("");
    setBroadcastImageUrl(null);
  };

  const closeBroadcastModal = () => {
    // Solo se elimina la imagen si el envío fue cancelado (archivo huérfano).
    // Tras un envío exitoso la imagen ya viaja en los correos (URL/CID) y
    // borrarla rompería el renderizado en los buzones de los suscriptores.
    if (broadcastImageUrl) {
      deleteOrphanUploadAction(broadcastImageUrl).catch(() => {});
    }
    resetBroadcastState();
  };

  const handleSendBroadcast = (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastSubject.trim() || !broadcastMessage.trim()) {
      toast.error(t("dashboard.admin.newsletterRequiredFields"));
      return;
    }

    startTransition(async () => {
      try {
        const res = await sendNewsletterBroadcastAction({
          subject: broadcastSubject,
          message: broadcastMessage,
          imageUrl: broadcastImageUrl ?? undefined,
        });

        if (res.success) {
          toast.success(
            t("dashboard.admin.newsletterBroadcastSent", {
              count: res.recipientCount ?? 0,
            })
          );
          resetBroadcastState();
        } else {
          toast.error(res.error ?? t("dashboard.admin.newsletterBroadcastError"));
        }
      } catch {
        toast.error(t("dashboard.admin.newsletterBroadcastUnexpectedError"));
      }
    });
  };

  return {
    isBroadcastModalOpen,
    setIsBroadcastModalOpen,
    broadcastSubject,
    setBroadcastSubject,
    broadcastMessage,
    setBroadcastMessage,
    broadcastImageUrl,
    setBroadcastImageUrl,
    closeBroadcastModal,
    handleSendBroadcast,
  };
}
