"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ClipboardList, Layers } from "lucide-react";
import { useLocale } from "@/components/providers/LocaleProvider";
import { cn } from "@/lib/utils";

export function TaxonomyNavTabs() {
  const pathname = usePathname();
  const { locale } = useLocale();

  const isCategories = pathname.includes("/categories");
  const isEventTypes = pathname.includes("/event-types");

  // Determines prefix: /admin or /superadmin
  const isSuperAdminPrefix = pathname.startsWith("/superadmin");
  const categoriesHref = isSuperAdminPrefix ? "/superadmin/categories" : "/admin/categories";
  const eventTypesHref = isSuperAdminPrefix ? "/superadmin/event-types" : "/admin/event-types";

  return (
    <nav
      className="inline-flex flex-wrap gap-1 rounded-xl border border-border bg-muted/40 p-1 shadow-xs"
      aria-label="Taxonomía y Clasificación"
    >
      <Link
        href={categoriesHref}
        className={cn(
          "inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium transition-colors cursor-pointer",
          isCategories
            ? "bg-card text-foreground shadow-xs font-semibold"
            : "text-muted-foreground hover:bg-card/60 hover:text-foreground",
        )}
      >
        <ClipboardList className={cn("h-4 w-4 shrink-0", isCategories ? "text-primary" : "text-muted-foreground")} />
        <span>{locale === "en" ? "Categories" : "Categorías"}</span>
      </Link>

      <Link
        href={eventTypesHref}
        className={cn(
          "inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium transition-colors cursor-pointer",
          isEventTypes
            ? "bg-card text-foreground shadow-xs font-semibold"
            : "text-muted-foreground hover:bg-card/60 hover:text-foreground",
        )}
      >
        <Layers className={cn("h-4 w-4 shrink-0", isEventTypes ? "text-primary" : "text-muted-foreground")} />
        <span>{locale === "en" ? "Event Types" : "Tipos de evento"}</span>
      </Link>
    </nav>
  );
}
