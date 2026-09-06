"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { createEventSchema, type CreateEventInput, type EventScheduleSlot } from "@/lib/validations";
import { createEvent, updateEvent } from "@/actions/events";
import { getPaymentMethodsForEventForm, setEventPaymentMethods } from "@/actions/payment-methods";
import { getRoutesByEvent } from "@/actions/transport";
import { PlanUsageBanner } from "@/components/dashboard/organizer/PlanUsageBanner";
import { useFormPersistence } from "@/hooks/useFormPersistence";
import { formStorageKey, loadFormDraft, saveFormDraft } from "@/lib/form-persistence";
import { useLocale, useTranslations } from "@/components/providers/LocaleProvider";
import { EVENT_CATEGORIES, getTypesForCategory } from "@/lib/events/taxonomy";

// Subcomponents & Types
import {
    type EventFormProps,
    type CategoryOption,
    type ScheduleSlotState,
    type EventFormDraft,
    EVENT_DRAFT_STORAGE_KEY,
    toLocalDateTimeInputValue,
    VALIDATION_MESSAGE_KEY_BY_TEXT,
    FIRST_ERROR_FIELD_ORDER,
} from "./form/types";
import { BasicInfoSection } from "./form/BasicInfoSection";
import { ScheduleSection } from "./form/ScheduleSection";
import { LocationSection } from "./form/LocationSection";
import { PricingPaymentsSection } from "./form/PricingPaymentsSection";
import { MediaSettingsSection } from "./form/MediaSettingsSection";
import { TransportSection } from "./form/TransportSection";

