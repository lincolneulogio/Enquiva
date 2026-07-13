"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Loader2, Plus } from "lucide-react";
import { createOrgCategoryQuick } from "@/actions/categories";
import { normalizeCategorySlug } from "@/lib/utils";
import { useTranslations } from "@/components/providers/LocaleProvider";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export type QuickCategoryOption = {
  slug: string;
  label: string;
  colorClass: string;
};

type CreateCategoryModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (category: QuickCategoryOption) => void;
};

export function CreateCategoryModal({ open, onOpenChange, onCreated }: CreateCategoryModalProps) {
  const t = useTranslations();
  const [isPending, startTransition] = useTransition();
  const [label, setLabel] = useState("");
  const [description, setDescription] = useState("");

  const liveSlug = normalizeCategorySlug(label);

  const reset = () => {
    setLabel("");
    setDescription("");
  };

  const handleOpenChange = (next: boolean) => {
    if (!next) reset();
    onOpenChange(next);
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!label.trim() || !liveSlug) {
      toast.error(t("events.form.createCategoryNameRequired"));
      return;
    }

    startTransition(async () => {
      try {
        const result = await createOrgCategoryQuick({
          label: label.trim(),
          description: description.trim() || undefined,
        });
        onCreated(result.category);
        toast.success(t("events.form.createCategorySuccess"));
        handleOpenChange(false);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : t("events.form.createCategoryError"));
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("events.form.createCategoryTitle")}</DialogTitle>
          <DialogDescription>{t("events.form.createCategoryDescription")}</DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="quick-category-label" className="text-sm font-medium text-foreground">
              {t("events.form.createCategoryName")}
            </label>
            <input
              id="quick-category-label"
              type="text"
              autoFocus
              autoComplete="off"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder={t("events.form.createCategoryNamePlaceholder")}
              className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              disabled={isPending}
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="quick-category-slug" className="text-sm font-medium text-foreground">
              {t("events.form.createCategorySlug")}
            </label>
            <input
              id="quick-category-slug"
              type="text"
              readOnly
              disabled
              tabIndex={-1}
              value={liveSlug}
              placeholder={t("events.form.createCategorySlugPlaceholder")}
              className="w-full rounded-xl border border-border bg-muted/40 px-3 py-2.5 font-mono text-sm text-muted-foreground"
            />
            <p className="text-xs text-muted-foreground">{t("events.form.createCategorySlugHint")}</p>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="quick-category-description" className="text-sm font-medium text-foreground">
              {t("events.form.createCategoryDescOptional")}
            </label>
            <input
              id="quick-category-description"
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t("events.form.createCategoryDescPlaceholder")}
              className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              disabled={isPending}
            />
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => handleOpenChange(false)}
              disabled={isPending}
              className="rounded-xl border border-border bg-background px-4 py-2 text-sm font-medium text-foreground transition hover:bg-muted/50 disabled:opacity-60"
            >
              {t("common.cancel")}
            </button>
            <button
              type="submit"
              disabled={isPending || !label.trim()}
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:bg-primary/90 disabled:opacity-60"
            >
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              {t("events.form.createCategorySubmit")}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
