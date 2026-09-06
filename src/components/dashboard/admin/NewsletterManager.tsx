"use client";

import { useState, useTransition, useMemo, useEffect } from "react";
import type { NewsletterSubscriber } from "@/lib/db/schema/marketing";
import {
  toggleSubscriberStatusAction,
  deleteSubscriberAction,
  exportNewsletterSubscribersCsvAction,
  sendNewsletterBroadcastAction,
  type NewsletterStats,
} from "@/actions/admin/newsletter";
import { deleteOrphanUploadAction } from "@/actions/admin/upload-cleanup";
import { toast } from "sonner";
import {
  type NewsletterManagerProps,
  type StatusFilter,
  NewsletterStatsCards,
  NewsletterControls,
  NewsletterSubscribersTable,
  NewsletterBroadcastModal,
  DeleteSubscriberModal,
} from "./newsletter";

export function NewsletterManager({
  initialSubscribers,
  initialStats,
}: NewsletterManagerProps) {
  const [subscribers, setSubscribers] = useState<NewsletterSubscriber[]>(initialSubscribers);
  const [stats, setStats] = useState<NewsletterStats>(initialStats);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [isBroadcastModalOpen, setIsBroadcastModalOpen] = useState(false);
  const [broadcastSubject, setBroadcastSubject] = useState("");
  const [broadcastMessage, setBroadcastMessage] = useState("");
  const [broadcastImageUrl, setBroadcastImageUrl] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null);

  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setPortalTarget(document.body);
  }, []);

  useEffect(() => {
    const isModalOpen = isBroadcastModalOpen || Boolean(deleteConfirmId);
    if (!isModalOpen) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (deleteConfirmId) {
          setDeleteConfirmId(null);
        } else if (isBroadcastModalOpen) {
          closeBroadcastModal();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isBroadcastModalOpen, deleteConfirmId]);

  const filteredSubscribers = useMemo(() => {
    return subscribers.filter((sub) => {
      const matchesSearch = sub.email.toLowerCase().includes(searchTerm.toLowerCase().trim());
      const matchesStatus = statusFilter === "all" || sub.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [subscribers, searchTerm, statusFilter]);

  const handleExportCsv = () => {
    startTransition(async () => {
      try {
        const csvContent = await exportNewsletterSubscribersCsvAction();
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute(
          "download",
          `enquiva-suscriptores-boletin-${new Date().toISOString().slice(0, 10)}.csv`
        );
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        toast.success("Archivo CSV exportado exitosamente.");
      } catch {
        toast.error("Error al exportar los datos.");
      }
    });
  };

  const handleToggleStatus = (sub: NewsletterSubscriber) => {
    const nextStatus = sub.status === "active" ? "unsubscribed" : "active";
    setSubscribers((prev) =>
      prev.map((s) => (s.id === sub.id ? { ...s, status: nextStatus } : s))
    );
    setStats((prev) => ({
      ...prev,
      active: nextStatus === "active" ? prev.active + 1 : Math.max(0, prev.active - 1),
      unsubscribed: nextStatus === "unsubscribed" ? prev.unsubscribed + 1 : Math.max(0, prev.unsubscribed - 1),
    }));

    startTransition(async () => {
      try {
        await toggleSubscriberStatusAction(sub.id, nextStatus);
        toast.success(
          nextStatus === "active"
            ? "Suscriptor activado."
            : "Suscriptor dado de baja."
        );
      } catch {
        setSubscribers((prev) =>
          prev.map((s) => (s.id === sub.id ? { ...s, status: sub.status } : s))
        );
        toast.error("Error al cambiar el estado del suscriptor.");
      }
    });
  };

  const handleDelete = (id: string) => {
    startTransition(async () => {
      try {
        const res = await deleteSubscriberAction(id);
        if (res.success) {
          const removed = subscribers.find((s) => s.id === id);
          setSubscribers((prev) => prev.filter((s) => s.id !== id));
          if (removed) {
            setStats((prev) => ({
              total: Math.max(0, prev.total - 1),
              active: removed.status === "active" ? Math.max(0, prev.active - 1) : prev.active,
              unsubscribed: removed.status === "unsubscribed" ? Math.max(0, prev.unsubscribed - 1) : prev.unsubscribed,
            }));
          }
          toast.success("Suscriptor eliminado.");
          setDeleteConfirmId(null);
        } else {
          toast.error("No se pudo eliminar el suscriptor.");
        }
      } catch {
        toast.error("Error al eliminar suscriptor.");
      }
    });
  };

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

  return (
    <div className="space-y-6">
      <NewsletterStatsCards stats={stats} />

      <NewsletterControls
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        stats={stats}
        isPending={isPending}
        onExportCsv={handleExportCsv}
        onOpenBroadcastModal={() => setIsBroadcastModalOpen(true)}
      />

      <NewsletterSubscribersTable
        subscribers={filteredSubscribers}
        searchTerm={searchTerm}
        isPending={isPending}
        onToggleStatus={handleToggleStatus}
        onConfirmDelete={(id: string) => setDeleteConfirmId(id)}
      />

      <NewsletterBroadcastModal
        isOpen={isBroadcastModalOpen}
        portalTarget={portalTarget}
        stats={stats}
        isPending={isPending}
        broadcastSubject={broadcastSubject}
        setBroadcastSubject={setBroadcastSubject}
        broadcastMessage={broadcastMessage}
        setBroadcastMessage={setBroadcastMessage}
        broadcastImageUrl={broadcastImageUrl}
        setBroadcastImageUrl={setBroadcastImageUrl}
        onClose={closeBroadcastModal}
        onSubmit={handleSendBroadcast}
      />

      <DeleteSubscriberModal
        portalTarget={portalTarget}
        deleteConfirmId={deleteConfirmId}
        isPending={isPending}
        onClose={() => setDeleteConfirmId(null)}
        onConfirm={handleDelete}
      />
    </div>
  );
}
