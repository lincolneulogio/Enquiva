import { QRScannerView } from "@/components/dashboard";
import { getI18n } from "@/lib/i18n/server";

export const metadata = {
  title: "Escaneo de Tickets — Organizador",
  description: "Control de accesos y validación de entradas por QR en tiempo real.",
};

export default async function OrganizerScanPage() {
  const { t } = await getI18n();

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-300">
      {/* Encabezado */}
      <div>
        <h1 className="font-display text-2xl font-semibold text-foreground sm:text-3xl">
          {t("dashboard.sidebar.organizer.scan")}
        </h1>
        <p className="mt-1 text-muted-foreground">
          Valida firmas digitales y confirma asistencia instantáneamente escaneando códigos QR.
        </p>
      </div>

      {/* Componente del Visor del Escáner */}
      <div className="flex items-center justify-center py-6">
        <QRScannerView />
      </div>
    </div>
  );
}
