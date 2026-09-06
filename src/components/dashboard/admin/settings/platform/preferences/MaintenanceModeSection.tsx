"use client";

import { Wrench, Clock, Loader2, Save } from "lucide-react";

interface MaintenanceModeSectionProps {
    locale: "es" | "en";
    maintenanceMode: boolean;
    setMaintenanceMode: (val: boolean) => void;
    maintenanceMessage: string;
    setMaintenanceMessage: (val: string) => void;
    maintenanceStartsLocal: string;
    setMaintenanceStartsLocal: (val: string) => void;
    maintenanceEndsLocal: string;
    setMaintenanceEndsLocal: (val: string) => void;
    isSaving: boolean;
    handleSavePlatformOps: () => void;
}

export function MaintenanceModeSection({
    locale,
    maintenanceMode,
    setMaintenanceMode,
    maintenanceMessage,
    setMaintenanceMessage,
    maintenanceStartsLocal,
    setMaintenanceStartsLocal,
    maintenanceEndsLocal,
    setMaintenanceEndsLocal,
    isSaving,
    handleSavePlatformOps,
}: MaintenanceModeSectionProps) {
    return (
        <div className="rounded-xl border border-border bg-card p-4 sm:p-6 space-y-5 w-full min-w-0">
            <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-amber-700 dark:text-amber-300">
                    <Wrench className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                    <h2 className="text-lg font-semibold text-foreground">
                        {locale === "en" ? "Maintenance mode" : "Modo mantenimiento"}
                    </h2>
                    <p className="text-xs text-muted-foreground mt-0.5">
                        {locale === "en"
                            ? "Manual switch or scheduled window. Super admins keep access; tickets and login stay available."
                            : "Activación manual o ventana programada. Los superadmins conservan acceso; tickets e inicio de sesión siguen disponibles."}
                    </p>
                </div>
                <button
                    type="button"
                    onClick={() => setMaintenanceMode(!maintenanceMode)}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
                        maintenanceMode ? "bg-amber-600" : "bg-muted-foreground/30"
                    }`}
                    aria-pressed={maintenanceMode}
                    aria-label={locale === "en" ? "Toggle maintenance mode" : "Activar modo mantenimiento"}
                >
                    <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow transition ${
                            maintenanceMode ? "translate-x-5" : "translate-x-0"
                        }`}
                    />
                </button>
            </div>

            {maintenanceMode && (
                <div className="rounded-lg border border-amber-500/25 bg-amber-500/5 px-3 py-2 text-xs text-amber-900 dark:text-amber-100">
                    {locale === "en"
                        ? "Manual maintenance is ON — users are redirected to /maintenance until you turn this off."
                        : "Mantenimiento manual ACTIVO — los usuarios van a /maintenance hasta que lo desactives."}
                </div>
            )}

            <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">
                    {locale === "en" ? "Message shown to users" : "Mensaje mostrado a los usuarios"}
                </label>
                <textarea
                    value={maintenanceMessage}
                    onChange={(e) => setMaintenanceMessage(e.target.value)}
                    rows={3}
                    maxLength={500}
                    placeholder={
                        locale === "en"
                            ? "We are upgrading the platform. Back shortly…"
                            : "Estamos mejorando la plataforma. Volvemos en breve…"
                    }
                    className="w-full rounded-lg border border-border bg-background px-3.5 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary text-foreground resize-y min-h-[80px]"
                />
                <p className="text-[11px] text-muted-foreground text-right">
                    {maintenanceMessage.length}/500
                </p>
            </div>

            <div className="rounded-xl border border-dashed border-amber-500/30 bg-amber-500/[0.04] p-4 space-y-3 w-full min-w-0">
                <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-amber-700 dark:text-amber-300" />
                    <p className="text-xs font-semibold text-foreground">
                        {locale === "en" ? "Scheduled window (optional)" : "Ventana programada (opcional)"}
                    </p>
                </div>
                <p className="text-[11px] text-muted-foreground">
                    {locale === "en"
                        ? "Auto-activates maintenance between these times (platform timezone), even if the manual switch is off. Clear both to disable schedule."
                        : "Activa el mantenimiento solo entre estas horas (zona de plataforma), aunque el interruptor manual esté apagado. Vacía ambos para quitar la programación."}
                </p>
                <div className="grid gap-3 sm:grid-cols-2 w-full min-w-0">
                    <div className="space-y-1 min-w-0">
                        <label className="text-[11px] font-semibold text-foreground">
                            {locale === "en" ? "Starts" : "Inicio"}
                        </label>
                        <input
                            type="datetime-local"
                            value={maintenanceStartsLocal}
                            onChange={(e) => setMaintenanceStartsLocal(e.target.value)}
                            className="w-full min-w-0 max-w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
                        />
                    </div>
                    <div className="space-y-1 min-w-0">
                        <label className="text-[11px] font-semibold text-foreground">
                            {locale === "en" ? "Ends" : "Fin"}
                        </label>
                        <input
                            type="datetime-local"
                            value={maintenanceEndsLocal}
                            onChange={(e) => setMaintenanceEndsLocal(e.target.value)}
                            className="w-full min-w-0 max-w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
                        />
                    </div>
                </div>
                {(maintenanceStartsLocal || maintenanceEndsLocal) && (
                    <button
                        type="button"
                        onClick={() => {
                            setMaintenanceStartsLocal("");
                            setMaintenanceEndsLocal("");
                        }}
                        className="text-[11px] font-semibold text-amber-800 dark:text-amber-200 underline-offset-2 hover:underline"
                    >
                        {locale === "en" ? "Clear schedule" : "Limpiar programación"}
                    </button>
                )}
            </div>

            <div className="pt-1 flex justify-end">
                <button
                    type="button"
                    onClick={handleSavePlatformOps}
                    disabled={isSaving}
                    className="w-full sm:w-auto justify-center flex items-center gap-2 rounded-lg bg-primary hover:bg-primary/95 text-primary-foreground font-semibold px-4 py-2 text-xs transition duration-200 disabled:opacity-50"
                >
                    {isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                    {locale === "en" ? "Save maintenance settings" : "Guardar mantenimiento"}
                </button>
            </div>
        </div>
    );
}
