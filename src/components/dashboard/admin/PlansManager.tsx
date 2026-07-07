"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import {
  createPlan,
  updatePlan,
  deletePlan,
  assignUserPlan,
} from "@/actions/admin/plans";
import { Loader2, Plus, Trash2, Pencil, Crown } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Plan } from "@/lib/db/schema";
import { usePersistedState } from "@/hooks/useFormPersistence";
import { formStorageKey } from "@/lib/form-persistence";

type OrganizerOption = { id: string; name: string; email: string };

interface PlansManagerProps {
  initialPlans: Plan[];
  organizers: OrganizerOption[];
}

const inputClass =
  "w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground transition focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-60";

const selectClass =
  "w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground transition focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary";

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
  commissionPercent: "0",
  maxBroadcastsPerMonth: "",
  maxAiMessagesPerMonth: "",
  featureCulqi: false,
  featureTransport: false,
  featureAi: false,
  featureExports: false,
  featureCustomBranding: false,
};

export function PlansManager({ initialPlans, organizers }: PlansManagerProps) {
  const [plans, setPlans] = useState(initialPlans);
  const [form, setForm, clearForm] = usePersistedState(formStorageKey("admin.plans.form"), emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [assignUserId, setAssignUserId] = usePersistedState(formStorageKey("admin.plans.assign-user"), "");
  const [assignPlanId, setAssignPlanId] = usePersistedState(formStorageKey("admin.plans.assign-plan"), "");
  const [isPending, startTransition] = useTransition();

  const resetForm = () => {
    clearForm();
    setEditingId(null);
  };

  const onSubmit = () => {
    if (!form.slug.trim() || !form.name.trim()) {
      toast.error("Slug y nombre son obligatorios");
      return;
    }

    const payload = {
      slug: form.slug,
      name: form.name,
      description: form.description || undefined,
      priceMonthly: Number(form.priceMonthly) || 0,
      maxActiveEvents: form.maxActiveEvents ? Number(form.maxActiveEvents) : null,
      maxAttendeesPerEvent: form.maxAttendeesPerEvent ? Number(form.maxAttendeesPerEvent) : null,
      commissionPercent: Number(form.commissionPercent) || 0,
      maxBroadcastsPerMonth: form.maxBroadcastsPerMonth ? Number(form.maxBroadcastsPerMonth) : null,
      maxAiMessagesPerMonth: form.maxAiMessagesPerMonth ? Number(form.maxAiMessagesPerMonth) : null,
      featureCulqi: form.featureCulqi,
      featureTransport: form.featureTransport,
      featureAi: form.featureAi,
      featureExports: form.featureExports,
      featureCustomBranding: form.featureCustomBranding,
    };

    startTransition(async () => {
      try {
        if (editingId) {
          await updatePlan(editingId, payload);
          toast.success("Plan actualizado");
        } else {
          const res = await createPlan(payload);
          if (res.plan) setPlans((prev) => [...prev, res.plan!]);
          toast.success("Plan creado");
        }
        resetForm();
        window.location.reload();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Error al guardar plan");
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
      maxBroadcastsPerMonth: plan.maxBroadcastsPerMonth != null ? String(plan.maxBroadcastsPerMonth) : "",
      maxAiMessagesPerMonth: plan.maxAiMessagesPerMonth != null ? String(plan.maxAiMessagesPerMonth) : "",
      featureCulqi: plan.featureCulqi,
      featureTransport: plan.featureTransport,
      featureAi: plan.featureAi,
      featureExports: plan.featureExports,
      featureCustomBranding: plan.featureCustomBranding,
    });
  };

  const onDelete = (id: string) => {
    if (!confirm("¿Eliminar este plan?")) return;
    startTransition(async () => {
      try {
        await deletePlan(id);
        setPlans((prev) => prev.filter((p) => p.id !== id));
        toast.success("Plan eliminado");
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "No se pudo eliminar");
      }
    });
  };

  const onAssign = () => {
    if (!assignUserId || !assignPlanId) {
      toast.error("Selecciona organizador y plan");
      return;
    }
    startTransition(async () => {
      try {
        await assignUserPlan(assignUserId, assignPlanId);
        toast.success("Plan asignado al organizador");
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Error al asignar");
      }
    });
  };

  const FeatureToggle = ({
    label,
    checked,
    onChange,
  }: {
    label: string;
    checked: boolean;
    onChange: (v: boolean) => void;
  }) => (
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

  return (
    <div className="space-y-8">
      <div className={cardClass}>
        <h2 className="mb-4 flex items-center gap-2 border-b border-border/50 pb-3 text-lg font-semibold text-foreground">
          <Crown className="h-5 w-5 text-amber-500 dark:text-amber-400" />
          {editingId ? "Editar plan" : "Crear plan"}
        </h2>
        <div className="grid gap-4 md:grid-cols-2">
          <input className={inputClass} placeholder="slug (ej: pro)" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} disabled={!!editingId} />
          <input className={inputClass} placeholder="Nombre" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <input className={cn(inputClass, "md:col-span-2")} placeholder="Descripción" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <input className={inputClass} placeholder="Precio mensual (PEN)" type="number" value={form.priceMonthly} onChange={(e) => setForm({ ...form, priceMonthly: e.target.value })} />
          <input className={inputClass} placeholder="Comisión %" type="number" value={form.commissionPercent} onChange={(e) => setForm({ ...form, commissionPercent: e.target.value })} />
          <input className={inputClass} placeholder="Máx. eventos activos" type="number" value={form.maxActiveEvents} onChange={(e) => setForm({ ...form, maxActiveEvents: e.target.value })} />
          <input className={inputClass} placeholder="Máx. asistentes/evento" type="number" value={form.maxAttendeesPerEvent} onChange={(e) => setForm({ ...form, maxAttendeesPerEvent: e.target.value })} />
          <input className={inputClass} placeholder="Máx. broadcasts/mes" type="number" value={form.maxBroadcastsPerMonth} onChange={(e) => setForm({ ...form, maxBroadcastsPerMonth: e.target.value })} />
          <input className={inputClass} placeholder="Máx. mensajes IA/mes (vacío = ∞)" type="number" value={form.maxAiMessagesPerMonth} onChange={(e) => setForm({ ...form, maxAiMessagesPerMonth: e.target.value })} />
        </div>
        <div className="mt-4 grid gap-2 sm:grid-cols-2 md:grid-cols-3">
          <FeatureToggle label="Culqi" checked={form.featureCulqi} onChange={(v) => setForm({ ...form, featureCulqi: v })} />
          <FeatureToggle label="Transporte" checked={form.featureTransport} onChange={(v) => setForm({ ...form, featureTransport: v })} />
          <FeatureToggle label="IA Copilot" checked={form.featureAi} onChange={(v) => setForm({ ...form, featureAi: v })} />
          <FeatureToggle label="Exportaciones" checked={form.featureExports} onChange={(v) => setForm({ ...form, featureExports: v })} />
          <FeatureToggle label="Branding" checked={form.featureCustomBranding} onChange={(v) => setForm({ ...form, featureCustomBranding: v })} />
        </div>
        <div className="mt-5 flex flex-wrap gap-2 border-t border-border/40 pt-4">
          <button
            type="button"
            onClick={onSubmit}
            disabled={isPending}
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition hover:bg-primary/90 disabled:opacity-50"
          >
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            {editingId ? "Guardar cambios" : "Crear plan"}
          </button>
          {editingId && (
            <button
              type="button"
              onClick={resetForm}
              className="rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground transition hover:bg-muted"
            >
              Cancelar
            </button>
          )}
        </div>
      </div>

      <div className={cardClass}>
        <h2 className="mb-4 border-b border-border/50 pb-3 text-lg font-semibold text-foreground">Asignar plan a organizador</h2>
        <div className="flex flex-col gap-3 sm:flex-row">
          <select className={selectClass} value={assignUserId} onChange={(e) => setAssignUserId(e.target.value)}>
            <option value="">Organizador...</option>
            {organizers.map((o) => (
              <option key={o.id} value={o.id}>{o.name} ({o.email})</option>
            ))}
          </select>
          <select className={selectClass} value={assignPlanId} onChange={(e) => setAssignPlanId(e.target.value)}>
            <option value="">Plan...</option>
            {plans.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
          <button
            type="button"
            onClick={onAssign}
            disabled={isPending}
            className="rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-emerald-700 disabled:opacity-50 dark:bg-emerald-700 dark:hover:bg-emerald-600"
          >
            Asignar
          </button>
        </div>
      </div>

      <div className="space-y-3">
        {plans.map((plan) => (
          <div key={plan.id} className="rounded-2xl border border-border bg-card p-5 shadow-sm transition hover:border-border/80">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-lg font-semibold text-foreground">{plan.name}</h3>
                  <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">{plan.slug}</span>
                  {!plan.isActive && (
                    <span className="rounded-full bg-destructive/10 px-2 py-0.5 text-xs font-medium text-destructive">Inactivo</span>
                  )}
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{plan.description}</p>
                <p className="mt-2 text-sm font-medium text-foreground">
                  S/ {plan.priceMonthly}/mes · Comisión {plan.commissionPercent}%
                </p>
                <p className="text-xs text-muted-foreground">
                  Eventos: {plan.maxActiveEvents ?? "∞"} · Asistentes: {plan.maxAttendeesPerEvent ?? "∞"} · Broadcasts: {plan.maxBroadcastsPerMonth ?? "∞"} · IA: {plan.maxAiMessagesPerMonth ?? "∞"}/mes
                </p>
                <div className="mt-2 flex flex-wrap gap-2 text-xs">
                  {plan.featureCulqi && <span className={cn("rounded-md px-2 py-0.5 font-medium", featureBadgeClass.culqi)}>Culqi</span>}
                  {plan.featureTransport && <span className={cn("rounded-md px-2 py-0.5 font-medium", featureBadgeClass.transport)}>Transporte</span>}
                  {plan.featureAi && <span className={cn("rounded-md px-2 py-0.5 font-medium", featureBadgeClass.ai)}>IA</span>}
                  {plan.featureExports && <span className={cn("rounded-md px-2 py-0.5 font-medium", featureBadgeClass.exports)}>Exports</span>}
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => onEdit(plan)}
                  className="rounded-lg border border-border bg-background p-2 text-foreground transition hover:bg-muted"
                  aria-label="Editar plan"
                >
                  <Pencil className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => onDelete(plan.id)}
                  className="rounded-lg border border-border bg-background p-2 text-destructive transition hover:bg-destructive/10"
                  aria-label="Eliminar plan"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
