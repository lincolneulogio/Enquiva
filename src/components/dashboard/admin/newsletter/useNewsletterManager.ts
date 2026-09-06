"use client";

import { useState, useTransition, useMemo, useEffect } from "react";
import type { NewsletterSubscriber } from "@/lib/db/schema/marketing";
import {
  toggleSubscriberStatusAction,
  deleteSubscriberAction,
  exportNewsletterSubscribersCsvAction,
  type NewsletterStats,
} from "@/actions/admin/newsletter";
import { toast } from "sonner";
import { useTranslations } from "@/components/providers/LocaleProvider";
import type { StatusFilter } from "./types";
import { useNewsletterBroadcast } from "./useNewsletterBroadcast";

interface UseNewsletterManagerProps {
  initialSubscribers: NewsletterSubscriber[];
  initialStats: NewsletterStats;
}

export function useNewsletterManager({
  initialSubscribers,
  initialStats,
}: UseNewsletterManagerProps) {
  const t = useTranslations();
  const [subscribers, setSubscribers] = useState<NewsletterSubscriber[]>(initialSubscribers);
  const [stats, setStats] = useState<NewsletterStats>(initialStats);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null);

  const [isPending, startTransition] = useTransition();

  const broadcast = useNewsletterBroadcast(startTransition);
  const { isBroadcastModalOpen, closeBroadcastModal } = broadcast;

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
  }, [isBroadcastModalOpen, deleteConfirmId, closeBroadcastModal]);

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
        toast.success(t("dashboard.admin.newsletterCsvExported"));
      } catch {
        toast.error(t("dashboard.admin.newsletterCsvError"));
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
            ? t("dashboard.admin.newsletterSubscriberActivated")
            : t("dashboard.admin.newsletterSubscriberUnsubscribed")
        );
      } catch {
        setSubscribers((prev) =>
          prev.map((s) => (s.id === sub.id ? { ...s, status: sub.status } : s))
        );
        toast.error(t("dashboard.admin.newsletterStatusError"));
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
          toast.success(t("dashboard.admin.newsletterSubscriberDeleted"));
          setDeleteConfirmId(null);
        } else {
          toast.error(t("dashboard.admin.newsletterDeleteError"));
        }
      } catch {
        toast.error(t("dashboard.admin.newsletterDeleteError"));
      }
    });
  };

  return {
    subscribers,
    stats,
    searchTerm,
    setSearchTerm,
    statusFilter,
    setStatusFilter,
    filteredSubscribers,
    deleteConfirmId,
    setDeleteConfirmId,
    portalTarget,
    isPending,
    handleExportCsv,
    handleToggleStatus,
    handleDelete,
    ...broadcast,
  };
}