type TransportRouteList = Awaited<ReturnType<typeof getRoutesByEvent>>;

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
    const [allPaymentMethods, setAllPaymentMethods] = useState<
        Array<{ id: string; type: string; label: string; holderName: string }>
    >([]);
    const [selectedPaymentMethodIds, setSelectedPaymentMethodIds] = useState<string[]>([]);
    const [highlightedField, setHighlightedField] = useState<keyof CreateEventInput | null>(null);
    const highlightTimeoutRef = useRef<number | null>(null);
    const [routes, setRoutes] = useState<TransportRouteList>([]);
    const [loadingRoutes, setLoadingRoutes] = useState(false);

    const buildCategoryOptions = (customCats: CategoryOption[]): CategoryOption[] => {
        const standardOptions: CategoryOption[] = EVENT_CATEGORIES.map((cat) => ({
            slug: cat.slug,
            label: locale === "en" ? cat.labelEn : cat.labelEs,
            colorClass: cat.colorClass,
        }));
        const combined = [...standardOptions];
        customCats.forEach((cat) => {
            if (!combined.some((c) => c.slug === cat.slug)) {
                combined.push(cat);
            }
        });
        return combined;
    };

    const [categoryOptions, setCategoryOptions] = useState<CategoryOption[]>(() =>
        buildCategoryOptions(categories),
    );
    const [minimumEventDate, setMinimumEventDate] = useState("");

    useEffect(() => {
        setCategoryOptions(buildCategoryOptions(categories));
    }, [categories]);

    useEffect(() => {
        setMinimumEventDate(toLocalDateTimeInputValue(new Date()).slice(0, 10));
    }, []);

    const getLocalizedValidationMessage = (message?: string) => {
        if (!message) return t("events.form.requiredFieldsError");
        const key = VALIDATION_MESSAGE_KEY_BY_TEXT[message];
        return key ? t(key) : message;
    };

    const getFieldHighlightClass = (field: keyof CreateEventInput) =>
        highlightedField === field
            ? "border-destructive ring-2 ring-destructive/40 animate-pulse"
            : "";

    const form = useForm<CreateEventInput>({
        resolver: zodResolver(createEventSchema),
        mode: "onTouched",
        reValidateMode: "onChange",
        defaultValues: event
            ? {
                  title: event.title,
                  description: event.description,
                  category: event.category,
                  date: toLocalDateTimeInputValue(event.date),
                  endDate: event.endDate ? toLocalDateTimeInputValue(event.endDate) : undefined,
                  schedules: event.schedules ?? undefined,
                  location: event.location ?? undefined,
                  latitude: event.latitude ?? null,
                  longitude: event.longitude ?? null,
                  isVirtual: event.isVirtual,
                  virtualLink: event.virtualLink ?? undefined,
                  capacity: event.capacity ?? undefined,
                  price: event.price ? Number(event.price) : undefined,
                  status: event.status,
                  isFeatured: event.isFeatured,
                  hasTransport: event.hasTransport,
                  hasCertificate: event.hasCertificate ?? false,
                  certificateTitle: event.certificateTitle ?? "",
                  certificatePrice: event.certificatePrice ? Number(event.certificatePrice) : 0,
                  holdMinutesCard: event.holdMinutesCard ?? 30,
                  holdHoursManual: event.holdHoursManual ?? 24,
                  nearEventWindowHours: event.nearEventWindowHours ?? 48,
                  nearEventHoldMinutes: event.nearEventHoldMinutes ?? 15,
                  salesCutoffHoursBefore: event.salesCutoffHoursBefore ?? undefined,
              }
            : {
                  status: "draft",
                  isVirtual: false,
                  isFeatured: false,
                  hasTransport: false,
                  hasCertificate: false,
                  certificateTitle: "",
                  certificatePrice: 0,
                  price: undefined,
                  latitude: null,
                  longitude: null,
                  holdMinutesCard: 30,
                  holdHoursManual: 24,
                  nearEventWindowHours: 48,
                  nearEventHoldMinutes: 15,
              },
    });

    const {
        register,
        handleSubmit,
        control,
        setValue,
        setFocus,
        clearErrors,
        trigger,
        formState: { errors },
    } = form;

    const buildInitialSlots = (): ScheduleSlotState[] => {
        if (event?.schedules && event.schedules.length > 0) {
            return event.schedules.slice(0, 3).map((s, idx) => {
                const sDate = s.date ? toLocalDateTimeInputValue(s.date) : "";
                const sEndDate = s.endDate ? toLocalDateTimeInputValue(s.endDate) : "";
                return {
                    id: s.id || `slot-${idx + 1}`,
                    label: s.label || (idx === 0 ? "Horario Principal" : `Horario ${idx + 1}`),
                    datePart: sDate.slice(0, 10),
                    startTimePart: sDate.slice(11, 16),
                    endTimePart: sEndDate ? sEndDate.slice(11, 16) : "",
                };
            });
        }
        const initialDateStr = event?.date ? toLocalDateTimeInputValue(event.date) : "";
        const initialEndDateStr = event?.endDate ? toLocalDateTimeInputValue(event.endDate) : "";
        return [
            {
                id: "slot-1",
                label: "Horario Principal",
                datePart: initialDateStr.slice(0, 10),
                startTimePart: initialDateStr.slice(11, 16),
                endTimePart: initialEndDateStr ? initialEndDateStr.slice(11, 16) : "",
            },
        ];
    };

    const [scheduleSlots, setScheduleSlots] = useState<ScheduleSlotState[]>(buildInitialSlots);
    const datePartsUpdateRef = useRef(false);
    const watchedDateTime = useWatch({ control, name: "date" });
    const watchedCategory = useWatch({ control, name: "category" });
    const suggestedTypes = watchedCategory ? getTypesForCategory(watchedCategory) : [];

    useEffect(() => {
        if (datePartsUpdateRef.current) {
            datePartsUpdateRef.current = false;
            return;
        }
        if (watchedDateTime && scheduleSlots.length > 0) {
            const nextDate = watchedDateTime.slice(0, 10);
            const nextTime = watchedDateTime.slice(11, 16);
            if (scheduleSlots[0].datePart !== nextDate || scheduleSlots[0].startTimePart !== nextTime) {
                setScheduleSlots((prev) =>
                    prev.map((item, idx) =>
                        idx === 0 ? { ...item, datePart: nextDate, startTimePart: nextTime } : item,
                    ),
                );
            }
        }
    }, [watchedDateTime, scheduleSlots]);

    const syncSlotsToForm = (slots: ScheduleSlotState[]) => {
        const slot1 = slots[0];
        const combinedPrimaryDate =
            slot1 && slot1.datePart && slot1.startTimePart ? `${slot1.datePart}T${slot1.startTimePart}` : "";
        const combinedPrimaryEndDate =
            slot1 && slot1.datePart && slot1.endTimePart ? `${slot1.datePart}T${slot1.endTimePart}` : null;

        datePartsUpdateRef.current = true;
        setValue("date", combinedPrimaryDate, {
            shouldDirty: true,
            shouldTouch: true,
            shouldValidate: Boolean(combinedPrimaryDate),
        });
        setValue("endDate", combinedPrimaryEndDate ?? undefined, {
            shouldDirty: true,
        });

        const schedulesPayload: EventScheduleSlot[] = slots.map((s, idx) => {
            const sDate = s.datePart && s.startTimePart ? `${s.datePart}T${s.startTimePart}` : "";
            const sEndDate = s.datePart && s.endTimePart ? `${s.datePart}T${s.endTimePart}` : null;
            return {
                id: s.id,
                label: s.label.trim() || (idx === 0 ? "Horario Principal" : `Horario ${idx + 1}`),
                date: sDate,
                endDate: sEndDate,
            };
        });

        setValue("schedules", schedulesPayload, { shouldDirty: true });

        if (combinedPrimaryDate) {
            void trigger("date").then((valid) => {
                if (!valid) return;
                clearErrors("date");
                setHighlightedField((current) => (current === "date" ? null : current));
                toast.dismiss("event-form-validation");
            });
        }
    };

    const handleSlotFieldChange = (
        index: number,
        field: "label" | "datePart" | "startTimePart" | "endTimePart",
        value: string,
    ) => {
        setScheduleSlots((prev) => {
            const updated = prev.map((item, idx) => (idx === index ? { ...item, [field]: value } : item));
            syncSlotsToForm(updated);
            return updated;
        });
    };

    const handleAddScheduleSlot = () => {
        if (scheduleSlots.length >= 3) return;
        setScheduleSlots((prev) => {
            const nextIndex = prev.length + 1;
            const defaultDate = prev[0]?.datePart || "";
            const newSlot: ScheduleSlotState = {
                id: `slot-${Date.now()}`,
                label: nextIndex === 2 ? "Turno Tarde" : "Turno Noche",
                datePart: defaultDate,
                startTimePart: "",
                endTimePart: "",
            };
            const updated = [...prev, newSlot];
            syncSlotsToForm(updated);
            toast.info(locale === "en" ? `Schedule ${nextIndex} added` : `Horario ${nextIndex} agregado`);
            return updated;
        });
    };

    const handleRemoveScheduleSlot = (index: number) => {
        if (index === 0) return;
        setScheduleSlots((prev) => {
            const updated = prev.filter((_, idx) => idx !== index);
            syncSlotsToForm(updated);
            toast.info(locale === "en" ? "Schedule removed" : "Horario eliminado");
            return updated;
        });
    };

    const handleCopyDateFromPrimary = (index: number) => {
        const primaryDate = scheduleSlots[0]?.datePart;
        if (!primaryDate) return;
        handleSlotFieldChange(index, "datePart", primaryDate);
    };

    const eventDraftKey = event ? formStorageKey(`event.edit.${event.id}`) : EVENT_DRAFT_STORAGE_KEY;
    const { clearDraft } = useFormPersistence(eventDraftKey, form);
    const extraDraftKey = `${eventDraftKey}.extra`;
    const extraHydratedRef = useRef(false);

    const isVirtual = useWatch({ control, name: "isVirtual" });
    const hasTransport = useWatch({ control, name: "hasTransport" });
    const hasCertificate = useWatch({ control, name: "hasCertificate" });
    const watchedCertificatePrice = useWatch({ control, name: "certificatePrice" });
    const watchedPrice = useWatch({ control, name: "price" });
    const watchedTitle = useWatch({ control, name: "title" });
    const watchedLocation = useWatch({ control, name: "location" });
    const watchedLatitude = useWatch({ control, name: "latitude" });
    const watchedLongitude = useWatch({ control, name: "longitude" });
    const watchedEndDate = useWatch({ control, name: "endDate" });
    const currentDescription = useWatch({ control, name: "description" });

    const isPaidEvent = Boolean(watchedPrice != null && Number(watchedPrice) > 0);
    const hasPaidCertificate = Boolean(
        hasCertificate && watchedCertificatePrice != null && Number(watchedCertificatePrice) > 0,
    );
    const requiresPaymentMethods = isPaidEvent || hasPaidCertificate;

    useEffect(() => {
        if (!isVirtual) return;
        setValue("latitude", null, { shouldDirty: true });
        setValue("longitude", null, { shouldDirty: true });
    }, [isVirtual, setValue]);

    const canUseTransport = planSummary?.isUnlimited || planSummary?.features.transport || event?.hasTransport;
    const canUseCulqi = planSummary?.isUnlimited || planSummary?.features.culqi;
    const canCreateEvent = planSummary?.isUnlimited || planSummary?.canCreateEvent !== false;
    const planMaxAttendees =
        planSummary && !planSummary.isUnlimited ? planSummary.plan.maxAttendeesPerEvent : null;

    const clampCapacityInput = (raw: string) => {
        if (raw === "" || planMaxAttendees == null) return raw;
        const num = Number(raw);
        if (Number.isNaN(num)) return raw;
        if (num > planMaxAttendees) return String(planMaxAttendees);
        return raw;
    };

    const {
        onChange: onCapacityChange,
        onBlur: onCapacityBlur,
        ...capacityField
    } = register("capacity", {
        setValueAs: (value) => {
            if (value === "" || value === null || value === undefined) return null;
            const num = Number(value);
            if (Number.isNaN(num)) return null;
            if (planMaxAttendees != null && num > planMaxAttendees) return planMaxAttendees;
            return num;
        },
        validate: (value) => {
            if (planMaxAttendees == null || value == null) return true;
            if (value <= planMaxAttendees) return true;
            return t("events.form.validation.capacityPlanLimit", { max: planMaxAttendees });
        },
    });

    const handleCapacityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const clamped = clampCapacityInput(e.target.value);
        if (clamped !== e.target.value) {
            e.target.value = clamped;
        }
        void onCapacityChange(e);
    };

    const handleCapacityBlur = (e: React.FocusEvent<HTMLInputElement>) => {
        const clamped = clampCapacityInput(e.target.value);
        if (clamped !== e.target.value) {
            e.target.value = clamped;
            const num = clamped === "" ? null : Number(clamped);
            setValue("capacity", Number.isNaN(num) ? null : num, { shouldValidate: true });
        }
        void onCapacityBlur(e);
    };

    const selectablePaymentMethods = allPaymentMethods.filter((pm) => pm.type !== "culqi" || canUseCulqi);

    useEffect(() => {
        (async () => {
            const methods = await getPaymentMethodsForEventForm(event?.organizerId);
            setAllPaymentMethods(methods);
        })();
    }, [event?.organizerId]);

    useEffect(() => {
        if (
            requiresPaymentMethods &&
            selectedPaymentMethodIds.length === 0 &&
            selectablePaymentMethods.length > 0
        ) {
            setSelectedPaymentMethodIds(selectablePaymentMethods.map((m) => m.id));
        }
    }, [requiresPaymentMethods, selectedPaymentMethodIds.length, selectablePaymentMethods]);

    useEffect(() => {
        if (planMaxAttendees == null || isVirtual) return;
        const current = form.getValues("capacity");
        if (current != null && current > planMaxAttendees) {
            setValue("capacity", planMaxAttendees, { shouldValidate: true });
        }
    }, [planMaxAttendees, isVirtual, form, setValue]);

    useEffect(() => {
        if (!event?.id || !hasTransport) return;

        let active = true;
        (async () => {
            setLoadingRoutes(true);
            try {
                const fetched = await getRoutesByEvent(event.id);
                if (active) {
                    setRoutes(
                        fetched.map((r) => ({
                            ...r,
                            departureTime: new Date(r.departureTime),
                            returnTime: r.returnTime ? new Date(r.returnTime) : null,
                            bookedSeats: Number(r.bookedSeats),
                        })),
                    );
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
        if (event || extraHydratedRef.current) return;
        extraHydratedRef.current = true;

        const saved = loadFormDraft<EventFormDraft>(extraDraftKey);
        if (!saved) return;

        if (saved.coverImage) setCoverImage(saved.coverImage);
        if (saved.selectedPaymentMethodIds?.length) {
            setSelectedPaymentMethodIds(saved.selectedPaymentMethodIds);
        }
    }, [event, extraDraftKey]);

    useEffect(() => {
        if (event) return;

        const timer = setTimeout(() => {
            saveFormDraft(extraDraftKey, { coverImage, selectedPaymentMethodIds });
        }, 300);
        return () => clearTimeout(timer);
    }, [event, extraDraftKey, coverImage, selectedPaymentMethodIds]);

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

    useEffect(() => {
        if (Object.keys(errors).length === 0) {
            toast.dismiss("event-form-validation");
        }
    }, [errors]);

    const onSubmit = (data: CreateEventInput) => {
        if (
            planMaxAttendees != null &&
            !data.isVirtual &&
            data.capacity != null &&
            data.capacity > planMaxAttendees
        ) {
            toast.error(t("events.form.validation.capacityPlanLimit", { max: planMaxAttendees }));
            setFocus("capacity");
            setHighlightedField("capacity");
            return;
        }

        if (
            !data.isVirtual &&
            data.status === "published" &&
            (data.latitude == null || data.longitude == null)
        ) {
            toast.error(t("events.form.validation.mapPinRequired"));
            setHighlightedField("location");
            document.getElementById("event-location")?.focus();
            return;
        }

        const isPaid = Boolean(data.price != null && Number(data.price) > 0);
        const hasPaidCert = Boolean(
            data.hasCertificate && data.certificatePrice != null && Number(data.certificatePrice) > 0,
        );
        const requiresPayment = isPaid || hasPaidCert;

        if (requiresPayment) {
            if (selectablePaymentMethods.length === 0) {
                toast.error(
                    locale === "en"
                        ? "You have not configured any payment methods in your organizer settings. Please configure one in Settings > Payment Methods before publishing."
                        : "No has configurado ningún medio de pago en tu panel. Debes activar al menos uno en Configuración > Medios de pago para poder cobrar por el evento o certificaciones.",
                );
                return;
            }

            if (selectedPaymentMethodIds.length === 0) {
                toast.error(
                    locale === "en"
                        ? "Please select at least one payment method for this event."
                        : "Debes seleccionar al menos un medio de pago obligatorio para este evento.",
                );
                const el = document.getElementById("event-payment-methods-section");
                el?.scrollIntoView({ behavior: "smooth", block: "center" });
                return;
            }
        }

        for (let i = 1; i < scheduleSlots.length; i++) {
            const slot = scheduleSlots[i];
            if (!slot.datePart || !slot.startTimePart) {
                toast.error(
                    locale === "en"
                        ? `Please complete date and start time for ${slot.label || `Schedule ${i + 1}`}`
                        : `Por favor completa la fecha y hora de inicio para el ${slot.label || `Horario ${i + 1}`}`,
                );
                const missingId = !slot.datePart ? `event-slot-${slot.id}-date` : `event-slot-${slot.id}-start`;
                document.getElementById(missingId)?.focus();
                return;
            }
        }

        startTransition(async () => {
            try {
                const payload = {
                    ...data,
                    coverImage,
                    capacity: data.isVirtual ? null : data.capacity,
                    location: data.isVirtual ? null : data.location,
                    latitude: data.isVirtual ? null : data.latitude,
                    longitude: data.isVirtual ? null : data.longitude,
                    virtualLink: data.isVirtual ? data.virtualLink : null,
                    isFeatured: canFeature ? data.isFeatured : false,
                    status: data.status ?? "draft",
                    hasTransport: data.hasTransport ?? false,
                };

                const result = event ? await updateEvent(event.id, payload) : await createEvent(payload);

                if (result.success) {
                    const savedEventId = event?.id ?? result.event?.id;
                    if (savedEventId) {
                        await setEventPaymentMethods(savedEventId, selectedPaymentMethodIds);
                    }

                    clearDraft();
                    if (!event) {
                        saveFormDraft(extraDraftKey, { coverImage: null, selectedPaymentMethodIds: [] });
                    }

                    toast.success(event ? t("events.form.eventUpdated") : t("events.form.eventCreated"));
                    router.push(redirectPath);
                }
            } catch (err) {
                toast.error(
                    err instanceof Error
                        ? getLocalizedValidationMessage(err.message)
                        : t("events.form.genericError"),
                );
            }
        });
    };

    const onInvalid = (errs: any) => {
        const firstFieldWithError = FIRST_ERROR_FIELD_ORDER.find((field) => !!errs[field]);

        if (firstFieldWithError) {
            if (firstFieldWithError === "date") {
                const primarySlot = scheduleSlots[0];
                const dateInputId = primarySlot?.datePart
                    ? `event-slot-${primarySlot.id}-start`
                    : `event-slot-${primarySlot?.id ?? "slot-1"}-date`;
                document.getElementById(dateInputId)?.focus();
            } else {
                setFocus(firstFieldWithError);
            }
            setHighlightedField(firstFieldWithError);
            if (highlightTimeoutRef.current) {
                window.clearTimeout(highlightTimeoutRef.current);
            }
            highlightTimeoutRef.current = window.setTimeout(() => {
                setHighlightedField(null);
            }, 1400);

            const fieldElement =
                firstFieldWithError === "date"
                    ? document.getElementById(`event-slot-${scheduleSlots[0]?.id ?? "slot-1"}-date`)
                    : document.querySelector<HTMLElement>(`[name="${firstFieldWithError}"]`);
            fieldElement?.scrollIntoView({ behavior: "smooth", block: "center" });
        }

        const first = Object.values(errs).find(
            (e): e is { message?: string } => typeof e === "object" && e !== null && "message" in e,
        );
        toast.error(getLocalizedValidationMessage(first?.message), {
            id: "event-form-validation",
        });
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
                    {t("dashboard.organizer.eventFormPlanLimit")}{" "}
                    {planSummary.canManageBilling ? (
                        <Link href="/organizer/billing" className="font-semibold underline">
                            {t("dashboard.organizer.planUsageUpgrade")}
                        </Link>
                    ) : (
                        <span className="font-semibold">
                            {t("dashboard.organizer.planLimitContactAdmin")}
                        </span>
                    )}{" "}
                    {t("dashboard.organizer.eventFormPlanLimitOrArchive")}
                </div>
            )}

            <div className="grid gap-8 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                <div className="space-y-6 lg:col-span-2">
                    <BasicInfoSection
                        register={register}
                        errors={errors}
                        setValue={setValue}
                        currentDescription={currentDescription}
                        categoryOptions={categoryOptions}
                        suggestedTypes={suggestedTypes}
                        locale={locale}
                        getFieldHighlightClass={getFieldHighlightClass}
                        getLocalizedValidationMessage={getLocalizedValidationMessage}
                        t={t}
                    />

                    <ScheduleSection
                        scheduleSlots={scheduleSlots}
                        minimumEventDate={minimumEventDate}
                        locale={locale}
                        handleAddScheduleSlot={handleAddScheduleSlot}
                        handleRemoveScheduleSlot={handleRemoveScheduleSlot}
                        handleCopyDateFromPrimary={handleCopyDateFromPrimary}
                        handleSlotFieldChange={handleSlotFieldChange}
                        errors={errors}
                        getFieldHighlightClass={getFieldHighlightClass}
                        getLocalizedValidationMessage={getLocalizedValidationMessage}
                    />

                    <LocationSection
                        isVirtual={isVirtual}
                        register={register}
                        errors={errors}
                        watchedLocation={watchedLocation ?? undefined}
                        watchedLatitude={typeof watchedLatitude === "number" ? watchedLatitude : null}
                        watchedLongitude={typeof watchedLongitude === "number" ? watchedLongitude : null}
                        setValue={setValue}
                        planMaxAttendees={planMaxAttendees}
                        getFieldHighlightClass={getFieldHighlightClass}
                        getLocalizedValidationMessage={getLocalizedValidationMessage}
                        t={t}
                    />

                    <PricingPaymentsSection
                        isVirtual={isVirtual}
                        register={register}
                        errors={errors}
                        capacityField={capacityField}
                        handleCapacityChange={handleCapacityChange}
                        handleCapacityBlur={handleCapacityBlur}
                        planMaxAttendees={planMaxAttendees}
                        watchedPrice={typeof watchedPrice === "number" ? watchedPrice : undefined}
                        selectablePaymentMethods={selectablePaymentMethods}
                        requiresPaymentMethods={requiresPaymentMethods}
                        selectedPaymentMethodIds={selectedPaymentMethodIds}
                        setSelectedPaymentMethodIds={setSelectedPaymentMethodIds}
                        getFieldHighlightClass={getFieldHighlightClass}
                        getLocalizedValidationMessage={getLocalizedValidationMessage}
                        t={t}
                    />

                    <TransportSection
                        hasTransport={hasTransport}
                        event={event}
                        loadingRoutes={loadingRoutes}
                        routes={routes}
                        watchedTitle={watchedTitle}
                        watchedDateTime={watchedDateTime}
                        watchedEndDate={watchedEndDate ?? undefined}
                        watchedLocation={watchedLocation ?? undefined}
                        isVirtual={isVirtual}
                        watchedLatitude={typeof watchedLatitude === "number" ? watchedLatitude : null}
                        watchedLongitude={typeof watchedLongitude === "number" ? watchedLongitude : null}
                    />
                </div>

                <MediaSettingsSection
                    coverImage={coverImage}
                    setCoverImage={setCoverImage}
                    coverDropzoneAppearance={coverDropzoneAppearance}
                    register={register}
                    errors={errors}
                    canFeature={canFeature}
                    canUseTransport={Boolean(canUseTransport)}
                    hasTransport={hasTransport}
                    hasCertificate={hasCertificate}
                    isPending={isPending}
                    event={event}
                    canCreateEvent={canCreateEvent}
                    getFieldHighlightClass={getFieldHighlightClass}
                    getLocalizedValidationMessage={getLocalizedValidationMessage}
                    locale={locale}
                    t={t}
                />
            </div>
        </form>
    );
}
