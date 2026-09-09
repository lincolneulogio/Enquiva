import Image from "next/image";
import { Upload, X } from "lucide-react";
import { toast } from "sonner";
import { useTranslations } from "@/components/providers/LocaleProvider";
import { UploadButton } from "@/lib/cloudinary/components";

interface TestimonialAvatarFieldProps {
  avatarUrl: string;
  onAvatarChange: (url: string) => void;
}

export function TestimonialAvatarField({
  avatarUrl,
  onAvatarChange,
}: TestimonialAvatarFieldProps) {
  const t = useTranslations();

  return (
    <div>
      <label className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-1.5">
        Foto / Avatar
      </label>
      {avatarUrl ? (
        <div className="relative flex items-center gap-3 rounded-xl border border-border bg-muted/30 px-3 py-2">
          <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full border border-border">
            <Image
              src={avatarUrl}
              alt="Avatar preview"
              fill
              className="object-cover"
              unoptimized
            />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-foreground truncate">
              {t("dashboard.admin.testimonialImageLoaded")}
            </p>
            <p className="text-[11px] text-muted-foreground truncate">{avatarUrl.split("/").pop()}</p>
          </div>
          <button
            type="button"
            onClick={() => onAvatarChange("")}
            className="shrink-0 rounded-lg p-1 text-muted-foreground hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-950/30 transition-colors"
            title={t("dashboard.admin.testimonialRemoveImage")}
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <div className="rounded-xl border-2 border-dashed border-border bg-muted/20 overflow-hidden">
          <UploadButton
            endpoint="testimonialAvatar"
            onClientUploadComplete={(res) => {
              const url = res?.[0]?.url;
              if (url) {
                onAvatarChange(url);
                toast.success(t("dashboard.admin.testimonialImageUploaded"));
              }
            }}
            onUploadError={(err) => {
              toast.error(`${t("dashboard.admin.testimonialImageUploadError")}: ${err.message}`);
            }}
            appearance={{
              button:
                "w-full bg-primary text-primary-foreground text-xs font-medium py-2 px-4 rounded-lg hover:bg-primary/90 transition-colors ut-uploading:cursor-not-allowed ut-uploading:opacity-60 focus-within:ring-2 focus-within:ring-primary",
              allowedContent: "text-[10px] text-muted-foreground mt-0.5",
              container: "flex flex-col items-center gap-2 py-3 px-2",
            }}
            content={{
              button: (
                <span className="inline-flex items-center gap-1.5">
                  <Upload className="h-3.5 w-3.5" />
                  {t("dashboard.admin.testimonialUploadPhoto")}
                </span>
              ),
              allowedContent: t("dashboard.admin.testimonialUploadLimit"),
            }}
          />
        </div>
      )}
    </div>
  );
}
