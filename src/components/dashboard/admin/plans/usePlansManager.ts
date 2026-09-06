"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import { createPlan, updatePlan, deletePlan } from "@/actions/admin/plans";
import type { Plan } from "@/lib/db/schema";
import { usePersistedState } from "@/hooks/useFormPersistence";
import { formStorageKey } from "@/lib/form-persistence";
import { confirmDeleteAction } from "@/lib/ui/confirm";
import { isPlatformSpecialPlan } from "@/lib/billing/plans";
import { type PlansTab, emptyForm } from "./types";
import { planSlugFromName } from "./utils";
import { planToFormData, formToPlanPayload } from "./plans-helpers";

interface UsePlansManagerProps {
  initialPlans: Plan[];
  t: (key: string) => string;
}

export function usePlansManager({ initialPlans, t }: UsePlansManagerProps) {
  const [tab, setTab] = useState<PlansTab>("list");
  const [plans, setPlans] = useState(initialPlans);
  const [form, setForm, clearForm] = usePersistedState(formStorageKey("admin.plans.form"), emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const editingSpecial = Boolean(
    editingId && plans.some((p) => p.id === editingId && isPlatformSpecialPlan(p)),
  );
  const editingFree = Boolean(
    editingId &&
      plans.some(
        (p) => p.id === editingId && (p.slug === "free" || p.slug === "gratis"),
      ),
  );
  const slugLocked = editingSpecial || editingFree;

  const liveSlug = useMemo(
    () => (editingFree ? "free" : slugLocked ? form.slug : planSlugFromName(form.name)),
    [editingFree, slugLocked, form.name, form.slug],
  );

  useEffect(() => {
    if (slugLocked) {
      if (editingFree && form.slug !== "free") {
        setForm((prev) => ({ ...prev, slug: "free" }));
      }
      return;
    }
    if (form.slug === liveSlug) return;
    setForm((prev) => ({ ...prev, slug: liveSlug }));
  }, [slugLocked, editingFree, form.slug, liveSlug, setForm]);

  const resetForm = () => {
    clearForm();
    setEditingId(null);
  };

  const openCreate = () => {
    resetForm();
    setTab("editor");
  };

  const onSubmit = () => {
    const name = form.name.trim();
    const slug = (editingFree ? "free" : slugLocked ? form.slug : planSlugFromName(name)).trim();
    if (!name || !slug) {
      toast.error(t("dashboard.admin.plansSlugRequired"));
      return;
    }

    startTransition(async () => {
      try {
        if (editingId) {
          const payload = editingSpecial
            ? { name, description: form.description || undefined }
            : formToPlanPayload(form, slug, name);
          const res = await updatePlan(editingId, payload);
          if (res.plan) {
            setPlans((prev) => prev.map((p) => (p.id === editingId ? res.plan! : p)));
          }
          toast.success(t("dashboard.admin.plansUpdated"));
        } else {
          const payload = formToPlanPayload(form, slug, name);
          const res = await createPlan(payload);
          if (res.plan) setPlans((prev) => [...prev, res.plan!].sort((a, b) => a.sortOrder - b.sortOrder));
          toast.success(t("dashboard.admin.plansCreated"));
        }
        resetForm();
        setTab("list");
      } catch (e) {
        toast.error(e instanceof Error ? e.message : t("dashboard.admin.plansSaveError"));
      }
    });
  };

  const onEdit = (plan: Plan) => {
    setEditingId(plan.id);
    setForm(planToFormData(plan));
    setTab("editor");
  };

  const onDelete = (id: string) => {
    void (async () => {
      const confirmed = await confirmDeleteAction({
        title: t("dashboard.admin.plansDeleteTitle"),
        text: t("dashboard.admin.plansDeleteConfirm"),
        confirmText: t("common.delete"),
        cancelText: t("common.cancel"),
        tone: "danger",
      });
      if (!confirmed) return;

      startTransition(async () => {
        try {
          await deletePlan(id);
          setPlans((prev) => prev.filter((p) => p.id !== id));
          toast.success(t("dashboard.admin.plansDeleted"));
        } catch (e) {
          toast.error(e instanceof Error ? e.message : t("dashboard.admin.plansDeleteError"));
        }
      });
    })();
  };

  const cancelEditor = () => {
    resetForm();
    setTab("list");
  };

  return {
    tab,
    setTab,
    plans,
    form,
    setForm,
    editingId,
    editingSpecial,
    slugLocked,
    liveSlug,
    isPending,
    resetForm,
    openCreate,
    onSubmit,
    onEdit,
    onDelete,
    cancelEditor,
  };
}
