"use client";

import { UploadDropzone } from "@/lib/uploadthing/components";
import { toast } from "sonner";
import { Camera, ImageIcon } from "lucide-react";
import { useTranslations } from "@/components/providers/LocaleProvider";
import { optimizeAvatarFiles } from "./avatar-utils";

interface AvatarUploadCardProps {
  previewImage: string | null;
  onUploadSuccess: (url: string) => void;
  onRemove: () => void;
}

export function AvatarUploadCard({
  previewImage,
  onUploadSuccess,
  onRemove,
}: AvatarUploadCardProps) {
  const t = useTranslations();

  const uploadDropzoneAppearance = {
    container:
      "h-full w-full rounded-2xl border border-dashed border-primary/25 bg-gradient-to-br from-primary/5 via-muted/10 to-transparent p-4 transition-all duration-300 hover:border-primary/40 hover:from-primary/10 hover:shadow-sm hover:shadow-primary/5 cursor-pointer",
    uploadIcon:
      "h-7 w-7 text-primary/70 transition-transform duration-300 hover:scale-110",
    label: "text-xs font-semibold text-foreground tracking-wide mt-1.5",
    allowedContent: "text-[10px] text-muted-foreground/80 mt-0.5 font-medium",
    button:
      "mt-3 rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground shadow-md shadow-primary/15 transition-all duration-300 hover:bg-primary/95 hover:shadow-lg hover:shadow-primary/25 active:scale-95",
  };

  return (
    <div className="rounded-2xl border border-border/80 bg-background/60 backdrop-blur-sm p-6 shadow-sm hover:shadow-md transition-all duration-300">
      <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start sm:justify-start">
        {/* Glow and Image Ring */}
        <div className="shrink-0 group relative">
          <div className="absolute -inset-1.5 rounded-[2rem] bg-gradient-to-tr from-primary via-violet-500 to-accent opacity-20 blur-md group-hover:opacity-40 transition duration-500 pointer-events-none" />

          <div className="relative h-40 w-40 overflow-hidden rounded-3xl border border-primary/20 bg-card sm:h-44 sm:w-44 shadow-lg shadow-primary/5 transition-all duration-500 group-hover:border-primary/40 group-hover:shadow-primary/10 flex flex-col items-center justify-center p-4">
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:14px_24px] pointer-events-none" />
            <div className="absolute -top-10 -right-10 h-24 w-24 rounded-full bg-primary/8 blur-xl pointer-events-none" />
            <div className="absolute -bottom-10 -left-10 h-24 w-24 rounded-full bg-violet-500/8 blur-xl pointer-events-none" />

            {previewImage ? (
              <div className="relative h-full w-full overflow-hidden rounded-2xl group/image">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={previewImage}
                  alt={t("dashboard.profile.profilePhoto")}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover/image:scale-110"
                />
                <div className="absolute inset-0 bg-black/60 backdrop-blur-[3px] opacity-0 group-hover/image:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center gap-2 text-white">
                  <div className="rounded-full bg-white/20 p-2.5 border border-white/30 shadow-inner transform scale-90 group-hover/image:scale-100 transition-transform duration-300">
                    <Camera className="h-5 w-5 text-white" />
                  </div>
                  <span className="text-xs font-semibold tracking-wider uppercase text-[10px]">
                    {t("dashboard.profile.uploadButton")}
                  </span>
                </div>
              </div>
            ) : (
              <div className="relative flex h-full w-full flex-col items-center justify-center text-center">
                <div className="relative mb-3.5 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-tr from-primary/10 to-violet-500/10 border border-primary/20 shadow-md shadow-primary/5 transition-all duration-500 group-hover:scale-110 group-hover:rotate-6">
                  <div className="absolute inset-0.5 rounded-xl bg-background/80 backdrop-blur-sm flex items-center justify-center">
                    <ImageIcon className="h-7 w-7 text-primary animate-pulse" />
                  </div>
                  <span className="absolute -inset-2 rounded-2xl border border-dashed border-primary/25 animate-[spin_20s_linear_infinite]" />
                </div>

                <span className="text-[11px] font-bold text-foreground/90 tracking-wide leading-snug max-w-[130px] px-1">
                  {t("dashboard.profile.uploadProfilePhoto")}
                </span>
                <span className="mt-2 text-[9px] font-semibold text-muted-foreground/80 uppercase tracking-widest bg-muted/60 px-2 py-0.5 rounded-full border border-border/40">
                  {t("dashboard.profile.uploadAllowedContent")}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Dropzone Actions */}
        <div className="w-full max-w-[320px] self-stretch flex flex-col justify-between py-1 gap-4">
          <div className="w-full flex-1">
            <div className="h-full min-h-[140px]">
              <UploadDropzone
                endpoint="profileAvatar"
                onBeforeUploadBegin={optimizeAvatarFiles}
                onClientUploadComplete={(res) => {
                  if (res?.[0]?.url) {
                    onUploadSuccess(res[0].url);
                    toast.success(t("dashboard.profile.avatarUploaded"));
                  }
                }}
                onUploadError={(err) => {
                  toast.error(err.message);
                }}
                content={{
                  label: t("dashboard.profile.uploadDragDrop"),
                  allowedContent: t("dashboard.profile.uploadAllowedContent"),
                  button({ ready, isUploading }) {
                    if (isUploading) return t("common.loading");
                    return t("dashboard.profile.uploadButton");
                  },
                }}
                appearance={uploadDropzoneAppearance}
              />
            </div>
          </div>

          {previewImage ? (
            <button
              type="button"
              onClick={onRemove}
              className="w-full rounded-xl border border-destructive/20 bg-destructive/5 text-destructive px-3 py-2.5 text-xs font-semibold tracking-wider uppercase transition-all duration-200 hover:bg-destructive hover:text-white hover:border-destructive shadow-sm hover:shadow-md hover:shadow-destructive/10"
            >
              {t("dashboard.profile.removeAvatar")}
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
