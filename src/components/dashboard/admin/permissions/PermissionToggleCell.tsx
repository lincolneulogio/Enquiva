"use client";

import { cn } from "@/lib/utils";

export interface PermissionToggleCellProps {
  allowed: boolean;
  canEdit: boolean;
  /** Differs from system default for that role. */
  isModified?: boolean;
  /** Differs from last saved baseline (pending save). */
  isUnsaved?: boolean;
  title?: string;
  onToggle: () => void;
}

export function PermissionToggleCell({
  allowed,
  canEdit,
  isModified = false,
  isUnsaved = false,
  title,
  onToggle,
}: PermissionToggleCellProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={allowed}
      disabled={!canEdit}
      title={title}
      onClick={onToggle}
      className={cn(
        "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-45",
        allowed
          ? "border-primary/30 bg-primary"
          : "border-border bg-muted",
        isUnsaved && "ring-2 ring-sky-400/80 ring-offset-1 ring-offset-background",
        !isUnsaved && isModified && "ring-2 ring-amber-400/70 ring-offset-1 ring-offset-background",
      )}
    >
      <span
        aria-hidden
        className={cn(
          "pointer-events-none absolute h-4 w-4 rounded-full bg-white shadow transition-transform",
          allowed ? "translate-x-[1.35rem]" : "translate-x-1",
        )}
      />
      {canEdit && (isUnsaved || isModified) && (
        <span
          aria-hidden
          className={cn(
            "absolute -right-1 -top-1 h-2 w-2 rounded-full shadow-sm",
            isUnsaved ? "bg-sky-500" : "bg-amber-500",
          )}
        />
      )}
    </button>
  );
}
