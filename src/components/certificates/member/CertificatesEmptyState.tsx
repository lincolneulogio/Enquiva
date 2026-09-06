"use client";

import Link from "next/link";
import { Award, ArrowRight } from "lucide-react";

interface CertificatesEmptyStateProps {
  searchQuery: string;
  locale?: "es" | "en";
}

export function CertificatesEmptyState({
  searchQuery,
  locale = "es",
}: CertificatesEmptyStateProps) {
  return (
    <div className="rounded-2xl border border-dashed border-border p-12 text-center bg-card/50">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
        <Award className="h-8 w-8" />
      </div>
      <h3 className="mt-4 text-base font-semibold text-foreground">
        {searchQuery
          ? locale === "en"
            ? "No certificates match your search"
            : "No se encontraron certificados con ese filtro"
          : locale === "en"
            ? "You have no official certificates yet"
            : "Aún no tienes certificados solicitados"}
      </h3>
      <p className="mt-1 text-sm text-muted-foreground max-w-md mx-auto">
        {searchQuery
          ? locale === "en"
            ? "Try searching for a different keyword or reset your filters."
            : "Intenta con otro término de búsqueda o cambia la pestaña de filtro."
          : locale === "en"
            ? "When you register for events that include official certification, your accredited diplomas will appear here ready for validation and download."
            : "Cuando te inscribas a eventos con opción de certificación oficial, tus diplomas acreditados aparecerán aquí listos para su validación y descarga."}
      </p>
      {!searchQuery && (
        <div className="mt-6">
          <Link
            href="/member/events"
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-xs font-bold text-primary-foreground hover:bg-primary/90 transition shadow-xs"
          >
            <span>{locale === "en" ? "Explore Events" : "Ver Mis Eventos"}</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      )}
    </div>
  );
}
