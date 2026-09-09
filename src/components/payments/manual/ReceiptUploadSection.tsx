"use client";

import Image from "next/image";
import { toast } from "sonner";
import { UploadDropzone } from "@/lib/cloudinary/components";
import { useTranslations } from "@/components/providers/LocaleProvider";

interface ReceiptUploadSectionProps {
  receiptUrl: string | null;
  receiptFileName: string | null;
  onUploadBegin: () => void;
  onUploadSuccess: (url: string, name: string) => void;
  onUploadError: (message: string) => void;
  onRemove: () => void;
}

export function ReceiptUploadSection({
  receiptUrl,
  receiptFileName,
  onUploadBegin,
  onUploadSuccess,
  onUploadError,
  onRemove,
}: ReceiptUploadSectionProps) {
  const t = useTranslations();

  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-foreground">
        {t("payments.manual.receiptUpload")}
      </label>
      {receiptUrl ? (
        <div className="space-y-2">
          <div className="relative inline-block">
            <Image
              src={receiptUrl}
              alt="Comprobante"
              width={300}
              height={200}
              className="rounded-lg border object-cover"
            />
            <button
              type="button"
              onClick={onRemove}
              className="absolute right-2 top-2 rounded-lg bg-destructive px-2 py-1 text-xs font-medium text-destructive-foreground cursor-pointer"
            >
              Quitar
            </button>
          </div>
          {receiptFileName && <p className="text-xs text-muted-foreground">{receiptFileName}</p>}
        </div>
      ) : (
        <UploadDropzone
          endpoint="paymentReceipt"
          onUploadBegin={onUploadBegin}
          onClientUploadComplete={(res) => {
            if (res?.[0]) {
              onUploadSuccess(res[0].url, res[0].name);
            }
          }}
          onUploadError={(err) => {
            onUploadError(err.message);
            toast.error(err.message);
          }}
          content={{
            label: t("payments.manual.uploadDragDrop"),
            allowedContent: t("payments.manual.uploadAllowedContent") || "Imagen o PDF (hasta 2MB)",
            button({ isUploading }) {
              if (isUploading) return t("common.loading");
              return t("payments.manual.uploadButton");
            },
          }}
          appearance={{
            container:
              "rounded-xl border border-dashed border-border bg-background px-4 py-3 text-sm text-muted-foreground hover:border-primary hover:text-primary transition-colors",
            uploadIcon: "h-4 w-4",
            label: "text-sm font-medium text-foreground",
            allowedContent: "text-xs text-muted-foreground",
            button:
              "rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90",
          }}
        />
      )}
    </div>
  );
}
