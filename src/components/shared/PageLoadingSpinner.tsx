import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface PageLoadingSpinnerProps {
  className?: string;
  minHeight?: string;
  label?: string;
}

export function PageLoadingSpinner({
  className,
  minHeight = "min-h-[55vh]",
  label = "Cargando...",
}: PageLoadingSpinnerProps) {
  return (
    <div
      className={cn("flex w-full flex-col items-center justify-center gap-3 py-16", minHeight, className)}
      aria-busy="true"
      aria-label={label}
    >
      <div className="relative flex items-center justify-center">
        {/* Resplandor suave con el color de acento de la marca */}
        <div className="absolute h-12 w-12 rounded-full bg-primary/20 blur-md animate-pulse" />
        {/* Círculo giratorio */}
        <Loader2 className="relative h-9 w-9 animate-spin text-primary" />
      </div>
    </div>
  );
}
