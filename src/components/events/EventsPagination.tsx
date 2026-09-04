import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

type EventsPaginationProps = {
  page: number;
  total: number;
  limit: number;
  category?: string;
  search?: string;
  filters?: Record<string, string | undefined>;
};

function buildHref(
  page: number,
  category?: string,
  search?: string,
  filters?: Record<string, string | undefined>,
): string {
  const params = new URLSearchParams();

  if (filters) {
    Object.entries(filters).forEach(([k, v]) => {
      if (v && v !== "all" && k !== "page") {
        params.set(k, v);
      }
    });
  } else {
    if (category) params.set("category", category);
    if (search) params.set("search", search);
  }

  if (page > 1) params.set("page", String(page));
  const qs = params.toString();
  return qs ? `/events?${qs}` : "/events";
}

export function EventsPagination({
  page,
  total,
  limit,
  category,
  search,
  filters,
}: EventsPaginationProps) {
  const totalPages = Math.max(1, Math.ceil(total / limit));
  if (totalPages <= 1) return null;

  const prev = page > 1 ? page - 1 : null;
  const next = page < totalPages ? page + 1 : null;

  return (
    <nav
      className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-border/70 pt-6"
      aria-label="Paginación de eventos"
    >
      <p className="text-sm text-muted-foreground">
        Página {page} de {totalPages}
      </p>
      <div className="flex items-center gap-2">
        {prev ? (
          <Link
            href={buildHref(prev, category, search, filters)}
            className="inline-flex items-center gap-1 rounded-xl border border-border bg-card px-3 py-2 text-sm font-medium text-foreground hover:bg-muted"
          >
            <ChevronLeft className="h-4 w-4" />
            Anterior
          </Link>
        ) : (
          <span className="inline-flex items-center gap-1 rounded-xl border border-border/50 px-3 py-2 text-sm text-muted-foreground opacity-50">
            <ChevronLeft className="h-4 w-4" />
            Anterior
          </span>
        )}
        {next ? (
          <Link
            href={buildHref(next, category, search, filters)}
            className="inline-flex items-center gap-1 rounded-xl border border-border bg-card px-3 py-2 text-sm font-medium text-foreground hover:bg-muted"
          >
            Siguiente
            <ChevronRight className="h-4 w-4" />
          </Link>
        ) : (
          <span className="inline-flex items-center gap-1 rounded-xl border border-border/50 px-3 py-2 text-sm text-muted-foreground opacity-50">
            Siguiente
            <ChevronRight className="h-4 w-4" />
          </span>
        )}
      </div>
    </nav>
  );
}
