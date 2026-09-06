"use client";

import { useState, useTransition, useEffect } from "react";
import type { Testimonial } from "@/lib/db/schema/marketing";
import {
  deleteTestimonialAction,
  toggleTestimonialFeaturedAction,
} from "@/actions/admin/testimonials";
import { toast } from "sonner";
import { useTranslations } from "@/components/providers/LocaleProvider";
import { useTestimonialForm } from "./useTestimonialForm";

export function useTestimonialsManager(initialTestimonials: Testimonial[]) {
  const t = useTranslations();
  const [items, setItems] = useState<Testimonial[]>(initialTestimonials);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null);
  const [isPending, startTransition] = useTransition();

  const formModal = useTestimonialForm(items, setItems, startTransition);
  const { isModalOpen, closeModal } = formModal;

  useEffect(() => {
    setPortalTarget(document.body);
  }, []);

  useEffect(() => {
    const isAnyModalOpen = isModalOpen || Boolean(deleteConfirmId);
    if (!isAnyModalOpen) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (deleteConfirmId) {
          setDeleteConfirmId(null);
        } else if (isModalOpen) {
          closeModal();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isModalOpen, deleteConfirmId, closeModal]);

  const featuredCount = items.filter((i) => i.isFeatured).length;
  const avgRating =
    items.length > 0
      ? (items.reduce((acc, i) => acc + i.rating, 0) / items.length).toFixed(1)
      : "5.0";

  const handleToggleFeatured = (item: Testimonial) => {
    const nextState = !item.isFeatured;
    setItems((prev) =>
      prev.map((t) => (t.id === item.id ? { ...t, isFeatured: nextState } : t))
    );

    startTransition(async () => {
      try {
        const res = await toggleTestimonialFeaturedAction(item.id, nextState);
        if (res.success) {
          toast.success(
            nextState
              ? t("dashboard.admin.testimonialFeaturedOn")
              : t("dashboard.admin.testimonialFeaturedOff")
          );
        } else {
          setItems((prev) =>
            prev.map((t) => (t.id === item.id ? { ...t, isFeatured: !nextState } : t))
          );
          toast.error(t("dashboard.admin.testimonialFeaturedError"));
        }
      } catch {
        setItems((prev) =>
          prev.map((t) => (t.id === item.id ? { ...t, isFeatured: !nextState } : t))
        );
        toast.error(t("dashboard.admin.testimonialRequestError"));
      }
    });
  };

  const handleDelete = (id: string) => {
    startTransition(async () => {
      try {
        const res = await deleteTestimonialAction(id);
        if (res.success) {
          setItems((prev) => prev.filter((t) => t.id !== id));
          toast.success(t("dashboard.admin.testimonialDeleted"));
          setDeleteConfirmId(null);
        } else {
          toast.error(t("dashboard.admin.testimonialDeleteError"));
        }
      } catch {
        toast.error(t("dashboard.admin.testimonialDeleteError"));
      }
    });
  };

  return {
    items,
    featuredCount,
    avgRating,
    deleteConfirmId,
    setDeleteConfirmId,
    portalTarget,
    isPending,
    handleToggleFeatured,
    handleDelete,
    ...formModal,
  };
}
