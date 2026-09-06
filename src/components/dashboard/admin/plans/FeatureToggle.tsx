import { cn } from "@/lib/utils";

interface FeatureToggleProps {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}

export function FeatureToggle({
  label,
  checked,
  onChange,
  disabled = false,
}: FeatureToggleProps) {
  return (
    <label
      className={cn(
        "flex items-center gap-2.5 rounded-lg border border-border/60 bg-muted/20 px-3 py-2 text-sm text-foreground transition dark:bg-muted/10",
        disabled
          ? "cursor-not-allowed opacity-60"
          : "cursor-pointer hover:bg-muted/40 dark:hover:bg-muted/20",
      )}
    >
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
        className="h-4 w-4 rounded border-border text-primary focus:ring-primary focus:ring-offset-background"
      />
      {label}
    </label>
  );
}
