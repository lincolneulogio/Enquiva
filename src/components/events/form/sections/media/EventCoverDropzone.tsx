"use client";

import React from "react";
import { ImageIcon } from "lucide-react";
import { UploadDropzone } from "@/lib/cloudinary/components";
import { EventCoverFrame } from "@/components/events/EventCoverFrame";
import { toast } from "sonner";

interface EventCoverDropzoneProps {
  coverImage: string | null;
  setCoverImage: (url: string | null) => void;
  coverDropzoneAppearance: any;
  t: (key: string) => string;
}

export function EventCoverDropzone({
  coverImage,
  setCoverImage,
  coverDropzoneAppearance,
  t,
}: EventCoverDropzoneProps) {
  return (
    <div className="rounded-2xl border border-border/80 bg-card p-5 sm:p-6 shadow-xs space-y-3.5 transition-all">
      <div className="flex items-center justify-between gap-2 border-b border-border/60 pb-3">
        <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
          {t("events.form.coverImage")}
        </label>
        <span className="rounded-full bg-muted border border-border/80 px-2.5 py-0.5 text-[11px] font-semibold text-muted-foreground">
          Horizontal JPG
        </span>
      </div>
      <p className="text-xs text-muted-foreground leading-relaxed">
        {t("events.form.coverImageHint")}
      </p>

      {coverImage ? (
        <div className="relative overflow-hidden rounded-xl border border-border/80 bg-background/50 shadow-2xs">
          <EventCoverFrame
            src={coverImage}
            alt="Cover"
            variant="preview"
            className="min-h-64 rounded-none"
          />
          <button
            type="button"
            onClick={() => setCoverImage(null)}
            className="absolute right-3 top-3 rounded-lg border border-border bg-background/90 px-2.5 py-1 text-xs font-semibold backdrop-blur shadow-sm transition hover:bg-destructive hover:text-destructive-foreground cursor-pointer"
          >
            {t("events.form.removeImage")}
          </button>
        </div>
      ) : (
        <UploadDropzone
          endpoint="eventCoverImage"
          config={{ mode: "auto" }}
          onClientUploadComplete={(res) => {
            if (res[0]) setCoverImage(res[0].url);
          }}
          onUploadError={(err) => {
            toast.error(err.message);
          }}
          content={{
            label: t("events.form.uploadDragDrop"),
            allowedContent: t("events.form.uploadAllowedContent"),
            button({ isUploading }) {
              if (isUploading) return t("common.loading");
              return t("events.form.uploadButton");
            },
          }}
          appearance={coverDropzoneAppearance}
        />
      )}
    </div>
  );
}
