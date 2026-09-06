"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import {
  createPlan,
  updatePlan,
  deletePlan,
} from "@/actions/admin/plans";
import { Plus, List, FilePenLine } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Plan } from "@/lib/db/schema";
import { usePersistedState } from "@/hooks/useFormPersistence";
import { formStorageKey } from "@/lib/form-persistence";
import { confirmDeleteAction } from "@/lib/ui/confirm";
import { useTranslations } from "@/components/providers/LocaleProvider";
import { isPlatformSpecialPlan } from "@/lib/billing/plans";
import {
  type PlansTab,
  type PlansManagerProps,
  emptyForm,
  planSlugFromName,
  PlansList,
  PlanEditorForm,
} from "./plans";

export type { PlansManagerProps };

export function PlansManager({ initialPlans }: PlansManagerProps) {
  const t = useTranslations();
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
    const slug = (editingFree
      ? "free"
      : slugLocked
        ? form.slug
        : planSlugFromName(name)
    ).trim();
    if (!name || !slug) {
      toast.error(t("dashboard.admin.plansSlugRequired"));
      return;
    }

    startTransition(async () => {
      try {
        if (editingId) {
          const res = await updatePlan(
            editingId,
            editingSpecial
              ? { name, description: form.description || undefined }
              : {
                  slug,
                  name,
                  description: form.description || undefined,
                  priceMonthly: Number(form.priceMonthly) || 0,
                  maxActiveEvents: form.maxActiveEvents ? Number(form.maxActiveEvents) : null,
                  maxAttendeesPerEvent: form.maxAttendeesPerEvent
                    ? Number(form.maxAttendeesPerEvent)
                    : null,
                  commissionPercent: Number(form.commissionPercent) || 0,
                  commissionPerRegistration: Number(form.commissionPerRegistration) || 0,
                  maxBroadcastsPerMonth: form.maxBroadcastsPerMonth
                    ? Number(form.maxBroadcastsPerMonth)
                    : null,
                  maxAiMessagesPerMonth: form.maxAiMessagesPerMonth
                    ? Number(form.maxAiMessagesPerMonth)
                    : null,
                  maxOrganizers: form.maxOrganizers ? Number(form.maxOrganizers) : null,
                  featureCulqi: form.featureCulqi,
                  featureTransport: form.featureTransport,
                  featureAi: form.featureAi,
                  featureExports: form.featureExports,
                  featureCustomBranding: form.featureCustomBranding,
                },
          );
          if (res.plan) {
            setPlans((prev) => prev.map((p) => (p.id === editingId ? res.plan! : p)));
          }
          toast.success(t("dashboard.admin.plansUpdated"));
        } else {
          const res = await createPlan({
            slug,
            name,
            description: form.description || undefined,
            priceMonthly: Number(form.priceMonthly) || 0,
            maxActiveEvents: form.maxActiveEvents ? Number(form.maxActiveEvents) : null,
            maxAttendeesPerEvent: form.maxAttendeesPerEvent
              ? Number(form.maxAttendeesPerEvent)
              : null,
            commissionPercent: Number(form.commissionPercent) || 0,
            commissionPerRegistration: Number(form.commissionPerRegistration) || 0,
            maxBroadcastsPerMonth: form.maxBroadcastsPerMonth
              ? Number(form.maxBroadcastsPerMonth)
              : null,
            maxAiMessagesPerMonth: form.maxAiMessagesPerMonth
              ? Number(form.maxAiMessagesPerMonth)
              : null,
            maxOrganizers: form.maxOrganizers ? Number(form.maxOrganizers) : null,
            featureCulqi: form.featureCulqi,
            featureTransport: form.featureTransport,
            featureAi: form.featureAi,
            featureExports: form.featureExports,
            featureCustomBranding: form.featureCustomBranding,
          });
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
    setForm({
      slug: plan.slug,
      name: plan.name,
      description: plan.description ?? "",
      priceMonthly: String(plan.priceMonthly ?? 0),
      maxActiveEvents: plan.maxActiveEvents != null ? String(plan.maxActiveEvents) : "",
      maxAttendeesPerEvent: plan.maxAttendeesPerEvent != null ? String(plan.maxAttendeesPerEvent) : "",
      commissionPercent: String(plan.commissionPercent ?? 0),
      commissionPerRegistration: String(plan.commissionPerRegistration ?? 0),
      maxBroadcastsPerMonth: plan.maxBroadcastsPerMonth != null ? String(plan.maxBroadcastsPerMonth) : "",
      maxAiMessagesPerMonth: plan.maxAiMessagesPerMonth != null ? String(plan.maxAiMessagesPerMonth) : "",
      maxOrganizers: plan.maxOrganizers != null ? String(plan.maxOrganizers) : "",
      featureCulqi: plan.featureCulqi,
      featureTransport: plan.featureTransport,
      featureAi: plan.featureAi,
      featureExports: plan.featureExports,
      featureCustomBranding: plan.featureCustomBranding,
    });
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="inline-flex w-full rounded-xl border border-border bg-muted/40 p-1 sm:w-auto">
          <button
            type="button"
            onClick={() => setTab("list")}
            className={cn(
              "inline-flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition sm:flex-none",
              tab === "list"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <List className="h-4 w-4" />
            {t("dashboard.admin.plansTabList")}
          </button>
          <button
            type="button"
            onClick={() => {
              if (!editingId) resetForm();
              setTab("editor");
            }}
            className={cn(
              "inline-flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition sm:flex-none",
              tab === "editor"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <FilePenLine className="h-4 w-4" />
            {editingId ? t("dashboard.admin.plansTabEditorEdit") : t("dashboard.admin.plansTabEditor")}
          </button>
        </div>

        {tab === "list" && (
          <button
            type="button"
            onClick={openCreate}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" />
            {t("dashboard.admin.plansNewPlan")}
          </button>
        )}
      </div>

      {tab === "list" ? (
        <PlansList
          plans={plans}
          onOpenCreate={openCreate}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ) : (
        <PlanEditorForm
          editingId={editingId}
          editingSpecial={editingSpecial}
          slugLocked={slugLocked}
          liveSlug={liveSlug}
          form={form}
          isPending={isPending}
          onFormChange={setForm}
          onSubmit={onSubmit}
          onCancel={cancelEditor}
        />
      )}
    </div>
  );
}
