"use client";

import { useState } from "react";
import Link from "next/link";
import { Mail, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import { BRAND } from "@/lib/brand";
import { RichTextContent } from "@/components/ui/RichTextContent";

export type TermsTabItem = {
  id: string;
  num: string;
  title: string;
  html: string;
  contact?: boolean;
};

export function TermsTabs({
  tabs,
  isEn,
  emptyLabel,
  listLabelEs = "Índice del contrato",
  listLabelEn = "Contract index",
}: {
  tabs: TermsTabItem[];
  isEn: boolean;
  emptyLabel: string;
  listLabelEs?: string;
  listLabelEn?: string;
}) {
  const [activeId, setActiveId] = useState(tabs[0]?.id ?? "");
  const current = tabs.find((t) => t.id === activeId) ?? tabs[0];

  if (tabs.length === 0 || !current) {
    return (
      <p className="rounded-2xl border border-dashed border-primary/25 bg-card/70 p-6 text-center text-sm text-muted-foreground">
        {emptyLabel}
      </p>
    );
  }

  return (
    <div>
      <div
        role="tablist"
        aria-label={isEn ? listLabelEn : listLabelEs}
        className="flex gap-2 overflow-x-auto pb-2"
      >
        {tabs.map((tab) => {
          const selected = tab.id === current.id;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={selected}
              onClick={() => setActiveId(tab.id)}
              className={cn(
                "flex shrink-0 items-center gap-2 rounded-xl border px-3.5 py-2.5 text-left text-[13px] font-semibold transition-colors",
                selected
                  ? "border-primary bg-primary text-primary-foreground shadow-sm"
                  : "border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground",
              )}
            >
              <span
                className={cn(
                  "flex h-5 w-5 shrink-0 items-center justify-center rounded-md text-[10px] font-bold",
                  selected ? "bg-primary-foreground/20" : "bg-primary/10 text-primary",
                )}
              >
                {tab.num}
              </span>
              <span className="max-w-44 truncate sm:max-w-56">{tab.title}</span>
            </button>
          );
        })}
      </div>

      <div
        key={current.id}
        role="tabpanel"
        className="mt-4 rounded-2xl border border-primary/15 bg-white p-6 shadow-sm dark:border-border dark:bg-card sm:p-8"
      >
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary font-display text-sm font-bold text-primary-foreground">
            {current.num}
          </span>
          <h2 className="font-display text-lg font-bold text-foreground sm:text-xl">
            {current.title}
          </h2>
        </div>
        <div className="mt-4 text-sm leading-relaxed">
          <RichTextContent content={current.html} />
        </div>
        {current.contact ? (
          <div className="mt-6 flex flex-col gap-2.5 rounded-xl bg-primary/5 p-4 dark:bg-primary/10 sm:flex-row">
            <Link
              href="/contact"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground transition-colors hover:bg-primary/90"
            >
              <MessageSquare className="h-4 w-4" />
              {isEn ? "Contact page" : "Página de contacto"}
            </Link>
            <a
              href={`mailto:${BRAND.supportEmail}`}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-primary/25 bg-card px-4 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-primary/5"
            >
              <Mail className="h-4 w-4 text-primary" />
              {BRAND.supportEmail}
            </a>
          </div>
        ) : null}
      </div>
    </div>
  );
}
