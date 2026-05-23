import { cn } from "@/lib/utils";
import Link from "next/link";

interface TablePaginationProps {
    basePath: string;
    currentPage: number;
    totalPages: number;
    totalItems: number;
    pageSize: number;
    query?: Record<string, string | undefined>;
}

function getPageWindow(currentPage: number, totalPages: number) {
    const pages = new Set<number>([1, totalPages, currentPage, currentPage - 1, currentPage + 1]);
    return Array.from(pages)
        .filter((page) => page >= 1 && page <= totalPages)
        .sort((a, b) => a - b);
}

export function TablePagination({
    basePath,
    currentPage,
    totalPages,
    totalItems,
    pageSize,
    query,
}: TablePaginationProps) {
    if (totalItems <= pageSize) return null;

    const pageWindow = getPageWindow(currentPage, totalPages);
    const start = (currentPage - 1) * pageSize + 1;
    const end = Math.min(currentPage * pageSize, totalItems);

    const buildHref = (page: number) => {
        const params = new URLSearchParams();

        if (query) {
            Object.entries(query).forEach(([key, value]) => {
                if (value !== undefined && value !== "") {
                    params.set(key, value);
                }
            });
        }

        params.set("page", String(page));
        return `${basePath}?${params.toString()}`;
    };

    return (
        <div className="flex flex-col gap-3 border-t border-border bg-card px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-muted-foreground">
                Mostrando <span className="font-medium text-foreground">{start}</span>-
                <span className="font-medium text-foreground">{end}</span> de{" "}
                <span className="font-medium text-foreground">{totalItems}</span>
            </p>

            <div className="flex items-center gap-1">
                <Link
                    href={buildHref(Math.max(1, currentPage - 1))}
                    aria-disabled={currentPage <= 1}
                    className={cn(
                        "rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors",
                        currentPage <= 1
                            ? "pointer-events-none border-border/60 text-muted-foreground/50"
                            : "border-border text-foreground hover:bg-secondary"
                    )}
                >
                    Anterior
                </Link>

                {pageWindow.map((page, index) => {
                    const previous = pageWindow[index - 1];
                    const showGap = previous !== undefined && page - previous > 1;

                    return (
                        <div key={page} className="flex items-center gap-1">
                            {showGap ? <span className="px-1 text-xs text-muted-foreground">…</span> : null}
                            <Link
                                href={buildHref(page)}
                                className={cn(
                                    "rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors",
                                    page === currentPage
                                        ? "border-primary bg-primary text-primary-foreground"
                                        : "border-border text-foreground hover:bg-secondary"
                                )}
                            >
                                {page}
                            </Link>
                        </div>
                    );
                })}

                <Link
                    href={buildHref(Math.min(totalPages, currentPage + 1))}
                    aria-disabled={currentPage >= totalPages}
                    className={cn(
                        "rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors",
                        currentPage >= totalPages
                            ? "pointer-events-none border-border/60 text-muted-foreground/50"
                            : "border-border text-foreground hover:bg-secondary"
                    )}
                >
                    Siguiente
                </Link>
            </div>
        </div>
    );
}
