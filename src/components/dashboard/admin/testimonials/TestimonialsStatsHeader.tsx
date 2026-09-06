import { MessageSquareQuote, Sparkles, Star } from "lucide-react";

interface TestimonialsStatsHeaderProps {
  totalCount: number;
  featuredCount: number;
  avgRating: string;
}

export function TestimonialsStatsHeader({
  totalCount,
  featuredCount,
  avgRating,
}: TestimonialsStatsHeaderProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Total Testimonios
          </span>
          <div className="p-2 rounded-xl bg-primary/10 text-primary">
            <MessageSquareQuote className="h-5 w-5" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="font-display text-3xl font-bold text-foreground">
            {totalCount}
          </span>
          <span className="text-xs text-muted-foreground">registrados</span>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Destacados en Portada
          </span>
          <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500">
            <Sparkles className="h-5 w-5" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="font-display text-3xl font-bold text-amber-500">
            {featuredCount}
          </span>
          <span className="text-xs text-muted-foreground">visibles en landing</span>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Calificación Promedio
          </span>
          <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500">
            <Star className="h-5 w-5 fill-amber-500" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="font-display text-3xl font-bold text-foreground">
            {avgRating}
          </span>
          <span className="text-xs text-muted-foreground">de 5.0 estrellas</span>
        </div>
      </div>
    </div>
  );
}
