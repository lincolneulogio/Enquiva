"use client";

import { useState } from "react";
import { toast } from "sonner";
import { deleteOrphanUploadAction } from "@/actions/admin/upload-cleanup";
import { sendNewsletterBroadcastAction } from "@/actions/admin/newsletter";

export function useNewsletterBroadcast(startTransition: (cb: () => Promise<void>) => void) {
  const [isBroadcastModalOpen, setIsBroadcastModalOpen] = useState(false);
  const [broadcastSubject, setBroadcastSubject] = useState("");
  const [broadcastMessage, setBroadcastMessage] = useState("");
  const [broadcastImageUrl, setBroadcastImageUrl] = useState<string | null>(null);

  const closeBroadcastModal = () => {
    if (broadcastImageUrl) {
      deleteOrphanUploadAction(broadcastImageUrl).catch(() => {});
    }
    setIsBroadcastModalOpen(false);
    setBroadcastSubject("");
    setBroadcastMessage("");
    setBroadcastImageUrl(null);
  };

  const handleSendBroadcast = (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastSubject.trim() || !broadcastMessage.trim()) {
      toast.error("Por favor completa el asunto y el mensaje.");
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
          toast.success(`Comunicado enviado a ${res.recipientCount} suscriptores activos.`);
          closeBroadcastModal();
        } else {
          toast.error(res.error ?? "No se pudo enviar el comunicado.");
        }
      } catch {
        toast.error("Error inesperado al enviar comunicado.");
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
