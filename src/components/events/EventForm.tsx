"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { createEventSchema, type CreateEventInput } from "@/lib/validations";
import { createEvent, updateEvent } from "@/actions/events";
import { getPaymentMethodsForEventForm, setEventPaymentMethods } from "@/actions/payment-methods";
import { UploadDropzone } from "@/lib/uploadthing/components";
import { toast } from "sonner";
import { Loader2, ImageIcon, MapPin, Video, Star, Bus, Smartphone, QrCode, Wallet } from "lucide-react";
import { EventCoverImage } from "@/components/events/EventCoverImage";
import type { Event } from "@/lib/db/schema";
import type { FieldErrors } from "react-hook-form";
import { useLocale, useTranslations } from "@/components/providers/LocaleProvider";
import { categoryLabel, cn } from "@/lib/utils";
import { getRoutesByEvent } from "@/actions/transport";
import { TransportRoutesManager } from "@/components/dashboard/organizer/TransportRoutesManager";
import { PlanUsageBanner } from "@/components/dashboard/organizer/PlanUsageBanner";
import type { getOrganizerPlanSummary } from "@/lib/billing/enforce";
import Link from "next/link";
import { Lock } from "lucide-react";

type PlanSummary = Awaited<ReturnType<typeof getOrganizerPlanSummary>>;

interface CategoryOption {
    slug: string;
    label: string;
    colorClass: string;
}

interface EventFormProps {
    event?: Event;
    redirectPath?: string;
    categories: CategoryOption[];
    canFeature?: boolean;
    planSummary?: PlanSummary;
}

const EVENT_DRAFT_STORAGE_KEY = "Eventia.eventDraft.create";

const VALIDATION_MESSAGE_KEY_BY_TEXT: Record<string, string> = {
    "Title must be at least 3 characters": "events.form.validation.titleMin",
    "Description must be at least 20 characters": "events.form.validation.descriptionMin",
    "Category is required": "events.form.validation.categoryRequired",
    "Date is required": "events.form.validation.dateRequired",
    "Invalid date format": "events.form.validation.dateInvalid",
    "Event date cannot be in the past": "events.form.validation.datePast",
    "Meeting link is required for virtual events": "events.form.validation.virtualLinkRequired",
    "Venue address is required for in-person events": "events.form.validation.locationRequired",
    "Invalid url": "events.form.validation.invalidUrl",
    "Expected number, received nan": "events.form.validation.capacityInvalid",
    "Expected number, received string": "events.form.validation.capacityInvalid",
    "Number must be greater than 0": "events.form.validation.capacityInvalid",
    "Required": "events.form.validation.required",
};

const FIRST_ERROR_FIELD_ORDER: Array<keyof CreateEventInput> = [
    "title",
    "description",
    "category",
    "date",
    "virtualLink",
    "location",
    "capacity",
    "status",
];

