"use client";

import { ImpactImageUploadField } from "@/components/dashboard/admin/ImpactImageUploadField";

interface ImpactCardEditorProps {
  cardNumber: number;
  titleLabel: string;
  cardTitle: string;
  setCardTitle: (val: string) => void;
  titlePlaceholder: string;
  cardSubtitle: string;
  setCardSubtitle: (val: string) => void;
  subtitlePlaceholder: string;
  cardImageUrl: string;
  setCardImageUrl: (url: string) => void;
  imageLabel: string;
  imageDescription: string;
  headerTitle: string;
  headerSubtitle: string;
  subtitleLabel: string;
  locale: "es" | "en";
}

export function ImpactCardEditor({
  cardNumber,
  titleLabel,
  cardTitle,
  setCardTitle,
  titlePlaceholder,
  cardSubtitle,
  setCardSubtitle,
  subtitlePlaceholder,
  cardImageUrl,
  setCardImageUrl,
  imageLabel,
  imageDescription,
  headerTitle,
  headerSubtitle,
  subtitleLabel,
  locale,
}: ImpactCardEditorProps) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 sm:p-6 space-y-4">
      <div>
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
            {cardNumber}
          </span>
          {headerTitle}
        </h3>
        <p className="text-xs text-muted-foreground mt-0.5">{headerSubtitle}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5 sm:col-span-2">
          <label className="text-xs font-semibold text-foreground">{titleLabel}</label>
          <input
            type="text"
            value={cardTitle}
            onChange={(e) => setCardTitle(e.target.value)}
            placeholder={titlePlaceholder}
            className="w-full rounded-lg border border-border bg-background px-3.5 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
          />
        </div>

        <div className="space-y-1.5 sm:col-span-2">
          <label className="text-xs font-semibold text-foreground">{subtitleLabel}</label>
          <input
            type="text"
            value={cardSubtitle}
            onChange={(e) => setCardSubtitle(e.target.value)}
            placeholder={subtitlePlaceholder}
            className="w-full rounded-lg border border-border bg-background px-3.5 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
          />
        </div>

        <div className="sm:col-span-2">
          <ImpactImageUploadField
            label={imageLabel}
            description={imageDescription}
            value={cardImageUrl}
            onChange={setCardImageUrl}
            locale={locale}
          />
        </div>
      </div>
    </div>
  );
}
