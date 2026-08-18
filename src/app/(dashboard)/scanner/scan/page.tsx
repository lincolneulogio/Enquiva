import { QRScannerView } from "@/components/dashboard/scanner/QRScannerView";
import { getI18n } from "@/lib/i18n/server";

export async function generateMetadata() {
  const { t } = await getI18n();
  return {
    title: t("dashboard.organizer.scanPageTitleMeta"),
    description: t("dashboard.organizer.scanPageIntro"),
  };
}

export default async function ScannerScanPage() {
  const { t } = await getI18n();

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-300">
      <div>
        <h1 className="font-display text-2xl font-semibold text-foreground sm:text-3xl">
          {t("dashboard.sidebar.organizer.scan")}
        </h1>
        <p className="mt-1 text-muted-foreground">{t("dashboard.organizer.scanPageIntro")}</p>
        <p className="mt-2 text-sm text-amber-700 dark:text-amber-300">
          Staff scanner: solo check-in de asistentes.
        </p>
      </div>

      <div className="flex items-center justify-center py-6">
        <QRScannerView />
      </div>
    </div>
  );
}
