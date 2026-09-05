import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

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
  const calculatedPages = Math.max(1, Math.ceil(total / limit));
  // Si hay pocos eventos en DB, garantizamos al menos 3 páginas visuales como en la referencia
  const totalPages = Math.max(3, calculatedPages);

  const prev = page > 1 ? page - 1 : null;
  const next = page < totalPages ? page + 1 : null;

  return (
    <nav
      className="mt-10 flex flex-wrap items-center justify-between gap-3 border-t border-border/70 pt-6"
      aria-label="Paginación de eventos"
    >
      {/* Botón Anterior */}
      {prev ? (
        <Link
          href={buildHref(prev, category, search, filters)}
          className="inline-flex items-center gap-1 rounded-full border border-border/80 bg-card px-4 py-2 text-xs font-semibold text-foreground shadow-2xs transition hover:bg-muted"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
          <span>Anterior</span>
        </Link>
      ) : (
        <span className="inline-flex items-center gap-1 rounded-full border border-border/40 bg-muted/20 px-4 py-2 text-xs font-semibold text-muted-foreground opacity-50 cursor-not-allowed">
          <ChevronLeft className="h-3.5 w-3.5" />
          <span>Anterior</span>
        </span>
      )}

      {/* Números de página */}
      <div className="flex items-center gap-1.5">
        {Array.from({ length: Math.min(3, totalPages) }).map((_, idx) => {
          const pageNum = idx + 1;
          const isCurrent = page === pageNum;
          return (
            <Link
              key={pageNum}
              href={buildHref(pageNum, category, search, filters)}
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-all",
                isCurrent
                  ? "bg-[#FF5500] text-white shadow-xs"
                  : "border border-border/80 bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground"
              )}
            >
              {pageNum}
            </Link>
          );
        })}
      </div>

      {/* Botón Siguiente */}
      {next ? (
        <Link
          href={buildHref(next, category, search, filters)}
          className="inline-flex items-center gap-1 rounded-full border border-border/80 bg-card px-4 py-2 text-xs font-semibold text-foreground shadow-2xs transition hover:bg-muted"
        >
          <span>Siguiente</span>
          <ChevronRight className="h-3.5 w-3.5" />
        </Link>
      ) : (
        <span className="inline-flex items-center gap-1 rounded-full border border-border/40 bg-muted/20 px-4 py-2 text-xs font-semibold text-muted-foreground opacity-50 cursor-not-allowed">
          <span>Siguiente</span>
          <ChevronRight className="h-3.5 w-3.5" />
        </span>
      )}
    </nav>
  );
}
