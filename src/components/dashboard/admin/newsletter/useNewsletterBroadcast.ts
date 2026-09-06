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
          closeBroadcastModal();
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
