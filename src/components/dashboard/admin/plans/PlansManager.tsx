"use client";

import { Plus, List, FilePenLine } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslations } from "@/components/providers/LocaleProvider";
import type { PlansManagerProps } from "./types";
import { PlansList } from "./PlansList";
import { PlanEditorForm } from "./PlanEditorForm";
import { usePlansManager } from "./usePlansManager";

export function PlansManager({ initialPlans }: PlansManagerProps) {
  const t = useTranslations();
  const {
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
  } = usePlansManager({ initialPlans, t });

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
