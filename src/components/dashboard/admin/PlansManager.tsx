"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import {
  createPlan,
  updatePlan,
  deletePlan,
} from "@/actions/admin/plans";
import { Loader2, Plus, Trash2, Pencil, Crown, List, FilePenLine } from "lucide-react";
import { cn, slugify } from "@/lib/utils";
import type { Plan } from "@/lib/db/schema";
import { usePersistedState } from "@/hooks/useFormPersistence";
import { formStorageKey } from "@/lib/form-persistence";
import { confirmDeleteAction } from "@/lib/ui/confirm";
import { useTranslations } from "@/components/providers/LocaleProvider";
import { isRecommendedBillingPlan } from "@/lib/billing/plans";

type PlansTab = "list" | "editor";

interface PlansManagerProps {
  initialPlans: Plan[];
}

/**
 * Slug canónico desde el nombre: minúsculas, sin acentos, guiones.
 * Si el nombre queda vacío, el slug también.
 */
function planSlugFromName(name: string) {
  const normalized = name
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ñ/g, "n");
  return slugify(normalized);
}

const inputClass =
  "w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground transition focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-60";

const cardClass = "rounded-2xl border border-border bg-card p-6 shadow-sm";

const featureBadgeClass: Record<string, string> = {
  culqi: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  transport: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300",
  ai: "bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-300",
  exports: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
};

const emptyForm = {
  slug: "",
  name: "",
  description: "",
  priceMonthly: "0",
  maxActiveEvents: "",
  maxAttendeesPerEvent: "",
  commissionPercent: "5",
  commissionPerRegistration: "0.50",
  maxBroadcastsPerMonth: "",
  maxAiMessagesPerMonth: "",
  featureCulqi: false,
  featureTransport: false,
  featureAi: false,
  featureExports: false,
};

function FeatureToggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-2.5 rounded-lg border border-border/60 bg-muted/20 px-3 py-2 text-sm text-foreground transition hover:bg-muted/40 dark:bg-muted/10 dark:hover:bg-muted/20">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-4 w-4 rounded border-border text-primary focus:ring-primary focus:ring-offset-background"
      />
      {label}
    </label>
  );
}

