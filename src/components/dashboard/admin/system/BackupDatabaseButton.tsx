"use client";

import { exportFullDatabase } from "@/actions/admin";
import { useTransition } from "react";
import { toast } from "sonner";
import { Download } from "lucide-react";
import { useTranslations } from "@/components/providers/LocaleProvider";

export function BackupDatabaseButton() {
  const t = useTranslations();
  const [isPending, startTransition] = useTransition();

  const handleBackup = () => {
    startTransition(async () => {
      try {
        const backup = await exportFullDatabase();
        
        // Convert to string and create a Blob
        const jsonString = JSON.stringify(backup, null, 2);
        const blob = new Blob([jsonString], { type: "application/json" });
        
        // Generate download URL
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        
        // Format timestamp for filename
        const dateStr = new Date().toISOString().slice(0, 10);
        const timeStr = new Date().toTimeString().slice(0, 8).replace(/:/g, "-");
        link.setAttribute("download", `sistema_events_backup_${dateStr}_${timeStr}.json`);
        
        // Trigger download
        document.body.appendChild(link);
        link.click();
        
        // Cleanup
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        
        toast.success(t("dashboard.admin.backupDownloaded"));
      } catch (error) {
        toast.error(error instanceof Error ? error.message : t("dashboard.admin.backupExportError"));
      }
    });
  };

  return (
    <button
      onClick={handleBackup}
      disabled={isPending}
      className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
    >
      {isPending ? (
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
      ) : (
        <Download className="h-4 w-4" />
      )}
      {isPending ? t("dashboard.admin.backupGenerating") : t("dashboard.admin.backupDownloadButton")}
    </button>
  );
}
