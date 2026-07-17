"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { createEventSchema, type CreateEventInput } from "@/lib/validations";
import { createEvent, updateEvent } from "@/actions/events";
import { getPaymentMethodsForEventForm, setEventPaymentMethods } from "@/actions/payment-methods";
import { UploadDropzone } from "@/lib/uploadthing/components";
import { toast } from "sonner";
import { Loader2, ImageIcon, MapPin, Video, Star, Bus, Smartphone, QrCode, Wallet, CreditCard, Plus, CalendarDays, Clock3 } from "lucide-react";
import { EventCoverFrame } from "@/components/events/EventCoverFrame";
import { CreateCategoryModal } from "@/components/events/CreateCategoryModal";
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
import { useFormPersistence } from "@/hooks/useFormPersistence";
import { formStorageKey, loadFormDraft, saveFormDraft } from "@/lib/form-persistence";

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

const EVENT_DRAFT_STORAGE_KEY = formStorageKey("event.create");
const EVENT_HOUR_OPTIONS = Array.from({ length: 12 }, (_, index) =>
    String(index + 1).padStart(2, "0"),
);
const EVENT_MINUTE_OPTIONS = Array.from({ length: 12 }, (_, index) =>
    String(index * 5).padStart(2, "0"),
);

function toLocalDateTimeInputValue(value: Date | string) {
    const date = new Date(value);
    const pad = (part: number) => String(part).padStart(2, "0");
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function openNativePicker(input: HTMLInputElement | null) {
    if (!input) return;
    try {
        input.showPicker();
    } catch {
        input.focus();
        input.click();
    }
}

function to24HourTime(hour12: string, minute: string, period: "AM" | "PM") {
    const parsedHour = Number(hour12);
    const hour24 =
        period === "PM"
            ? (parsedHour % 12) + 12
            : parsedHour % 12;
    return `${String(hour24).padStart(2, "0")}:${minute}`;
}

type EventFormDraft = {
    coverImage: string | null;
    selectedPaymentMethodIds: string[];
};

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
    const [categoryOptions, setCategoryOptions] = useState(categories);
    const [createCategoryOpen, setCreateCategoryOpen] = useState(false);
    const pendingCategorySelectionRef = useRef<string | null>(null);

    useEffect(() => {
        setCategoryOptions(categories);
    }, [categories]);

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
                location: event.location ?? undefined,
                isVirtual: event.isVirtual,
                virtualLink: event.virtualLink ?? undefined,
                capacity: event.capacity ?? undefined,
                price: event.price ? Number(event.price) : undefined,
                status: event.status,
                isFeatured: event.isFeatured,
                hasTransport: event.hasTransport,
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
                price: undefined,
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
        reset,
        formState: { errors },
    } = form;
    const initialDateTime = form.getValues("date") ?? "";
    const [eventDatePart, setEventDatePart] = useState(initialDateTime.slice(0, 10));
    const [eventTimePart, setEventTimePart] = useState(initialDateTime.slice(11, 16));
    const [timePickerOpen, setTimePickerOpen] = useState(false);
    const eventDateInputRef = useRef<HTMLInputElement>(null);
    const eventTimeInputRef = useRef<HTMLInputElement>(null);
    const timePickerRef = useRef<HTMLDivElement>(null);
    const datePartsUpdateRef = useRef(false);
    const watchedDateTime = useWatch({ control, name: "date" });
    const selectedHour24 = Number(eventTimePart.slice(0, 2) || 0);
    const selectedHour12 = eventTimePart
        ? String(selectedHour24 % 12 || 12).padStart(2, "0")
        : "";
    const selectedPeriod: "AM" | "PM" = selectedHour24 >= 12 ? "PM" : "AM";

    useEffect(() => {
        if (datePartsUpdateRef.current) {
            datePartsUpdateRef.current = false;
            return;
        }
        setEventDatePart(watchedDateTime?.slice(0, 10) ?? "");
        setEventTimePart(watchedDateTime?.slice(11, 16) ?? "");
    }, [watchedDateTime]);

    const updateEventDateTime = (nextDate: string, nextTime: string) => {
        setEventDatePart(nextDate);
        setEventTimePart(nextTime);

        const combined = nextDate && nextTime ? `${nextDate}T${nextTime}` : "";
        if (combined !== watchedDateTime) {
            datePartsUpdateRef.current = true;
            setValue("date", combined, {
                shouldDirty: true,
                shouldTouch: true,
                shouldValidate: Boolean(combined),
            });
        }

        if (combined) {
            void trigger("date").then((valid) => {
                if (!valid) return;
                clearErrors("date");
                setHighlightedField((current) => current === "date" ? null : current);
                toast.dismiss("event-form-validation");
            });
        }
    };

    useEffect(() => {
        if (!timePickerOpen) return;

        const closeOnOutsideClick = (event: MouseEvent) => {
            if (!timePickerRef.current?.contains(event.target as Node)) {
                setTimePickerOpen(false);
            }
        };
        const closeOnEscape = (event: KeyboardEvent) => {
            if (event.key === "Escape") setTimePickerOpen(false);
        };

        document.addEventListener("mousedown", closeOnOutsideClick);
        document.addEventListener("keydown", closeOnEscape);
        return () => {
            document.removeEventListener("mousedown", closeOnOutsideClick);
            document.removeEventListener("keydown", closeOnEscape);
        };
    }, [timePickerOpen]);

    useEffect(() => {
        const slug = pendingCategorySelectionRef.current;
        if (!slug || !categoryOptions.some((category) => category.slug === slug)) return;

        setValue("category", slug, {
            shouldValidate: true,
            shouldDirty: true,
            shouldTouch: true,
        });
        pendingCategorySelectionRef.current = null;
    }, [categoryOptions, setValue]);

    const eventDraftKey = event
        ? formStorageKey(`event.edit.${event.id}`)
        : EVENT_DRAFT_STORAGE_KEY;
    const { clearDraft } = useFormPersistence(eventDraftKey, form);
    const extraDraftKey = `${eventDraftKey}.extra`;
    const extraHydratedRef = useRef(false);

    const isVirtual = useWatch({ control, name: "isVirtual" });
    const hasTransport = useWatch({ control, name: "hasTransport" });
    const watchedPrice = useWatch({ control, name: "price" });
    const canUseTransport = planSummary?.isUnlimited || planSummary?.features.transport || event?.hasTransport;
    const canUseCulqi = planSummary?.isUnlimited || planSummary?.features.culqi;
    const canCreateEvent = planSummary?.isUnlimited || planSummary?.canCreateEvent !== false;
    const planMaxAttendees =
        planSummary && !planSummary.isUnlimited
            ? planSummary.plan.maxAttendeesPerEvent
            : null;

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

    const handleCapacityChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const clamped = clampCapacityInput(event.target.value);
        if (clamped !== event.target.value) {
            event.target.value = clamped;
        }
        void onCapacityChange(event);
    };

    const handleCapacityBlur = (event: React.FocusEvent<HTMLInputElement>) => {
        const clamped = clampCapacityInput(event.target.value);
        if (clamped !== event.target.value) {
            event.target.value = clamped;
            const num = clamped === "" ? null : Number(clamped);
            setValue("capacity", Number.isNaN(num) ? null : num, { shouldValidate: true });
        }
        void onCapacityBlur(event);
    };
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
            toast.error(
                t("events.form.validation.capacityPlanLimit", { max: planMaxAttendees }),
            );
            setFocus("capacity");
            setHighlightedField("capacity");
            return;
        }

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
                        : t("events.form.genericError")
                );
            }
        });
    };

    const onInvalid = (errs: FieldErrors<CreateEventInput>) => {
        const firstFieldWithError = FIRST_ERROR_FIELD_ORDER.find((field) => !!errs[field]);

        if (firstFieldWithError) {
            if (firstFieldWithError === "date") {
                const dateInputId = eventDatePart ? "event-time-part" : "event-date-part";
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
                    ? document.getElementById(eventDatePart ? "event-time-part" : "event-date-part")
                    : document.querySelector<HTMLElement>(`[name="${firstFieldWithError}"]`);
            fieldElement?.scrollIntoView({ behavior: "smooth", block: "center" });
        }

        const first = Object.values(errs).find(
            (e): e is { message?: string } => typeof e === "object" && e !== null && "message" in e
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
                    <div>
                        <label htmlFor="event-title" className="mb-1.5 block text-sm font-medium text-foreground">
                            {t("events.form.eventTitle")}
                        </label>
                        <input
                            id="event-title"
                            {...register("title")}
                            aria-invalid={Boolean(errors.title)}
                            aria-describedby={errors.title ? "event-title-error" : undefined}
                            placeholder={t("events.form.eventTitlePlaceholder")}
                            className={`w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary ${getFieldHighlightClass("title")}`}
                        />
                        {errors.title && (
                            <p id="event-title-error" role="alert" className="mt-1 text-xs text-destructive">{getLocalizedValidationMessage(errors.title.message)}</p>
                        )}
                    </div>

                    <div>
                        <div className="mb-1.5 flex items-center justify-between">
                            <label htmlFor="event-description" className="text-sm font-medium text-foreground">{t("events.form.description")}</label>
                        </div>
                        <textarea
                            id="event-description"
                            {...register("description")}
                            aria-invalid={Boolean(errors.description)}
                            aria-describedby={errors.description ? "event-description-error" : undefined}
                            rows={6}
                            placeholder={t("events.form.descriptionPlaceholder")}
                            className={`w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary resize-none ${getFieldHighlightClass("description")}`}
                        />
                        {errors.description && (
                            <p id="event-description-error" role="alert" className="mt-1 text-xs text-destructive">{getLocalizedValidationMessage(errors.description.message)}</p>
                        )}
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                            <div className="mb-1.5 flex items-center justify-between gap-2">
                                <label htmlFor="event-category" className="block text-sm font-medium text-foreground">{t("events.form.category")}</label>
                                <button
                                    type="button"
                                    onClick={() => {
                                        toast.dismiss("event-form-validation");
                                        setCreateCategoryOpen(true);
                                    }}
                                    className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                                >
                                    <Plus className="h-3.5 w-3.5" />
                                    {t("events.form.createCategoryAction")}
                                </button>
                            </div>
                            <select
                                id="event-category"
                                {...register("category")}
                                aria-invalid={Boolean(errors.category)}
                                aria-describedby={errors.category ? "event-category-error" : undefined}
                                className={`w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm focus:border-primary focus:outline-none ${getFieldHighlightClass("category")}`}
                            >
                                <option value="">{t("events.form.selectCategory")}</option>
                                {categoryOptions.map((cat) => (
                                    <option key={cat.slug} value={cat.slug}>
                                        {cat.label || categoryLabel(cat.slug, locale)}
                                    </option>
                                ))}
                            </select>
                            {errors.category && (
                                <p id="event-category-error" role="alert" className="mt-1 text-xs text-destructive">{getLocalizedValidationMessage(errors.category.message)}</p>
                            )}
                            <CreateCategoryModal
                                open={createCategoryOpen}
                                onOpenChange={setCreateCategoryOpen}
                                onCreated={(cat) => {
                                    pendingCategorySelectionRef.current = cat.slug;
                                    setCategoryOptions((prev) =>
                                        prev.some((c) => c.slug === cat.slug) ? prev : [...prev, cat],
                                    );
                                    // Si ya estaba en las opciones no habrá un nuevo render; selección inmediata.
                                    if (categoryOptions.some((c) => c.slug === cat.slug)) {
                                        setValue("category", cat.slug, {
                                            shouldValidate: true,
                                            shouldDirty: true,
                                            shouldTouch: true,
                                        });
                                        pendingCategorySelectionRef.current = null;
                                    }
                                    clearErrors("category");
                                    setHighlightedField((current) =>
                                        current === "category" ? null : current,
                                    );
                                    toast.dismiss("event-form-validation");
                                }}
                            />
                        </div>

                        <div>
                            <p className="mb-1.5 text-sm font-medium text-foreground">{t("events.form.dateTime")}</p>
                            <input type="hidden" {...register("date")} />
                            <div className="grid grid-cols-[minmax(0,1fr)_minmax(8rem,0.72fr)] gap-2">
                                <div className="relative">
                                    <label htmlFor="event-date-part" className="sr-only">{t("events.form.date")}</label>
                                    <button
                                        type="button"
                                        onClick={() => openNativePicker(eventDateInputRef.current)}
                                        aria-label={t("events.form.chooseDate")}
                                        title={t("events.form.chooseDate")}
                                        className="absolute left-1.5 top-1/2 z-10 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                                    >
                                        <CalendarDays aria-hidden="true" className="h-4 w-4" />
                                    </button>
                                    <input
                                        ref={eventDateInputRef}
                                        id="event-date-part"
                                        type="date"
                                        value={eventDatePart}
                                        onChange={(e) => updateEventDateTime(e.target.value, eventTimePart)}
                                        aria-invalid={Boolean(errors.date)}
                                        aria-describedby={errors.date ? "event-date-error" : undefined}
                                        className={`w-full rounded-xl border border-border bg-background py-2.5 pl-9 pr-3 text-sm focus:border-primary focus:outline-none ${getFieldHighlightClass("date")}`}
                                    />
                                </div>
                                <div ref={timePickerRef} className="relative">
                                    <label htmlFor="event-time-part" className="sr-only">{t("events.form.time")}</label>
                                    <button
                                        type="button"
                                        onClick={() => setTimePickerOpen((open) => !open)}
                                        aria-label={t("events.form.chooseTime")}
                                        title={t("events.form.chooseTime")}
                                        aria-expanded={timePickerOpen}
                                        aria-controls="event-time-picker"
                                        className="absolute left-1.5 top-1/2 z-10 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                                    >
                                        <Clock3 aria-hidden="true" className="h-4 w-4" />
                                    </button>
                                    <input
                                        ref={eventTimeInputRef}
                                        id="event-time-part"
                                        type="time"
                                        value={eventTimePart}
                                        onChange={(e) => updateEventDateTime(eventDatePart, e.target.value)}
                                        aria-invalid={Boolean(errors.date)}
                                        aria-describedby={errors.date ? "event-date-error" : undefined}
                                        className={`w-full rounded-xl border border-border bg-background py-2.5 pl-9 pr-3 text-sm focus:border-primary focus:outline-none ${getFieldHighlightClass("date")}`}
                                    />
                                    {timePickerOpen && (
                                        <div
                                            id="event-time-picker"
                                            role="dialog"
                                            aria-label={t("events.form.chooseTime")}
                                            className="absolute right-0 top-[calc(100%+0.5rem)] z-40 w-80 max-w-[calc(100vw-2rem)] rounded-xl border border-border bg-popover p-3 text-popover-foreground shadow-xl"
                                        >
                                            <div className="grid grid-cols-3 gap-2">
                                                <label className="space-y-1 text-xs font-medium">
                                                    <span>{t("events.form.hour")}</span>
                                                    <select
                                                        value={selectedHour12}
                                                        onChange={(e) =>
                                                            updateEventDateTime(
                                                                eventDatePart,
                                                                to24HourTime(
                                                                    e.target.value,
                                                                    eventTimePart.slice(3, 5) || "00",
                                                                    selectedPeriod,
                                                                ),
                                                            )
                                                        }
                                                        className="w-full rounded-lg border border-border bg-background px-2 py-2 text-sm focus:border-primary focus:outline-none"
                                                        autoFocus
                                                    >
                                                        <option value="">--</option>
                                                        {EVENT_HOUR_OPTIONS.map((hour) => (
                                                            <option key={hour} value={hour}>{hour}</option>
                                                        ))}
                                                    </select>
                                                </label>
                                                <label className="space-y-1 text-xs font-medium">
                                                    <span>{t("events.form.minute")}</span>
                                                    <select
                                                        value={eventTimePart.slice(3, 5)}
                                                        onChange={(e) =>
                                                            updateEventDateTime(
                                                                eventDatePart,
                                                                to24HourTime(
                                                                    selectedHour12 || "12",
                                                                    e.target.value,
                                                                    selectedPeriod,
                                                                ),
                                                            )
                                                        }
                                                        className="w-full rounded-lg border border-border bg-background px-2 py-2 text-sm focus:border-primary focus:outline-none"
                                                    >
                                                        <option value="">--</option>
                                                        {EVENT_MINUTE_OPTIONS.map((minute) => (
                                                            <option key={minute} value={minute}>{minute}</option>
                                                        ))}
                                                    </select>
                                                </label>
                                                <label className="space-y-1 text-xs font-medium">
                                                    <span>{t("events.form.period")}</span>
                                                    <select
                                                        value={selectedPeriod}
                                                        onChange={(e) =>
                                                            updateEventDateTime(
                                                                eventDatePart,
                                                                to24HourTime(
                                                                    selectedHour12 || "12",
                                                                    eventTimePart.slice(3, 5) || "00",
                                                                    e.target.value as "AM" | "PM",
                                                                ),
                                                            )
                                                        }
                                                        className="w-full rounded-lg border border-border bg-background px-2 py-2 text-sm focus:border-primary focus:outline-none"
                                                    >
                                                        <option value="AM">AM</option>
                                                        <option value="PM">PM</option>
                                                    </select>
                                                </label>
                                            </div>
                                            <p className="mt-2 text-[11px] leading-4 text-muted-foreground">
                                                {t("events.form.timeFormatHelp")}
                                            </p>
                                            <button
                                                type="button"
                                                onClick={() => setTimePickerOpen(false)}
                                                className="mt-3 w-full rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90"
                                            >
                                                {t("events.form.timePickerDone")}
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                            {errors.date && (
                                <p id="event-date-error" role="alert" className="mt-1 text-xs text-destructive">
                                    {eventDatePart && !eventTimePart
                                        ? t("events.form.validation.timeRequired")
                                        : getLocalizedValidationMessage(errors.date.message)}
                                </p>
                            )}
                        </div>
                    </div>

                    <div>
                        <div className="mb-2 flex items-center gap-3">
                            <label htmlFor={isVirtual ? "event-virtual-link" : "event-location"} className="text-sm font-medium text-foreground">
                                {isVirtual ? t("events.form.meetingLink") : t("events.form.venueAddress")}
                            </label>
                            <label className="flex items-center gap-1.5 text-sm text-muted-foreground">
                                <input
                                    id="event-virtual-toggle"
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
                                    id="event-virtual-link"
                                    {...register("virtualLink")}
                                    aria-invalid={Boolean(errors.virtualLink)}
                                    aria-describedby={errors.virtualLink ? "event-virtual-link-error" : "event-virtual-link-help"}
                                    placeholder={t("events.form.meetingLinkPlaceholder")}
                                    className={`w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm focus:border-primary focus:outline-none ${getFieldHighlightClass("virtualLink")}`}
                                />
                                <p id="event-virtual-link-help" className="mt-1 text-xs text-muted-foreground">
                                    {t("events.form.meetingLinkHelp")}
                                </p>
                                {errors.virtualLink && (
                                    <p id="event-virtual-link-error" role="alert" className="mt-1 text-xs text-destructive">{getLocalizedValidationMessage(errors.virtualLink.message)}</p>
                                )}
                                {planMaxAttendees != null && (
                                    <p className="mt-2 text-xs text-muted-foreground">
                                        {t("events.form.virtualCapacityHelpPlan", { max: planMaxAttendees })}
                                    </p>
                                )}
                            </div>
                        ) : (
                            <div key="physical-fields">
                                <div className="relative">
                                    <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                    <input
                                        id="event-location"
                                        {...register("location")}
                                        aria-invalid={Boolean(errors.location)}
                                        aria-describedby={errors.location ? "event-location-error" : undefined}
                                        placeholder={t("events.form.venuePlaceholder")}
                                        className={`w-full rounded-xl border border-border bg-background pl-9 pr-4 py-2.5 text-sm focus:border-primary focus:outline-none ${getFieldHighlightClass("location")}`}
                                    />
                                </div>
                                {errors.location && (
                                    <p id="event-location-error" role="alert" className="mt-1 text-xs text-destructive">{getLocalizedValidationMessage(errors.location.message)}</p>
                                )}
                            </div>
                        )}
                    </div>

                    {!isVirtual && (
                        <div>
                            <label htmlFor="event-capacity" className="mb-1.5 block text-sm font-medium text-foreground">
                                {t("events.form.capacity")} <span className="font-normal text-muted-foreground">{t("events.form.optional")}</span>
                            </label>
                            <input
                                id="event-capacity"
                                type="number"
                                {...capacityField}
                                onChange={handleCapacityChange}
                                onBlur={handleCapacityBlur}
                                placeholder={
                                    planMaxAttendees != null
                                        ? t("events.form.capacityPlaceholderPlan", { max: planMaxAttendees })
                                        : t("events.form.capacityPlaceholder")
                                }
                                min={1}
                                max={planMaxAttendees ?? undefined}
                                inputMode="numeric"
                                aria-invalid={Boolean(errors.capacity)}
                                aria-describedby={errors.capacity ? "event-capacity-help event-capacity-error" : "event-capacity-help"}
                                className={`w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm focus:border-primary focus:outline-none ${getFieldHighlightClass("capacity")}`}
                            />
                            <p id="event-capacity-help" className="mt-1 text-xs text-muted-foreground">
                                {planMaxAttendees != null
                                    ? t("events.form.capacityHelpPlan", { max: planMaxAttendees })
                                    : t("events.form.capacityHelp")}
                            </p>
                            {errors.capacity && (
                                <p id="event-capacity-error" role="alert" className="mt-1 text-xs text-destructive">{getLocalizedValidationMessage(errors.capacity.message)}</p>
                            )}
                        </div>
                    )}

                    <div>
                        <label htmlFor="event-price" className="mb-1.5 block text-sm font-medium text-foreground">
                            {t("events.form.price")} <span className="font-normal text-muted-foreground">{t("events.form.optional")}</span>
                        </label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">S/</span>
                            <input
                                id="event-price"
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

                    {!!watchedPrice && Number(watchedPrice) > 0 && (
                        <div className="space-y-3 rounded-xl border border-border p-4 md:col-span-2">
                            <div>
                                <h3 className="text-sm font-semibold text-foreground">{t("events.form.holdSettingsTitle")}</h3>
                                <p className="mt-0.5 text-xs text-muted-foreground">{t("events.form.holdSettingsHelp")}</p>
                            </div>
                            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                                <div>
                                    <label className="mb-1 block text-xs font-medium text-foreground">{t("events.form.holdMinutesCard")}</label>
                                    <input
                                        type="number"
                                        min={5}
                                        max={120}
                                        {...register("holdMinutesCard", { valueAsNumber: true })}
                                        className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="mb-1 block text-xs font-medium text-foreground">{t("events.form.holdHoursManual")}</label>
                                    <input
                                        type="number"
                                        min={1}
                                        max={72}
                                        {...register("holdHoursManual", { valueAsNumber: true })}
                                        className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="mb-1 block text-xs font-medium text-foreground">{t("events.form.nearEventHoldMinutes")}</label>
                                    <input
                                        type="number"
                                        min={5}
                                        max={60}
                                        {...register("nearEventHoldMinutes", { valueAsNumber: true })}
                                        className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="mb-1 block text-xs font-medium text-foreground">{t("events.form.nearEventWindowHours")}</label>
                                    <input
                                        type="number"
                                        min={1}
                                        max={168}
                                        {...register("nearEventWindowHours", { valueAsNumber: true })}
                                        className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="mb-1 block text-xs font-medium text-foreground">{t("events.form.salesCutoffHoursBefore")}</label>
                                    <input
                                        type="number"
                                        min={1}
                                        max={168}
                                        {...register("salesCutoffHoursBefore", {
                                            setValueAs: (v) => {
                                                if (v === "" || v == null) return null;
                                                const n = Number(v);
                                                return Number.isNaN(n) ? null : n;
                                            },
                                        })}
                                        placeholder={t("events.form.salesCutoffPlaceholder")}
                                        className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {selectablePaymentMethods.length > 0 && !!watchedPrice && Number(watchedPrice) > 0 && (
                        <div className="rounded-xl border border-border p-4 space-y-3">
                            <h3 className="text-sm font-semibold text-foreground">{t("events.form.paymentMethodsTitle")}</h3>
                            <p className="text-xs text-muted-foreground">{t("events.form.paymentMethodsHelp")}</p>
                            <div className="flex flex-wrap gap-2">
                                {selectablePaymentMethods.map((pm) => {
                                    const selected = selectedPaymentMethodIds.includes(pm.id);
                                    const IconMap: Record<string, React.ComponentType<{ className?: string }>> = {
                                        yape: Smartphone,
                                        plin: QrCode,
                                        cash: Wallet,
                                        culqi: CreditCard,
                                    };
                                    const PmIcon = IconMap[pm.type] ?? Wallet;
                                    const isLegacy = pm.type === "yape" || pm.type === "plin";
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
                                            {isLegacy && (
                                                <span className="text-[10px] uppercase text-amber-700">Legacy</span>
                                            )}
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
                        <label htmlFor="event-status" className="mb-1.5 block text-sm font-medium text-foreground">{t("events.form.status")}</label>
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
                            <p id="event-status-error" role="alert" className="mt-1 text-xs text-destructive">{getLocalizedValidationMessage(errors.status.message)}</p>
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