export function EventForm({
    event,
    redirectPath = "/organizer",
    categories,
    canFeature = false,
    planSummary,
}: EventFormProps) {
    const t = useTranslations();
    const { locale } = useLocale();
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [coverImage, setCoverImage] = useState<string | null>(event?.coverImage ?? null);
    const [allPaymentMethods, setAllPaymentMethods] = useState<Array<{ id: string; type: string; label: string; holderName: string }>>([]);
    const [selectedPaymentMethodIds, setSelectedPaymentMethodIds] = useState<string[]>([]);
    const [highlightedField, setHighlightedField] = useState<keyof CreateEventInput | null>(null);
    const highlightTimeoutRef = useRef<number | null>(null);
    const [routes, setRoutes] = useState<any[]>([]);
    const [loadingRoutes, setLoadingRoutes] = useState(false);

    const getLocalizedValidationMessage = (message?: string) => {
        if (!message) return t("events.form.requiredFieldsError");
        const key = VALIDATION_MESSAGE_KEY_BY_TEXT[message];
        return key ? t(key) : message;
    };

    const getFieldHighlightClass = (field: keyof CreateEventInput) =>
        highlightedField === field
            ? "border-destructive ring-2 ring-destructive/40 animate-pulse"
            : "";

    const {
        register,
        handleSubmit,
        watch,
        setValue,
        setFocus,
        reset,
        formState: { errors },
    } = useForm<CreateEventInput>({
        resolver: zodResolver(createEventSchema),
        defaultValues: event
            ? {
                title: event.title,
                description: event.description,
                category: event.category,
                date: new Date(event.date).toISOString().slice(0, 16),
                location: event.location ?? undefined,
                isVirtual: event.isVirtual,
                virtualLink: event.virtualLink ?? undefined,
                capacity: event.capacity ?? undefined,
                price: event.price ? Number(event.price) : undefined,
                status: event.status,
                isFeatured: event.isFeatured,
                hasTransport: event.hasTransport,
            }
            : { status: "draft", isVirtual: false, isFeatured: false, hasTransport: false, price: undefined },
    });

    const isVirtual = watch("isVirtual");
    const hasTransport = watch("hasTransport");
    const canUseTransport = planSummary?.isUnlimited || planSummary?.features.transport || event?.hasTransport;
    const canUseCulqi = planSummary?.isUnlimited || planSummary?.features.culqi;
    const canCreateEvent = planSummary?.isUnlimited || planSummary?.canCreateEvent !== false;
    const selectablePaymentMethods = allPaymentMethods.filter(
        (pm) => pm.type !== "culqi" || canUseCulqi,
    );

    useEffect(() => {
        (async () => {
            const methods = await getPaymentMethodsForEventForm(event?.organizerId);
            setAllPaymentMethods(methods);
        })();
    }, [event?.organizerId]);

    useEffect(() => {
        if (!event?.id || !hasTransport) return;

        let active = true;
        (async () => {
            setLoadingRoutes(true);
            try {
                const fetched = await getRoutesByEvent(event.id);
                if (active) {
                    setRoutes(fetched.map((r) => ({
                        ...r,
                        departureTime: new Date(r.departureTime),
                        returnTime: r.returnTime ? new Date(r.returnTime) : null,
                        bookedSeats: Number(r.bookedSeats),
                    })));
                }
            } catch (err) {
                console.error("Failed to load routes", err);
            } finally {
                if (active) setLoadingRoutes(false);
            }
        })();

        return () => {
            active = false;
        };
    }, [event?.id, hasTransport]);

    useEffect(() => {
        if (!event?.id) return;
        (async () => {
            const { getEventPaymentMethods } = await import("@/actions/payment-methods");
            const selected = await getEventPaymentMethods(event.id!);
            setSelectedPaymentMethodIds(selected.map((m) => m.id));
        })();
    }, [event?.id]);

    useEffect(() => {
        if (event) return;

        reset({
            status: "draft",
            isVirtual: false,
            isFeatured: false,
            hasTransport: false,
        });
        setCoverImage(null);
    }, [event, reset]);

    useEffect(() => {
        return () => {
            if (highlightTimeoutRef.current) {
                window.clearTimeout(highlightTimeoutRef.current);
            }
        };
    }, []);

    useEffect(() => {
        if (!highlightedField) return;
        if (errors[highlightedField]) return;

        setHighlightedField(null);
        if (highlightTimeoutRef.current) {
            window.clearTimeout(highlightTimeoutRef.current);
            highlightTimeoutRef.current = null;
        }
    }, [highlightedField, errors]);

    const onSubmit = (data: CreateEventInput) => {
        startTransition(async () => {
            try {
                const payload = {
                    ...data,
                    coverImage,
                    capacity: data.isVirtual ? null : data.capacity,
                    location: data.isVirtual ? null : data.location,
                    virtualLink: data.isVirtual ? data.virtualLink : null,
                    isFeatured: canFeature ? data.isFeatured : false,
                    status: data.status ?? "draft",
                    hasTransport: data.hasTransport ?? false,
                };

                const result = event
                    ? await updateEvent(event.id, payload)
                    : await createEvent(payload);

                if (result.success) {
                    const savedEventId = event?.id ?? result.event?.id;
                    if (savedEventId) {
                        await setEventPaymentMethods(savedEventId, selectedPaymentMethodIds);
                    }


                    toast.success(event ? t("events.form.eventUpdated") : t("events.form.eventCreated"));
                    router.push(redirectPath);
                }
            } catch (err) {
                toast.error(
                    err instanceof Error
                        ? getLocalizedValidationMessage(err.message)
                        : t("events.form.genericError")
                );
            }
        });
    };

    const onInvalid = (errs: FieldErrors<CreateEventInput>) => {
        const firstFieldWithError = FIRST_ERROR_FIELD_ORDER.find((field) => !!errs[field]);

        if (firstFieldWithError) {
            setFocus(firstFieldWithError);
            setHighlightedField(firstFieldWithError);
            if (highlightTimeoutRef.current) {
                window.clearTimeout(highlightTimeoutRef.current);
            }
            highlightTimeoutRef.current = window.setTimeout(() => {
                setHighlightedField(null);
            }, 1400);

            const fieldElement = document.querySelector<HTMLElement>(`[name="${firstFieldWithError}"]`);
            fieldElement?.scrollIntoView({ behavior: "smooth", block: "center" });
        }

        const first = Object.values(errs).find(
            (e): e is { message?: string } => typeof e === "object" && e !== null && "message" in e
        );
        toast.error(getLocalizedValidationMessage(first?.message));
    };

    const coverDropzoneAppearance = {
        container:
            "h-48 w-full rounded-xl border border-dashed border-primary/25 bg-gradient-to-br from-primary/5 via-muted/10 to-transparent p-4 transition-all duration-300 hover:border-primary/40 hover:from-primary/10 hover:shadow-sm cursor-pointer",
        uploadIcon: "h-7 w-7 text-primary/70 transition-transform duration-300 hover:scale-110",
        label: "text-xs font-semibold text-foreground tracking-wide mt-1.5",
        allowedContent: "text-[10px] text-muted-foreground/80 mt-0.5 font-medium",
        button:
            "mt-3 rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground shadow-md shadow-primary/15 transition-all duration-300 hover:bg-primary/95 hover:shadow-lg hover:shadow-primary/25 active:scale-95",
    };

    return (
        <form
            onSubmit={handleSubmit(onSubmit, onInvalid)}
            className="space-y-8"
            translate="no"
            data-gramm="false"
            data-gramm_editor="false"
        >
            {planSummary && !planSummary.isUnlimited && (
                <PlanUsageBanner summary={planSummary} showFeatures className="md:col-span-2 lg:col-span-3" />
            )}

            {!event && planSummary && !canCreateEvent && (
                <div className="rounded-2xl border border-amber-200/60 bg-amber-50/50 p-4 text-sm text-amber-900 dark:border-amber-900/30 dark:bg-amber-950/20 dark:text-amber-200 md:col-span-2 lg:col-span-3">
                    Has alcanzado el límite de eventos activos de tu plan.{" "}
                    <Link href="/organizer/billing" className="font-semibold underline">
                        Mejora tu plan
                    </Link>{" "}
                    o archiva un borrador/publicado antes de crear otro.
                </div>
            )}

            <div className="grid gap-8 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                <div className="space-y-6 lg:col-span-2">
                    <div>
                        <label className="mb-1.5 block text-sm font-medium text-foreground">
                            {t("events.form.eventTitle")}
                        </label>
                        <input
                            {...register("title")}
                            placeholder={t("events.form.eventTitlePlaceholder")}
                            className={`w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary ${getFieldHighlightClass("title")}`}
                        />
                        {errors.title && (
                            <p className="mt-1 text-xs text-destructive">{getLocalizedValidationMessage(errors.title.message)}</p>
                        )}
                    </div>

                    <div>
                        <div className="mb-1.5 flex items-center justify-between">
                            <label className="text-sm font-medium text-foreground">{t("events.form.description")}</label>
                        </div>
                        <textarea
                            {...register("description")}
                            rows={6}
                            placeholder={t("events.form.descriptionPlaceholder")}
                            className={`w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary resize-none ${getFieldHighlightClass("description")}`}
                        />
                        {errors.description && (
                            <p className="mt-1 text-xs text-destructive">{getLocalizedValidationMessage(errors.description.message)}</p>
                        )}
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                            <label className="mb-1.5 block text-sm font-medium text-foreground">{t("events.form.category")}</label>
                            <select
                                {...register("category")}
                                className={`w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm focus:border-primary focus:outline-none ${getFieldHighlightClass("category")}`}
                            >
                                <option value="">{t("events.form.selectCategory")}</option>
                                {categories.map((cat) => (
                                    <option key={cat.slug} value={cat.slug}>
                                        {categoryLabel(cat.slug, locale)}
                                    </option>
                                ))}
                            </select>
                            {errors.category && (
                                <p className="mt-1 text-xs text-destructive">{getLocalizedValidationMessage(errors.category.message)}</p>
                            )}
                        </div>

                        <div>
                            <label className="mb-1.5 block text-sm font-medium text-foreground">{t("events.form.dateTime")}</label>
                            <input
                                type="datetime-local"
                                {...register("date")}
                                className={`w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm focus:border-primary focus:outline-none ${getFieldHighlightClass("date")}`}
                            />
                            {errors.date && (
                                <p className="mt-1 text-xs text-destructive">{getLocalizedValidationMessage(errors.date.message)}</p>
                            )}
                        </div>
                    </div>

                    <div>
                        <div className="mb-2 flex items-center gap-3">
                            <label className="text-sm font-medium text-foreground">
                                {isVirtual ? t("events.form.meetingLink") : t("events.form.venueAddress")}
                            </label>
                            <label className="flex items-center gap-1.5 text-sm text-muted-foreground">
                                <input
                                    type="checkbox"
                                    {...register("isVirtual")}
                                    className="rounded border-border"
                                />
                                <Video className="h-3.5 w-3.5" /> {t("events.form.virtualEvent")}
                            </label>
                        </div>

                        {isVirtual ? (
                            <div key="virtual-fields">
                                <input
                                    {...register("virtualLink")}
                                    placeholder={t("events.form.meetingLinkPlaceholder")}
                                    className={`w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm focus:border-primary focus:outline-none ${getFieldHighlightClass("virtualLink")}`}
                                />
                                <p className="mt-1 text-xs text-muted-foreground">
                                    {t("events.form.meetingLinkHelp")}
                                </p>
                                {errors.virtualLink && (
                                    <p className="mt-1 text-xs text-destructive">{getLocalizedValidationMessage(errors.virtualLink.message)}</p>
                                )}
                            </div>
                        ) : (
                            <div key="physical-fields">
                                <div className="relative">
                                    <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                    <input
                                        {...register("location")}
                                        placeholder={t("events.form.venuePlaceholder")}
                                        className={`w-full rounded-xl border border-border bg-background pl-9 pr-4 py-2.5 text-sm focus:border-primary focus:outline-none ${getFieldHighlightClass("location")}`}
                                    />
                                </div>
                                {errors.location && (
                                    <p className="mt-1 text-xs text-destructive">{getLocalizedValidationMessage(errors.location.message)}</p>
                                )}
                            </div>
                        )}
                    </div>

                    {!isVirtual && (
                        <div>
                            <label className="mb-1.5 block text-sm font-medium text-foreground">
                                {t("events.form.capacity")} <span className="font-normal text-muted-foreground">{t("events.form.optional")}</span>
                            </label>
                            <input
                                type="number"
                                {...register("capacity", {
                                    setValueAs: (value) => {
                                        if (value === "" || value === null || value === undefined) return null;
                                        const num = Number(value);
                                        return Number.isNaN(num) ? null : num;
                                    },
                                })}
                                placeholder={t("events.form.capacityPlaceholder")}
                                min={1}
                                className={`w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm focus:border-primary focus:outline-none ${getFieldHighlightClass("capacity")}`}
                            />
                            <p className="mt-1 text-xs text-muted-foreground">
                                {t("events.form.capacityHelp")}
                            </p>
                            {errors.capacity && (
                                <p className="mt-1 text-xs text-destructive">{getLocalizedValidationMessage(errors.capacity.message)}</p>
                            )}
                        </div>
                    )}

                    <div>
                        <label className="mb-1.5 block text-sm font-medium text-foreground">
                            {t("events.form.price")} <span className="font-normal text-muted-foreground">{t("events.form.optional")}</span>
                        </label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">S/</span>
                            <input
                                type="number"
                                step="0.01"
                                min="0"
                                {...register("price", {
                                    setValueAs: (value) => {
                                        if (value === "" || value === null || value === undefined) return undefined;
                                        const num = Number(value);
                                        return Number.isNaN(num) ? undefined : num;
                                    },
                                })}
                                placeholder="0.00"
                                className="w-full rounded-xl border border-border bg-background pl-9 pr-4 py-2.5 text-sm focus:border-primary focus:outline-none"
                            />
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">
                            {t("events.form.priceHelp")}
                        </p>
                    </div>

                    {selectablePaymentMethods.length > 0 && !!watch("price") && Number(watch("price")) > 0 && (
                        <div className="rounded-xl border border-border p-4 space-y-3">
                            <h3 className="text-sm font-semibold text-foreground">{t("events.form.paymentMethodsTitle")}</h3>
                            <p className="text-xs text-muted-foreground">{t("events.form.paymentMethodsHelp")}</p>
                            <div className="flex flex-wrap gap-2">
                                {selectablePaymentMethods.map((pm) => {
                                    const selected = selectedPaymentMethodIds.includes(pm.id);
                                    const IconMap: Record<string, React.ComponentType<{ className?: string }>> = { yape: Smartphone, plin: QrCode, cash: Wallet };
                                    const PmIcon = IconMap[pm.type] ?? Wallet;
                                    return (
                                        <button
                                            key={pm.id}
                                            type="button"
                                            onClick={() => {
                                                setSelectedPaymentMethodIds((prev) =>
                                                    prev.includes(pm.id)
                                                        ? prev.filter((id) => id !== pm.id)
                                                        : [...prev, pm.id]
                                                );
                                            }}
                                            className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-sm font-medium transition-colors ${selected
                                                ? "border-primary bg-primary/10 text-primary"
                                                : "border-border bg-background text-foreground hover:bg-muted"
                                                }`}
                                        >
                                            <PmIcon className="h-4 w-4 shrink-0" />
                                            <span className="truncate">{pm.label}</span>
                                            <span className="text-xs text-muted-foreground">({pm.holderName})</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {hasTransport && (
                        <div className="mt-6 space-y-4">
                            {event?.id ? (
                                loadingRoutes ? (
                                    <div className="rounded-2xl border border-border bg-card p-8 flex items-center justify-center">
                                        <Loader2 className="h-6 w-6 animate-spin text-primary" />
                                        <span className="ml-2 text-sm text-muted-foreground">Cargando rutas de transporte...</span>
                                    </div>
                                ) : (
                                    <div className="rounded-2xl border border-border bg-card p-6">
                                        <TransportRoutesManager
                                            eventId={event.id}
                                            initialRoutes={routes}
                                        />
                                    </div>
                                )
                            ) : (
                                <div className="rounded-2xl border border-blue-500/20 bg-blue-500/5 p-6 space-y-3">
                                    <div className="flex items-center gap-3">
                                        <div className="rounded-xl bg-blue-500/10 p-2.5">
                                            <Bus className="h-5 w-5 text-blue-500 animate-pulse" />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-foreground">
                                                Configuración de Rutas de Transporte
                                            </h3>
                                            <p className="text-xs text-muted-foreground">
                                                El transporte para este evento quedará habilitado automáticamente.
                                            </p>
                                        </div>
                                    </div>
                                    <div className="rounded-xl bg-background/50 border border-border/40 p-4 text-sm text-muted-foreground">
                                        ✨ <strong>¡Excelente elección!</strong> Al guardar este nuevo evento, se creará su registro en la base de datos y podrás configurar y añadir todas las rutas de salida, horarios y precios inmediatamente desde la consola de transporte.
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <div className="space-y-6">
                    <div>
                        <label className="mb-1.5 block text-sm font-medium text-foreground">{t("events.form.coverImage")}</label>
                        <div className="overflow-hidden rounded-xl border border-border bg-secondary">
                            {coverImage ? (
                                <div className="relative">
                                    <EventCoverImage
                                        src={coverImage}
                                        alt="Cover"
                                        width={400}
                                        height={400}
                                        className="h-96 w-full object-contain bg-muted"
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
                                <div className="flex h-96 flex-col items-center justify-center gap-2 px-4 text-center text-muted-foreground">
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
                                            button({ ready, isUploading }) {
                                                if (isUploading) return t("common.loading");
                                                return t("events.form.uploadButton");
                                            }
                                        }}
                                        appearance={coverDropzoneAppearance}
                                    />
                                </div>
                            )}
                        </div>
                    </div>

                    <div>
                        <label className="mb-1.5 block text-sm font-medium text-foreground">{t("events.form.status")}</label>
                        <select
                            {...register("status")}
                            className={`w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm focus:border-primary focus:outline-none ${getFieldHighlightClass("status")}`}
                        >
                            <option value="draft">{t("eventStatus.draft")}</option>
                            <option value="published">{t("eventStatus.published")}</option>
                            <option value="cancelled">{t("eventStatus.cancelled")}</option>
                        </select>
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
                                    <p className="text-sm font-medium text-foreground">{t("events.form.featureEvent")}</p>
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    {t("events.form.featureEventHelp")}
                                </p>
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
                                <Bus className="h-3.5 w-3.5 text-blue-500" />
                                <p className="text-sm font-medium text-foreground">{t("events.form.offerTransport")}</p>
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
            </div>
        </form>
    );
}
