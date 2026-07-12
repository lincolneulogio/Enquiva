import { QRScannerView } from "@/components/dashboard";
import { getI18n } from "@/lib/i18n/server";

export async function generateMetadata() {
  const { t } = await getI18n();
  return {
    title: t("dashboard.admin.scanPageTitleMeta"),
    description: t("dashboard.admin.scanPageIntro"),
  };
}

export default async function AdminScanPage() {
  const { t } = await getI18n();

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-300">
      <div>
        <h1 className="font-display text-2xl font-semibold text-foreground sm:text-3xl">
          {t("dashboard.sidebar.admin.scan")}
        </h1>
        <p className="mt-1 text-muted-foreground">{t("dashboard.admin.scanPageIntro")}</p>
      </div>

      <div className="flex items-center justify-center py-6">
        <QRScannerView />
      </div>
    </div>
  );
}
