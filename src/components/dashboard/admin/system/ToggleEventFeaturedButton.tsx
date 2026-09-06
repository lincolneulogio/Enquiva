"use client";

import { useState, useTransition } from "react";
import { Star, Loader2 } from "lucide-react";
import { toggleEventFeaturedAction } from "@/actions/admin/featured-events";
import { toast } from "sonner";
import { useLocale } from "@/components/providers/LocaleProvider";

export interface ToggleEventFeaturedButtonProps {
  eventId: string;
  isFeatured: boolean;
  canMutate?: boolean;
}

export function ToggleEventFeaturedButton({
  eventId,
  isFeatured: initialFeatured,
  canMutate = true,
}: ToggleEventFeaturedButtonProps) {
  const { t, locale } = useLocale();
  const [isFeatured, setIsFeatured] = useState(initialFeatured);
  const [isPending, startTransition] = useTransition();

  if (!canMutate) {
    return (
      <span
        title={
          isFeatured
            ? locale === "en"
              ? "Featured on homepage"
              : "Destacado en portada"
            : locale === "en"
              ? "Not featured"
              : "No destacado"
        }
        className={`inline-flex items-center justify-center p-1.5 rounded-lg border ${
          isFeatured
            ? "border-amber-500/30 bg-amber-500/10 text-amber-500"
            : "border-transparent text-muted-foreground/40"
        }`}
      >
        <Star className={`h-3.5 w-3.5 ${isFeatured ? "fill-amber-500" : ""}`} />
      </span>
    );
  }

  const handleToggle = () => {
    const nextState = !isFeatured;
    setIsFeatured(nextState);

    startTransition(async () => {
      try {
        const res = await toggleEventFeaturedAction(eventId, nextState);
        if (res.success) {
          toast.success(
            nextState
              ? t("dashboard.admin.featuredEventOn")
              : t("dashboard.admin.featuredEventOff")
          );
        } else {
          setIsFeatured(!nextState);
          toast.error(t("dashboard.admin.featuredEventError"));
        }
      } catch {
        setIsFeatured(!nextState);
        toast.error(t("dashboard.admin.serverCommunicationError"));
      }
    });
  };

  return (
    <button
      type="button"
      onClick={handleToggle}
      disabled={isPending}
      title={
        isFeatured
          ? t("dashboard.admin.featuredToggleTitleOn")
          : t("dashboard.admin.featuredToggleTitleOff")
      }
      className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-lg border text-xs font-medium transition-all ${
        isFeatured
          ? "border-amber-400/40 bg-amber-500/15 text-amber-600 dark:text-amber-400 hover:bg-amber-500/25"
          : "border-border/60 bg-muted/30 text-muted-foreground hover:border-amber-400/50 hover:text-amber-600 hover:bg-amber-500/10"
      } disabled:opacity-50`}
    >
      {isPending ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin text-amber-500" />
      ) : (
        <Star
          className={`h-3.5 w-3.5 ${
            isFeatured ? "fill-amber-500 text-amber-500" : "text-muted-foreground"
          }`}
        />
      )}
      <span className="hidden xl:inline">
        {isFeatured
          ? locale === "en"
            ? "Featured"
            : "Destacado"
          : locale === "en"
            ? "Feature"
            : "Destacar"}
      </span>
    </button>
  );
}
