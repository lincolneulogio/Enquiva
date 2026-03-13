"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { createEventSchema, type CreateEventInput } from "@/lib/validations";
import { createEvent, updateEvent } from "@/actions/events";
import { AIDescriptionGenerator } from "./AIDescriptionGenerator";
import { UploadButton } from "@/lib/uploadthing/components";
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
    const [showAI, setShowAI] = useState(false);
    const todayISO = new Date().toISOString().slice(0, 16);

    const {
        register,
        handleSubmit,
        watch,
        setValue,
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

    const title = watch("title");
    const category = watch("category");
    const isVirtual = watch("isVirtual");
    const hasTransport = watch("hasTransport");

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
                    toast.success(event ? t("events.form.eventUpdated") : t("events.form.eventCreated"));
                    router.push(redirectPath);
                }
            } catch (err) {
                toast.error(err instanceof Error ? err.message : t("events.form.genericError"));
            }
        });
    };

    const onInvalid = (errs: FieldErrors<CreateEventInput>) => {
        const first = Object.values(errs).find(
            (e): e is { message?: string } => typeof e === "object" && e !== null && "message" in e
        );
        toast.error(first?.message ?? t("events.form.requiredFieldsError"));
    };

    return (
        <form
            onSubmit={handleSubmit(onSubmit, onInvalid)}
            className="space-y-8"
            translate="no"
            data-gramm="false"
            data-gramm_editor="false"
        >
            <div className="grid gap-8 lg:grid-cols-3">
                <div className="space-y-6 lg:col-span-2">
                    <div>
                        <label className="mb-1.5 block text-sm font-medium text-foreground">
                            {t("events.form.eventTitle")}
                        </label>
                        <input
                            {...register("title")}
                            placeholder={t("events.form.eventTitlePlaceholder")}
                            className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                        />
                        {errors.title && (
                            <p className="mt-1 text-xs text-destructive">{errors.title.message}</p>
                        )}
                    </div>

                    <div>
                        <div className="mb-1.5 flex items-center justify-between">
                            <label className="text-sm font-medium text-foreground">{t("events.form.description")}</label>
                            <button
                                type="button"
                                onClick={() => setShowAI(!showAI)}
                                className="text-xs text-primary hover:underline"
                            >
                                {t("events.form.aiGenerate")}
                            </button>
                        </div>
                        {showAI && title && category && (
                            <div className="mb-3">
                                <AIDescriptionGenerator
                                    title={title}
                                    category={category}
                                    onGenerated={(desc) =>
                                        setValue("description", desc, {
                                            shouldValidate: true,
                                            shouldDirty: true,
                                            shouldTouch: true,
                                        })
                                    }
                                />
                            </div>
                        )}
                        {showAI && (!title || !category) && (
                            <p className="mb-3 rounded-lg bg-secondary px-4 py-2 text-xs text-muted-foreground">
                                {t("events.form.aiHint")}
                            </p>
                        )}
                        <textarea
                            {...register("description")}
                            rows={6}
                            placeholder={t("events.form.descriptionPlaceholder")}
                            className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary resize-none"
                        />
                        {errors.description && (
                            <p className="mt-1 text-xs text-destructive">{errors.description.message}</p>
                        )}
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                            <label className="mb-1.5 block text-sm font-medium text-foreground">{t("events.form.category")}</label>
                            <select
                                {...register("category")}
                                className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm focus:border-primary focus:outline-none"
                            >
                                <option value="">{t("events.form.selectCategory")}</option>
                                {categories.map((cat) => (
                                    <option key={cat.slug} value={cat.slug}>
                                        {cat.label}
                                    </option>
                                ))}
                            </select>
                            {errors.category && (
                                <p className="mt-1 text-xs text-destructive">{errors.category.message}</p>
                            )}
                        </div>

                        <div>
                            <label className="mb-1.5 block text-sm font-medium text-foreground">{t("events.form.dateTime")}</label>
                            <input
                                type="datetime-local"
                                {...register("date")}
                                min={todayISO}
                                className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm focus:border-primary focus:outline-none"
                            />
                            {errors.date && (
                                <p className="mt-1 text-xs text-destructive">{errors.date.message}</p>
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
                                    className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm focus:border-primary focus:outline-none"
                                />
                                <p className="mt-1 text-xs text-muted-foreground">
                                    {t("events.form.meetingLinkHelp")}
                                </p>
                                {errors.virtualLink && (
                                    <p className="mt-1 text-xs text-destructive">{errors.virtualLink.message}</p>
                                )}
                            </div>
                        ) : (
                            <div key="physical-fields">
                                <div className="relative">
                                    <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                    <input
                                        {...register("location")}
                                        placeholder={t("events.form.venuePlaceholder")}
                                        className="w-full rounded-xl border border-border bg-background pl-9 pr-4 py-2.5 text-sm focus:border-primary focus:outline-none"
                                    />
                                </div>
                                {errors.location && (
                                    <p className="mt-1 text-xs text-destructive">{errors.location.message}</p>
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
                                className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm focus:border-primary focus:outline-none"
                            />
                            <p className="mt-1 text-xs text-muted-foreground">
                                {t("events.form.capacityHelp")}
                            </p>
                            {errors.capacity && (
                                <p className="mt-1 text-xs text-destructive">{errors.capacity.message}</p>
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
                                        className="absolute right-2 top-2 rounded-lg bg-background/80 px-2 py-1 text-xs hover:bg-background"
                                    >
                                        {t("events.form.removeImage")}
                                    </button>
                                </div>
                            ) : (
                                <div className="flex h-40 flex-col items-center justify-center gap-2 text-muted-foreground">
                                    <ImageIcon className="h-8 w-8 opacity-40" />
                                    <UploadButton
                                        endpoint="eventCoverImage"
                                        onClientUploadComplete={(res) => {
                                            if (res[0]) setCoverImage(res[0].url);
                                        }}
                                        onUploadError={(err) => {
                                            toast.error(err.message);
                                        }}
                                        appearance={{
                                            button: "bg-primary text-primary-foreground text-sm px-4 py-2 rounded-lg",
                                        }}
                                    />
                                </div>
                            )}
                        </div>
                    </div>

                    <div>
                        <label className="mb-1.5 block text-sm font-medium text-foreground">{t("events.form.status")}</label>
                        <select
                            {...register("status")}
                            className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm focus:border-primary focus:outline-none"
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
