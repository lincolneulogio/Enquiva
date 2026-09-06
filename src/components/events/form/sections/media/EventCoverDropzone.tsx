"use client";

import React from "react";
import { ImageIcon } from "lucide-react";
import { UploadDropzone } from "@/lib/uploadthing/components";
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
    <div>
      <label className="mb-1.5 block text-sm font-medium text-foreground">
        {t("events.form.coverImage")}
      </label>
      <p className="mb-2 text-xs text-muted-foreground">{t("events.form.coverImageHint")}</p>
      <div className="overflow-hidden rounded-xl border border-border bg-secondary">
        {coverImage ? (
          <div className="relative">
            <EventCoverFrame
              src={coverImage}
              alt="Cover"
              variant="preview"
              className="min-h-72 rounded-none"
            />
            <button
              type="button"
              onClick={() => setCoverImage(null)}
              className="absolute right-2 top-2 rounded-lg border border-border bg-background/85 px-2 py-1 text-xs font-medium backdrop-blur transition hover:bg-background"
            >
              {t("events.form.removeImage")}
            </button>
          </div>
        ) : (
          <div className="flex aspect-[16/10] min-h-72 flex-col items-center justify-center gap-2 px-4 text-center text-muted-foreground">
            <div className="rounded-full bg-primary/10 p-2.5">
              <ImageIcon className="h-5 w-5 text-primary animate-pulse" />
            </div>
            <p className="text-sm text-muted-foreground">{t("events.form.coverImage")}</p>
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
          </div>
        )}
      </div>
    </div>
  );
}
