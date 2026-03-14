"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { createEventSchema, type CreateEventInput } from "@/lib/validations";
import { createEvent, updateEvent } from "@/actions/events";
import { UploadDropzone } from "@/lib/uploadthing/components";
import { toast } from "sonner";
import { Loader2, ImageIcon, MapPin, Video, Star, Bus } from "lucide-react";
import Image from "next/image";
import type { Event } from "@/lib/db/schema";
import type { FieldErrors } from "react-hook-form";
import { useTranslations } from "@/components/providers/LocaleProvider";

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
}

const EVENT_DRAFT_STORAGE_KEY = "faithEvents.eventDraft.create";

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
}: EventFormProps) {
    const t = useTranslations();
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [coverImage, setCoverImage] = useState<string | null>(event?.coverImage ?? null);
    const [highlightedField, setHighlightedField] = useState<keyof CreateEventInput | null>(null);
    const highlightTimeoutRef = useRef<number | null>(null);

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
                status: event.status,
                isFeatured: event.isFeatured,
                hasTransport: event.hasTransport,
            }
            : { status: "draft", isVirtual: false, isFeatured: false, hasTransport: false },
    });

    const isVirtual = watch("isVirtual");
    const hasTransport = watch("hasTransport");

    useEffect(() => {
        if (event) return;

        try {
            const raw = localStorage.getItem(EVENT_DRAFT_STORAGE_KEY);
            if (!raw) return;

            const parsed = JSON.parse(raw) as {
                values?: Partial<CreateEventInput>;
                coverImage?: string | null;
            };

            if (parsed.values) {
                reset({
                    status: "draft",
                    isVirtual: false,
                    isFeatured: false,
                    hasTransport: false,
                    ...parsed.values,
                });
            }

            if (parsed.coverImage !== undefined) {
                setCoverImage(parsed.coverImage);
            }
        } catch {
            // Ignore malformed draft data
        }
    }, [event, reset]);

    useEffect(() => {
        if (event) return;

        const subscription = watch((values) => {
            try {
                localStorage.setItem(
                    EVENT_DRAFT_STORAGE_KEY,
                    JSON.stringify({
                        values,
                        coverImage,
                        savedAt: Date.now(),
                    })
                );
            } catch {
                // Ignore storage issues
            }
        });

        return () => subscription.unsubscribe();
    }, [event, watch, coverImage]);

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
                    if (!event) {
                        try {
                            localStorage.removeItem(EVENT_DRAFT_STORAGE_KEY);
                        } catch {
                            // Ignore storage issues
                        }
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
            "h-32 w-full rounded-xl border border-dashed border-primary/25 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-3 transition-colors hover:border-primary/40 hover:from-primary/15",
        uploadIcon: "h-6 w-6 text-primary/80",
        label: "text-sm font-semibold text-foreground",
        allowedContent: "text-[11px] text-muted-foreground",
        button:
            "mt-2 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground transition hover:bg-primary/90",
    };

    return (
        <form
            onSubmit={handleSubmit(onSubmit, onInvalid)}
            className="space-y-8"
            translate="no"
            data-gramm="false"
            data-gramm_editor="false"
        >
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
                                        {cat.label}
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
                                        if (value === "" || value === null || value === undefined) return undefined;
                                        const num = Number(value);
                                        return Number.isNaN(num) ? undefined : num;
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
                </div>

                <div className="space-y-6">
                    <div>
                        <label className="mb-1.5 block text-sm font-medium text-foreground">{t("events.form.coverImage")}</label>
                        <div className="overflow-hidden rounded-xl border border-border bg-secondary">
                            {coverImage ? (
                                <div className="relative">
                                    <Image
                                        src={coverImage}
                                        alt="Cover"
                                        width={400}
                                        height={200}
                                        className="h-40 w-full object-cover"
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
                                <div className="flex h-72 flex-col items-center justify-center gap-2 px-4 text-center text-muted-foreground">
                                    <div className="rounded-full bg-primary/10 p-2.5">
                                        <ImageIcon className="h-5 w-5 text-primary animate-pulse" />
                                    </div>
                                    <p className="text-sm text-muted-foreground">{t("events.form.coverImage")}</p>
                                    <UploadDropzone
                                        endpoint="eventCoverImage"
                                        onClientUploadComplete={(res) => {
                                            if (res[0]) setCoverImage(res[0].url);
                                        }}
                                        onUploadError={(err) => {
                                            toast.error(err.message);
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

                    <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-border p-4">
                        <input
                            type="checkbox"
                            {...register("hasTransport")}
                            className="mt-0.5 rounded border-border"
                        />
                        <div>
                            <div className="flex items-center gap-1.5">
                                <Bus className="h-3.5 w-3.5 text-blue-500" />
                                <p className="text-sm font-medium text-foreground">{t("events.form.offerTransport")}</p>
                            </div>
                            <p className="text-xs text-muted-foreground">
                                {hasTransport
                                    ? t("events.form.transportEnabledHelp")
                                    : t("events.form.transportDisabledHelp")}
                            </p>
                        </div>
                    </label>

                    <button
                        type="submit"
                        disabled={isPending}
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
