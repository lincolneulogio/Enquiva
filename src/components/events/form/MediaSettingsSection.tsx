"use client";

import React from "react";
import { ImageIcon, Star, Bus, Lock, Award, Loader2 } from "lucide-react";
import { UploadDropzone } from "@/lib/uploadthing/components";
import { EventCoverFrame } from "@/components/events/EventCoverFrame";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { UseFormRegister, FieldErrors } from "react-hook-form";
import type { CreateEventInput } from "@/lib/validations";
import type { Event } from "@/lib/db/schema";

interface MediaSettingsSectionProps {
    coverImage: string | null;
    setCoverImage: (url: string | null) => void;
    coverDropzoneAppearance: any;
    register: UseFormRegister<CreateEventInput>;
    errors: FieldErrors<CreateEventInput>;
    canFeature?: boolean;
    canUseTransport: boolean;
    hasTransport?: boolean;
    hasCertificate?: boolean;
    isPending: boolean;
    event?: Event;
    canCreateEvent: boolean;
    getFieldHighlightClass: (field: keyof CreateEventInput) => string;
    getLocalizedValidationMessage: (message?: string) => string;
    locale: "es" | "en";
    t: (key: string) => string;
}

export function MediaSettingsSection({
    coverImage,
    setCoverImage,
    coverDropzoneAppearance,
    register,
    errors,
    canFeature,
    canUseTransport,
    hasTransport,
    hasCertificate,
    isPending,
    event,
    canCreateEvent,
    getFieldHighlightClass,
    getLocalizedValidationMessage,
    locale,
    t,
}: MediaSettingsSectionProps) {
    return (
        <div className="space-y-6">
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

            <div>
                <label htmlFor="event-status" className="mb-1.5 block text-sm font-medium text-foreground">
                    {t("events.form.status")}
                </label>
                <select
                    id="event-status"
                    {...register("status")}
                    aria-invalid={Boolean(errors.status)}
                    aria-describedby={errors.status ? "event-status-error" : undefined}
                    className={`w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm focus:border-primary focus:outline-none ${getFieldHighlightClass("status")}`}
                >
                    <option value="draft">{t("eventStatus.draft")}</option>
                    <option value="published">{t("eventStatus.published")}</option>
                    <option value="cancelled">{t("eventStatus.cancelled")}</option>
                </select>
                {errors.status && (
                    <p id="event-status-error" role="alert" className="mt-1 text-xs text-destructive">
                        {getLocalizedValidationMessage(errors.status.message)}
                    </p>
                )}
            </div>

            {canFeature && (
                <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-border p-4">
                    <input
                        type="checkbox"
                        {...register("isFeatured")}
                        className="mt-0.5 rounded border-border"
                    />
                    <div>
                        <div className="flex items-center gap-1.5">
                            <Star className="h-3.5 w-3.5 text-amber-500" />
                            <p className="text-sm font-medium text-foreground">
                                {t("events.form.featureEvent")}
                            </p>
                        </div>
                        <p className="text-xs text-muted-foreground">{t("events.form.featureEventHelp")}</p>
                    </div>
                </label>
            )}

            <label
                className={cn(
                    "flex items-start gap-3 rounded-xl border border-border p-4",
                    canUseTransport ? "cursor-pointer" : "cursor-not-allowed opacity-70",
                )}
            >
                <input
                    type="checkbox"
                    {...register("hasTransport")}
                    disabled={!canUseTransport}
                    className="mt-0.5 rounded border-border"
                />
                <div>
                    <div className="flex items-center gap-1.5">
                        <Bus className="h-3.5 w-3.5 text-primary" />
                        <p className="text-sm font-medium text-foreground">
                            {t("events.form.offerTransport")}
                        </p>
                        {!canUseTransport && <Lock className="h-3.5 w-3.5 text-muted-foreground" />}
                    </div>
                    <p className="text-xs text-muted-foreground">
                        {!canUseTransport
                            ? "Disponible en plan Pro. Mejora en /organizer/billing"
                            : hasTransport
                              ? t("events.form.transportEnabledHelp")
                              : t("events.form.transportDisabledHelp")}
                    </p>
                </div>
            </label>

            {/* Certificado Digital (Opcional) */}
            <div className="rounded-xl border border-border p-4 bg-muted/10 space-y-3">
                <label className="flex items-start gap-3 cursor-pointer">
                    <input
                        type="checkbox"
                        {...register("hasCertificate")}
                        className="mt-0.5 rounded border-border text-primary focus:ring-primary/20"
                    />
                    <div>
                        <div className="flex items-center gap-1.5">
                            <Award className="h-4 w-4 text-primary" />
                            <p className="text-sm font-medium text-foreground">
                                {locale === "en" ? "Include Digital Certificate" : "Incluir Certificado Digital"}
                            </p>
                            <span className="text-[11px] px-1.5 py-0.5 rounded bg-primary/10 text-primary font-medium">
                                {locale === "en" ? "Optional" : "Opcional"}
                            </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                            {locale === "en"
                                ? "Issues official downloadable certificate or attendance credential for attendees."
                                : "Emite constancia o certificado oficial de participación descargable para los asistentes."}
                        </p>
                    </div>
                </label>

                {hasCertificate && (
                    <div className="pt-2 pl-7 border-t border-border/60 space-y-3">
                        <div>
                            <label className="block text-xs font-medium text-foreground mb-1">
                                {locale === "en"
                                    ? "Certificate Title / Recognition (Optional)"
                                    : "Título de la Certificación o Reconocimiento (Opcional)"}
                            </label>
                            <input
                                type="text"
                                {...register("certificateTitle")}
                                placeholder={
                                    locale === "en"
                                        ? "e.g. Certificate of Attendance and Approval"
                                        : "ej. Certificado de Asistencia y Aprobación"
                                }
                                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                                maxLength={120}
                            />
                            <p className="text-[11px] text-muted-foreground mt-1">
                                {locale === "en"
                                    ? "Customize the title shown on the certificate and public event page. If left blank, 'Certificado Digital de Participación' will be used."
                                    : "Personaliza el título que se mostrará en el certificado y página pública del evento. Si lo dejas vacío, se usará 'Certificado Digital de Participación'."}
                            </p>
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-foreground mb-1">
                                {locale === "en"
                                    ? "Certificate Price (PEN) — Optional Add-on"
                                    : "Precio del Certificado (PEN) — Add-on Opcional"}
                            </label>
                            <div className="relative flex items-center max-w-[200px]">
                                <span className="absolute left-3 text-xs font-bold text-muted-foreground select-none">
                                    S/
                                </span>
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    {...register("certificatePrice", {
                                        setValueAs: (v) => (v === "" || v === null ? 0 : Number(v)),
                                    })}
                                    placeholder="0.00"
                                    className="w-full rounded-lg border border-border bg-background pl-8 pr-3 py-2 text-sm font-semibold text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                                />
                            </div>
                            <p className="text-[11px] text-muted-foreground mt-1">
                                {locale === "en"
                                    ? "If set to 0, certificate is included for free with registration. If greater than 0, attendee can choose to add it during checkout."
                                    : "Si lo dejas en 0, el certificado estará incluido gratis con la entrada. Si colocas un monto (ej. S/ 15), el asistente podrá elegir si desea agregarlo al registrarse."}
                            </p>
                        </div>
                    </div>
                )}
            </div>

            <button
                type="submit"
                disabled={isPending || (!event && !canCreateEvent)}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
                {isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                ) : event ? (
                    t("events.form.saveChanges")
                ) : (
                    t("events.form.createEvent")
                )}
            </button>
        </div>
    );
}