export function PlansManager({ initialPlans }: PlansManagerProps) {
  const t = useTranslations();
  const [tab, setTab] = useState<PlansTab>("list");
  const [plans, setPlans] = useState(initialPlans);
  const [form, setForm, clearForm] = usePersistedState(formStorageKey("admin.plans.form"), emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // El slug siempre sigue al nombre (crear y editar; también limpia borradores desfasados).
  const liveSlug = useMemo(() => planSlugFromName(form.name), [form.name]);

  useEffect(() => {
    if (form.slug === liveSlug) return;
    setForm((prev) => ({ ...prev, slug: liveSlug }));
  }, [form.slug, liveSlug, setForm]);

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
    const slug = planSlugFromName(name).trim();
    if (!name || !slug) {
      toast.error(t("dashboard.admin.plansSlugRequired"));
      return;
    }

    const payload = {
      slug,
      name,
      description: form.description || undefined,
      priceMonthly: Number(form.priceMonthly) || 0,
      maxActiveEvents: form.maxActiveEvents ? Number(form.maxActiveEvents) : null,
      maxAttendeesPerEvent: form.maxAttendeesPerEvent ? Number(form.maxAttendeesPerEvent) : null,
      commissionPercent: Number(form.commissionPercent) || 0,
      commissionPerRegistration: Number(form.commissionPerRegistration) || 0,
      maxBroadcastsPerMonth: form.maxBroadcastsPerMonth ? Number(form.maxBroadcastsPerMonth) : null,
      maxAiMessagesPerMonth: form.maxAiMessagesPerMonth ? Number(form.maxAiMessagesPerMonth) : null,
      featureCulqi: form.featureCulqi,
      featureTransport: form.featureTransport,
      featureAi: form.featureAi,
      featureExports: form.featureExports,
    };

    startTransition(async () => {
      try {
        if (editingId) {
          const res = await updatePlan(editingId, payload);
          if (res.plan) {
            setPlans((prev) => prev.map((p) => (p.id === editingId ? res.plan! : p)));
          }
          toast.success(t("dashboard.admin.plansUpdated"));
        } else {
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
      featureCulqi: plan.featureCulqi,
      featureTransport: plan.featureTransport,
      featureAi: plan.featureAi,
      featureExports: plan.featureExports,
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
        <div className="space-y-6">
          <div className="space-y-3">
            {plans.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border bg-card/50 p-10 text-center">
                <Crown className="mx-auto h-8 w-8 text-muted-foreground/50" />
                <p className="mt-3 text-sm text-muted-foreground">{t("dashboard.admin.plansEmptyList")}</p>
                <button
                  type="button"
                  onClick={openCreate}
                  className="mt-4 inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition hover:bg-primary/90"
                >
                  <Plus className="h-4 w-4" />
                  {t("dashboard.admin.plansNewPlan")}
                </button>
              </div>
            ) : (
              plans.map((plan) => {
                const isRecommended = isRecommendedBillingPlan(plan, plans);
                return (
                <div
                  key={plan.id}
                  className={cn(
                    "rounded-2xl border bg-card p-5 shadow-sm transition hover:border-border/80",
                    isRecommended
                      ? "border-primary/40 ring-1 ring-primary/20"
                      : "border-border",
                  )}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-lg font-semibold text-foreground">{plan.name}</h3>
                        <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                          {plan.slug}
                        </span>
                        {isRecommended && (
                          <span className="rounded-full bg-primary/15 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-primary dark:bg-primary/25">
                            {t("dashboard.admin.plansRecommendedBadge")}
                          </span>
                        )}
                        {!plan.isActive && (
                          <span className="rounded-full bg-destructive/10 px-2 py-0.5 text-xs font-medium text-destructive">
                            {t("dashboard.admin.plansInactive")}
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">{plan.description}</p>
                      <p className="mt-2 text-sm font-medium text-foreground">
                        {Number(plan.commissionPercent) > 0 || Number(plan.commissionPerRegistration) > 0
                          ? t("dashboard.admin.plansPriceLineWithCommission", {
                              price: String(plan.priceMonthly),
                              commission: String(plan.commissionPercent),
                            })
                          : t("dashboard.admin.plansPriceLineNoCommission", {
                              price: String(plan.priceMonthly),
                            })}
                        {Number(plan.commissionPerRegistration) > 0 ? (
                          <span className="mt-0.5 block text-xs font-normal text-muted-foreground">
                            + S/ {Number(plan.commissionPerRegistration).toFixed(2)} por inscrito
                          </span>
                        ) : null}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {t("dashboard.admin.plansLimitsLine", {
                          events: plan.maxActiveEvents ?? "∞",
                          attendees: plan.maxAttendeesPerEvent ?? "∞",
                          broadcasts: plan.maxBroadcastsPerMonth ?? "∞",
                          ai: plan.maxAiMessagesPerMonth ?? "∞",
                        })}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-2 text-xs">
                        {plan.featureCulqi && (
                          <span className={cn("rounded-md px-2 py-0.5 font-medium", featureBadgeClass.culqi)}>
                            Culqi
                          </span>
                        )}
                        {plan.featureTransport && (
                          <span className={cn("rounded-md px-2 py-0.5 font-medium", featureBadgeClass.transport)}>
                            {t("dashboard.admin.plansFeatureTransport")}
                          </span>
                        )}
                        {plan.featureAi && (
                          <span className={cn("rounded-md px-2 py-0.5 font-medium", featureBadgeClass.ai)}>IA</span>
                        )}
                        {plan.featureExports && (
                          <span className={cn("rounded-md px-2 py-0.5 font-medium", featureBadgeClass.exports)}>
                            {t("dashboard.admin.plansFeatureExports")}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => onEdit(plan)}
                        className="rounded-lg border border-border bg-background p-2 text-foreground transition hover:bg-muted"
                        aria-label={t("dashboard.admin.plansEditAria")}
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDelete(plan.id)}
                        className="rounded-lg border border-border bg-background p-2 text-destructive transition hover:bg-destructive/10"
                        aria-label={t("dashboard.admin.plansDeleteAria")}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
                );
              })
            )}
          </div>
        </div>
      ) : (
        <div className={cardClass}>
          <h2 className="mb-4 flex items-center gap-2 border-b border-border/50 pb-3 text-lg font-semibold text-foreground">
            <Crown className="h-5 w-5 text-amber-500 dark:text-amber-400" />
            {editingId ? t("dashboard.admin.plansEditTitle") : t("dashboard.admin.plansCreateTitle")}
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1.5">
              <label htmlFor="plan-name" className="text-sm font-medium text-foreground">
                {t("dashboard.admin.plansLabelName")}
              </label>
              <input
                id="plan-name"
                type="text"
                autoComplete="off"
                className={inputClass}
                placeholder={t("dashboard.admin.plansPlaceholderName")}
                value={form.name}
                onChange={(e) => {
                  const name = e.target.value;
                  setForm((prev) => ({
                    ...prev,
                    name,
                    slug: planSlugFromName(name),
                  }));
                }}
                autoFocus={!editingId}
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="plan-slug" className="text-sm font-medium text-foreground">
                {t("dashboard.admin.plansLabelSlug")}
              </label>
              <input
                id="plan-slug"
                type="text"
                className={cn(inputClass, "bg-muted/40 font-mono text-muted-foreground")}
                placeholder={t("dashboard.admin.plansPlaceholderSlug")}
                value={liveSlug}
                readOnly
                disabled
                tabIndex={-1}
                aria-readonly="true"
              />
              <p className="text-xs text-muted-foreground">{t("dashboard.admin.plansHintSlug")}</p>
            </div>
            <div className="space-y-1.5 md:col-span-2">
              <label htmlFor="plan-description" className="text-sm font-medium text-foreground">
                {t("dashboard.admin.plansLabelDescription")}
              </label>
              <input
                id="plan-description"
                type="text"
                className={inputClass}
                placeholder={t("dashboard.admin.plansPlaceholderDescription")}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="plan-price" className="text-sm font-medium text-foreground">
                {t("dashboard.admin.plansLabelPrice")}
              </label>
              <input
                id="plan-price"
                type="number"
                min={0}
                step="0.01"
                className={inputClass}
                placeholder={t("dashboard.admin.plansPlaceholderPrice")}
                value={form.priceMonthly}
                onChange={(e) => setForm({ ...form, priceMonthly: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="plan-commission" className="text-sm font-medium text-foreground">
                {t("dashboard.admin.plansLabelCommission")}
              </label>
              <input
                id="plan-commission"
                type="number"
                min={0}
                step="0.01"
                className={inputClass}
                placeholder={t("dashboard.admin.plansPlaceholderCommission")}
                value={form.commissionPercent}
                onChange={(e) => setForm({ ...form, commissionPercent: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">{t("dashboard.admin.plansHintCommission")}</p>
            </div>
            <div className="space-y-1.5">
              <label htmlFor="plan-commission-fixed" className="text-sm font-medium text-foreground">
                Comisión fija por inscrito (S/)
              </label>
              <input
                id="plan-commission-fixed"
                type="number"
                min={0}
                step="0.01"
                className={inputClass}
                placeholder="0.50"
                value={form.commissionPerRegistration}
                onChange={(e) => setForm({ ...form, commissionPerRegistration: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">
                Evora gana este monto por cada inscrito (titular + invitados) al aprobar el pago, además del %.
              </p>
            </div>
            <div className="space-y-1.5">
              <label htmlFor="plan-max-events" className="text-sm font-medium text-foreground">
                {t("dashboard.admin.plansLabelMaxEvents")}
              </label>
              <input
                id="plan-max-events"
                type="number"
                min={0}
                className={inputClass}
                placeholder={t("dashboard.admin.plansPlaceholderMaxEvents")}
                value={form.maxActiveEvents}
                onChange={(e) => setForm({ ...form, maxActiveEvents: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">{t("dashboard.admin.plansHintUnlimited")}</p>
            </div>
            <div className="space-y-1.5">
              <label htmlFor="plan-max-attendees" className="text-sm font-medium text-foreground">
                {t("dashboard.admin.plansLabelMaxAttendees")}
              </label>
              <input
                id="plan-max-attendees"
                type="number"
                min={0}
                className={inputClass}
                placeholder={t("dashboard.admin.plansPlaceholderMaxAttendees")}
                value={form.maxAttendeesPerEvent}
                onChange={(e) => setForm({ ...form, maxAttendeesPerEvent: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">{t("dashboard.admin.plansHintUnlimited")}</p>
            </div>
            <div className="space-y-1.5">
              <label htmlFor="plan-max-broadcasts" className="text-sm font-medium text-foreground">
                {t("dashboard.admin.plansLabelMaxBroadcasts")}
              </label>
              <input
                id="plan-max-broadcasts"
                type="number"
                min={0}
                className={inputClass}
                placeholder={t("dashboard.admin.plansPlaceholderMaxBroadcasts")}
                value={form.maxBroadcastsPerMonth}
                onChange={(e) => setForm({ ...form, maxBroadcastsPerMonth: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">{t("dashboard.admin.plansHintUnlimited")}</p>
            </div>
            <div className="space-y-1.5">
              <label htmlFor="plan-max-ai" className="text-sm font-medium text-foreground">
                {t("dashboard.admin.plansLabelMaxAi")}
              </label>
              <input
                id="plan-max-ai"
                type="number"
                min={0}
                className={inputClass}
                placeholder={t("dashboard.admin.plansPlaceholderMaxAi")}
                value={form.maxAiMessagesPerMonth}
                onChange={(e) => setForm({ ...form, maxAiMessagesPerMonth: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">{t("dashboard.admin.plansHintUnlimited")}</p>
            </div>
          </div>
          <div className="mt-4 space-y-2">
            <p className="text-sm font-medium text-foreground">{t("dashboard.admin.plansLabelFeatures")}</p>
            <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-3">
              <FeatureToggle
                label={t("dashboard.admin.plansFeatureCulqi")}
                checked={form.featureCulqi}
                onChange={(v) => setForm({ ...form, featureCulqi: v })}
              />
              <FeatureToggle
                label={t("dashboard.admin.plansFeatureTransport")}
                checked={form.featureTransport}
                onChange={(v) => setForm({ ...form, featureTransport: v })}
              />
              <FeatureToggle
                label={t("dashboard.admin.plansFeatureAi")}
                checked={form.featureAi}
                onChange={(v) => setForm({ ...form, featureAi: v })}
              />
              <FeatureToggle
                label={t("dashboard.admin.plansFeatureExports")}
                checked={form.featureExports}
                onChange={(v) => setForm({ ...form, featureExports: v })}
              />
            </div>
          </div>
          <div className="mt-5 flex flex-wrap gap-2 border-t border-border/40 pt-4">
            <button
              type="button"
              onClick={onSubmit}
              disabled={isPending}
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition hover:bg-primary/90 disabled:opacity-50"
            >
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              {editingId ? t("dashboard.admin.plansSaveChanges") : t("dashboard.admin.plansCreateAction")}
            </button>
            <button
              type="button"
              onClick={cancelEditor}
              className="rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground transition hover:bg-muted"
            >
              {t("common.cancel")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
