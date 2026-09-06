"use client";

import { useState, useTransition } from "react";
import { Sparkles, Save, Loader2, Eye, Star } from "lucide-react";
import { toast } from "sonner";
import { useLocale } from "@/components/providers/LocaleProvider";
import { saveSystemSettingsAction } from "@/actions/admin/settings";
import { ImpactImageUploadField } from "@/components/dashboard/admin/ImpactImageUploadField";
import { useRouter } from "next/navigation";
import type { SystemSettings } from "@/lib/settings";

interface PlatformImpactTabProps {
    initialPlatformSettings: SystemSettings;
}

export function PlatformImpactTab({ initialPlatformSettings }: PlatformImpactTabProps) {
    const { locale } = useLocale();
    const router = useRouter();
    const [isSaving, startSaving] = useTransition();

    const [impactCard1Title, setImpactCard1Title] = useState(
        initialPlatformSettings.impactCard1Title ?? "5+ años impulsando"
    );
    const [impactCard1Subtitle, setImpactCard1Subtitle] = useState(
        initialPlatformSettings.impactCard1Subtitle ?? "Eventos de tecnología, negocios e innovación en Latinoamérica."
    );
    const [impactCard1ImageUrl, setImpactCard1ImageUrl] = useState(
        initialPlatformSettings.impactCard1ImageUrl ?? ""
    );

    const [impactCard2Title, setImpactCard2Title] = useState(
        initialPlatformSettings.impactCard2Title ?? "Más de 250 empresas"
    );
    const [impactCard2Subtitle, setImpactCard2Subtitle] = useState(
        initialPlatformSettings.impactCard2Subtitle ?? "Ya patrocinan y reclutan talento activamente en nuestros eventos."
    );
    const [impactCard2ImageUrl, setImpactCard2ImageUrl] = useState(
        initialPlatformSettings.impactCard2ImageUrl ?? ""
    );

    const [impactSatisfactionRate, setImpactSatisfactionRate] = useState(
        initialPlatformSettings.impactSatisfactionRate ?? "99.8%"
    );

    const handleSaveImpactMetrics = () => {
        if (!impactCard1Title.trim() || !impactCard2Title.trim()) {
            toast.error(
                locale === "en"
                    ? "Card titles cannot be empty"
                    : "Los títulos de las tarjetas no pueden estar vacíos"
            );
            return;
        }

        startSaving(async () => {
            try {
                const res = await saveSystemSettingsAction({
                    impactCard1Title: impactCard1Title.trim(),
                    impactCard1Subtitle: impactCard1Subtitle.trim(),
                    impactCard1ImageUrl: impactCard1ImageUrl.trim(),
                    impactCard2Title: impactCard2Title.trim(),
                    impactCard2Subtitle: impactCard2Subtitle.trim(),
                    impactCard2ImageUrl: impactCard2ImageUrl.trim(),
                    impactSatisfactionRate: impactSatisfactionRate.trim() || "99.8%",
                });
                if (res.success) {
                    toast.success(
                        locale === "en"
                            ? "Landing impact metrics saved successfully"
                            : "Métricas y tarjetas de portada guardadas con éxito"
                    );
                    router.refresh();
                } else {
                    toast.error(locale === "en" ? "Error saving metrics" : "Error al guardar métricas");
                }
            } catch (err: unknown) {
                const message = err instanceof Error ? err.message : "Error";
                toast.error(message);
            }
        });
    };

    return (
        <div className="space-y-6">
            {/* Encabezado y Explicación */}
            <div className="rounded-xl border border-border bg-card p-4 sm:p-6 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                        <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                            <Sparkles className="h-5 w-5 text-primary" />
                            {locale === "en" ? "Landing impact & metrics" : "Métricas y tarjetas de impacto en portada"}
                        </h2>
                        <p className="text-xs text-muted-foreground mt-0.5 max-w-2xl">
                            {locale === "en"
                                ? "Customize the headline cards, satisfaction score and see how the community metrics displayed on the public landing page operate."
                                : "Personaliza las dos tarjetas visuales principales, el porcentaje de satisfacción y consulta cómo se calculan las métricas comunitarias públicas de la portada."}
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={handleSaveImpactMetrics}
                        disabled={isSaving}
                        className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground shadow transition-colors hover:bg-primary/90 disabled:opacity-50 shrink-0"
                    >
                        {isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                        {locale === "en" ? "Save impact metrics" : "Guardar cambios"}
                    </button>
                </div>

                <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 sm:p-4 text-xs text-foreground space-y-2">
                    <div className="font-semibold text-primary flex items-center gap-1.5">
                        <Eye className="h-4 w-4" />
                        {locale === "en" ? "Real-time metrics vs Editorial metrics" : "Métricas en tiempo real vs Métricas editoriales"}
                    </div>
                    <div className="grid gap-2 sm:grid-cols-3 text-[11px] text-muted-foreground pt-1">
                        <div className="rounded-md border border-border/60 bg-background/60 p-2.5">
                            <span className="font-semibold text-foreground block mb-0.5">
                                {locale === "en" ? "Confirmed Attendees" : "Asistentes registrados"}
                            </span>
                            {locale === "en"
                                ? "Real-time DB query: counts only users with paid/active tickets (no pending holds)."
                                : "Consulta en tiempo real: cuenta únicamente inscritos con ticket generado pagado o activo (sin reservas temporales pendientes)."}
                        </div>
                        <div className="rounded-md border border-border/60 bg-background/60 p-2.5">
                            <span className="font-semibold text-foreground block mb-0.5">
                                {locale === "en" ? "Executed Events" : "Eventos ejecutados"}
                            </span>
                            {locale === "en"
                                ? "Real-time DB query: counts published and completed events across the platform."
                                : "Consulta en tiempo real: cuenta automáticamente eventos publicados y completados de la plataforma."}
                        </div>
                        <div className="rounded-md border border-border/60 bg-background/60 p-2.5">
                            <span className="font-semibold text-foreground block mb-0.5">
                                {locale === "en" ? "Active Organizations" : "Organizaciones activas"}
                            </span>
                            {locale === "en"
                                ? "Real-time DB query: counts verified active organizer entities."
                                : "Consulta en tiempo real: cuenta entidades organizadoras activas en el sistema."}
                        </div>
                    </div>
                </div>
            </div>

            {/* Tarjeta Visual 1 */}
            <div className="rounded-xl border border-border bg-card p-4 sm:p-6 space-y-4">
                <div>
                    <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">1</span>
                        {locale === "en" ? "Visual Card 1 (Left)" : "Tarjeta Visual 1 (Izquierda)"}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                        {locale === "en"
                            ? "Hero banner card displayed on the left side of the impact section."
                            : "Tarjeta destacada que se muestra en el lado izquierdo del bloque oscuro de impacto."}
                    </p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5 sm:col-span-2">
                        <label className="text-xs font-semibold text-foreground">
                            {locale === "en" ? "Card 1 Title" : "Título de la Tarjeta 1"}
                        </label>
                        <input
                            type="text"
                            value={impactCard1Title}
                            onChange={(e) => setImpactCard1Title(e.target.value)}
                            placeholder="5+ años impulsando"
                            className="w-full rounded-lg border border-border bg-background px-3.5 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
                        />
                    </div>

                    <div className="space-y-1.5 sm:col-span-2">
                        <label className="text-xs font-semibold text-foreground">
                            {locale === "en" ? "Card 1 Subtitle / Description" : "Subtítulo / Descripción de la Tarjeta 1"}
                        </label>
                        <input
                            type="text"
                            value={impactCard1Subtitle}
                            onChange={(e) => setImpactCard1Subtitle(e.target.value)}
                            placeholder="Eventos de tecnología, negocios e innovación en Latinoamérica."
                            className="w-full rounded-lg border border-border bg-background px-3.5 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
                        />
                    </div>

                    <div className="sm:col-span-2">
                        <ImpactImageUploadField
                            label={locale === "en" ? "Card 1 Background Image" : "Imagen de fondo de la Tarjeta 1"}
                            description={
                                locale === "en"
                                    ? "Select an image file from your device or drag & drop (JPG, PNG, WEBP up to 4MB)."
                                    : "Selecciona un archivo de imagen de tu equipo o arrástralo (JPG, PNG, WEBP hasta 4MB)."
                            }
                            value={impactCard1ImageUrl}
                            onChange={(url) => setImpactCard1ImageUrl(url)}
                            locale={locale === "en" ? "en" : "es"}
                        />
                    </div>
                </div>
            </div>

            {/* Tarjeta Visual 2 */}
            <div className="rounded-xl border border-border bg-card p-4 sm:p-6 space-y-4">
                <div>
                    <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">2</span>
                        {locale === "en" ? "Visual Card 2 (Right)" : "Tarjeta Visual 2 (Derecha)"}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                        {locale === "en"
                            ? "Hero banner card displayed on the right side of the impact section."
                            : "Tarjeta destacada que se muestra en el lado derecho del bloque oscuro de impacto."}
                    </p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5 sm:col-span-2">
                        <label className="text-xs font-semibold text-foreground">
                            {locale === "en" ? "Card 2 Title" : "Título de la Tarjeta 2"}
                        </label>
                        <input
                            type="text"
                            value={impactCard2Title}
                            onChange={(e) => setImpactCard2Title(e.target.value)}
                            placeholder="Más de 250 empresas"
                            className="w-full rounded-lg border border-border bg-background px-3.5 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
                        />
                    </div>

                    <div className="space-y-1.5 sm:col-span-2">
                        <label className="text-xs font-semibold text-foreground">
                            {locale === "en" ? "Card 2 Subtitle / Description" : "Subtítulo / Descripción de la Tarjeta 2"}
                        </label>
                        <input
                            type="text"
                            value={impactCard2Subtitle}
                            onChange={(e) => setImpactCard2Subtitle(e.target.value)}
                            placeholder="Ya patrocinan y reclutan talento activamente en nuestros eventos."
                            className="w-full rounded-lg border border-border bg-background px-3.5 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
                        />
                    </div>

                    <div className="sm:col-span-2">
                        <ImpactImageUploadField
                            label={locale === "en" ? "Card 2 Background Image" : "Imagen de fondo de la Tarjeta 2"}
                            description={
                                locale === "en"
                                    ? "Select an image file from your device or drag & drop (JPG, PNG, WEBP up to 4MB)."
                                    : "Selecciona un archivo de imagen de tu equipo o arrástralo (JPG, PNG, WEBP hasta 4MB)."
                            }
                            value={impactCard2ImageUrl}
                            onChange={(url) => setImpactCard2ImageUrl(url)}
                            locale={locale === "en" ? "en" : "es"}
                        />
                    </div>
                </div>
            </div>

            {/* Métrica de Satisfacción */}
            <div className="rounded-xl border border-border bg-card p-4 sm:p-6 space-y-4">
                <div>
                    <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                        <Star className="h-4 w-4 text-amber-500" />
                        {locale === "en" ? "Satisfaction Rate" : "Porcentaje de Satisfacción de Organizadores"}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                        {locale === "en"
                            ? "Displayed in the 4-stat counter bar below the impact visual cards."
                            : "Se muestra en la barra de 4 estadísticas debajo de las dos tarjetas visuales (ej. 99.8% o 99.9%)."}
                    </p>
                </div>

                <div className="max-w-xs space-y-1.5">
                    <label className="text-xs font-semibold text-foreground">
                        {locale === "en" ? "Satisfaction percentage" : "Tasa de satisfacción"}
                    </label>
                    <input
                        type="text"
                        value={impactSatisfactionRate}
                        onChange={(e) => setImpactSatisfactionRate(e.target.value)}
                        placeholder="99.8%"
                        className="w-full rounded-lg border border-border bg-background px-3.5 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
                    />
                </div>

                <div className="flex justify-end pt-2 border-t border-border/60">
                    <button
                        type="button"
                        onClick={handleSaveImpactMetrics}
                        disabled={isSaving}
                        className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground shadow transition-colors hover:bg-primary/90 disabled:opacity-50"
                    >
                        {isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                        {locale === "en" ? "Save impact metrics" : "Guardar métricas de portada"}
                    </button>
                </div>
            </div>
        </div>
    );
}
