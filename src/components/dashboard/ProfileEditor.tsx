"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { updateCurrentUserPassword, updateCurrentUserProfile } from "@/actions/profile";
import {
    updatePasswordSchema,
    updateProfileSchema,
    type UpdatePasswordInput,
    type UpdateProfileInput,
} from "@/lib/validations";
import { UploadDropzone } from "@/lib/uploadthing/components";
import { Eye, EyeOff, Loader2, Mail, Shield, User, ImageIcon, LockKeyhole, Phone } from "lucide-react";
import { useLocale, useTranslations } from "@/components/providers/LocaleProvider";
import { getRoleLabel } from "@/lib/i18n/core";

interface ProfileEditorProps {
    user: {
        name: string;
        email: string;
        role: string;
        phone: string | null;
        bio: string | null;
        image: string | null;
    };
}

const AVATAR_SIZE = 512;

function getPasswordStrength(password: string) {
    let score = 0;
    if (password.length >= 8) score += 1;
    if (/[A-Z]/.test(password)) score += 1;
    if (/[a-z]/.test(password)) score += 1;
    if (/[0-9]/.test(password)) score += 1;
    if (/[^A-Za-z0-9]/.test(password)) score += 1;

    if (!password) {
        return { score: 0, label: "Sin contraseña", color: "bg-muted" };
    }
    if (score <= 2) {
        return { score, label: "Débil", color: "bg-red-500" };
    }
    if (score <= 4) {
        return { score, label: "Media", color: "bg-amber-500" };
    }
    return { score, label: "Fuerte", color: "bg-emerald-500" };
}

async function loadImageFromFile(file: File) {
    const objectUrl = URL.createObjectURL(file);
    try {
        const image = await new Promise<HTMLImageElement>((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = () => reject(new Error("IMAGE_READ_ERROR"));
            img.src = objectUrl;
        });
        return image;
    } finally {
        URL.revokeObjectURL(objectUrl);
    }
}

async function optimizeAvatarFile(file: File) {
    const image = await loadImageFromFile(file);
    const sourceWidth = image.naturalWidth || image.width;
    const sourceHeight = image.naturalHeight || image.height;
    const side = Math.min(sourceWidth, sourceHeight);
    const offsetX = Math.floor((sourceWidth - side) / 2);
    const offsetY = Math.floor((sourceHeight - side) / 2);

    const canvas = document.createElement("canvas");
    canvas.width = AVATAR_SIZE;
    canvas.height = AVATAR_SIZE;

    const ctx = canvas.getContext("2d");
    if (!ctx) {
        throw new Error("IMAGE_PROCESS_ERROR");
    }

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(
        image,
        offsetX,
        offsetY,
        side,
        side,
        0,
        0,
        AVATAR_SIZE,
        AVATAR_SIZE
    );

    const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
            (result) => {
                if (!result) {
                    reject(new Error("AVATAR_GENERATE_ERROR"));
                    return;
                }
                resolve(result);
            },
            "image/webp",
            0.9
        );
    });

    const fileName = file.name.replace(/\.[^/.]+$/, "") || "avatar";
    return new File([blob], `${fileName}-square.webp`, {
        type: "image/webp",
        lastModified: Date.now(),
    });
}

async function optimizeAvatarFiles(files: File[]) {
    try {
        return await Promise.all(files.map((file) => optimizeAvatarFile(file)));
    } catch {
        return files;
    }
}

export function ProfileEditor({ user }: ProfileEditorProps) {
    const router = useRouter();
    const t = useTranslations();
    const { locale } = useLocale();
    const [isProfilePending, startProfileTransition] = useTransition();
    const [isPasswordPending, startPasswordTransition] = useTransition();
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const {
        register,
        handleSubmit,
        watch,
        setValue,
        formState: { errors },
    } = useForm<UpdateProfileInput>({
        resolver: zodResolver(updateProfileSchema),
        defaultValues: {
            name: user.name ?? "",
            phone: user.phone ?? "",
            bio: user.bio ?? "",
            image: user.image ?? "",
        },
    });

    const previewImage = watch("image") || user.image;
    const initials = (watch("name") || user.name || "U").charAt(0).toUpperCase();

    const {
        register: registerPassword,
        handleSubmit: handlePasswordSubmit,
        reset: resetPasswordForm,
        watch: watchPassword,
        formState: { errors: passwordErrors },
    } = useForm<UpdatePasswordInput>({
        resolver: zodResolver(updatePasswordSchema),
        defaultValues: {
            currentPassword: "",
            newPassword: "",
            confirmPassword: "",
        },
    });

    const newPasswordValue = watchPassword("newPassword") ?? "";
    const passwordStrength = getPasswordStrength(newPasswordValue);
    const localizedPasswordStrength =
        passwordStrength.label === "Sin contraseña"
            ? t("dashboard.profile.noPassword")
            : passwordStrength.label === "Débil"
                ? t("dashboard.profile.weak")
                : passwordStrength.label === "Media"
                    ? t("dashboard.profile.medium")
                    : t("dashboard.profile.strong");

    const onSubmit = (data: UpdateProfileInput) => {
        startProfileTransition(async () => {
            try {
                await updateCurrentUserProfile({
                    ...data,
                    phone: data.phone?.trim() ? data.phone : null,
                    bio: data.bio?.trim() ? data.bio : null,
                    image: data.image?.trim() ? data.image : null,
                });
                toast.success(t("dashboard.profile.profileUpdated"));
                router.refresh();
            } catch (error) {
                toast.error(error instanceof Error ? error.message : t("dashboard.profile.profileUpdateError"));
            }
        });
    };

    const onSubmitPassword = (data: UpdatePasswordInput) => {
        startPasswordTransition(async () => {
            try {
                await updateCurrentUserPassword(data);
                toast.success(t("dashboard.profile.passwordUpdated"));
                resetPasswordForm();
            } catch (error) {
                toast.error(error instanceof Error ? error.message : t("dashboard.profile.passwordUpdateError"));
            }
        });
    };

    const uploadDropzoneAppearance = {
        container:
            "h-full w-full rounded-2xl border border-dashed border-primary/30 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-3 transition-colors hover:border-primary/50 hover:from-primary/15",
        uploadIcon: "h-6 w-6 text-primary/80",
        label: "text-sm font-semibold text-foreground",
        allowedContent: "text-[11px] text-muted-foreground",
        button:
            "mt-2 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground transition hover:bg-primary/90",
    };

    return (
        <div className="max-w-2xl space-y-6">
            <div className="flex items-center gap-5 rounded-xl border border-border bg-card p-6">
                <div className="relative flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary/10 text-2xl font-semibold text-primary">
                    {previewImage ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={previewImage} alt={t("common.profile")} className="h-full w-full object-cover" />
                    ) : (
                        initials
                    )}
                </div>
                <div>
                    <p className="text-xl font-semibold text-foreground">{watch("name") || user.name}</p>
                    <p className="text-sm text-muted-foreground">{user.email}</p>
                    <span className="mt-1 inline-flex items-center rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium text-foreground capitalize">
                        {getRoleLabel(user.role, locale)}
                    </span>
                </div>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 rounded-xl border border-border bg-card p-6">
                <div>
                    <label className="mb-1.5 block text-sm font-medium text-foreground">{t("common.fullName")} *</label>
                    <input
                        {...register("name")}
                        placeholder={t("common.fullName")}
                        className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm focus:border-primary focus:outline-none"
                    />
                    {errors.name && <p className="mt-1 text-xs text-destructive">{errors.name.message}</p>}
                </div>

                <div>
                    <label className="mb-1.5 flex items-center gap-2 text-sm font-medium text-foreground">
                        <Phone className="h-4 w-4" />
                        {t("profile.phoneLabel")}
                    </label>
                    <input
                        {...register("phone")}
                        placeholder={t("profile.phonePlaceholder")}
                        className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm focus:border-primary focus:outline-none"
                    />
                    <p className="mt-1 text-xs text-muted-foreground">
                        {t("profile.phoneHint")}
                    </p>
                    {errors.phone && <p className="mt-1 text-xs text-destructive">{errors.phone.message}</p>}
                </div>

                <div className="space-y-2">
                    <label className="block text-sm font-medium text-foreground">{t("dashboard.profile.profilePhoto")}</label>

                    <div className="rounded-xl border border-border bg-background p-4">
                        <div className="flex flex-col items-center gap-4 sm:flex-row sm:flex-wrap sm:items-start sm:justify-center sm:gap-5">
                            <div className="shrink-0">
                                <div className="relative h-40 w-40 overflow-hidden rounded-2xl border border-border bg-secondary sm:h-44 sm:w-44">
                                    {previewImage ? (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img src={previewImage} alt={t("dashboard.profile.profilePhoto")} className="h-full w-full object-cover" />
                                    ) : (
                                        <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-muted-foreground">
                                            <div className="rounded-full bg-primary/15 p-2">
                                                <ImageIcon className="h-5 w-5 text-primary animate-pulse" />
                                            </div>
                                            <span className="text-sm">{t("dashboard.profile.uploadProfilePhoto")}</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="w-full max-w-[320px] space-y-3">
                                <div className="w-full">
                                    <div className="h-28 sm:h-28">
                                        <UploadDropzone
                                            endpoint="profileAvatar"
                                            onBeforeUploadBegin={optimizeAvatarFiles}
                                            onClientUploadComplete={(res) => {
                                                if (res?.[0]?.url) {
                                                    setValue("image", res[0].url, {
                                                        shouldDirty: true,
                                                        shouldTouch: true,
                                                        shouldValidate: true,
                                                    });
                                                    toast.success(t("dashboard.profile.avatarUploaded"));
                                                }
                                            }}
                                            onUploadError={(err) => {
                                                toast.error(err.message);
                                            }}
                                            appearance={uploadDropzoneAppearance}
                                        />
                                    </div>
                                </div>

                                {previewImage ? (
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setValue("image", "", {
                                                shouldDirty: true,
                                                shouldTouch: true,
                                                shouldValidate: true,
                                            })
                                        }
                                        className="w-full rounded-xl border border-border px-3 py-2 text-sm font-medium text-foreground transition hover:bg-muted"
                                    >
                                        {t("dashboard.profile.removeAvatar")}
                                    </button>
                                ) : null}
                            </div>
                        </div>
                    </div>

                    <p className="text-xs text-muted-foreground">
                        {t("dashboard.profile.optionalManualUrl")}
                    </p>
                    <input
                        {...register("image")}
                        placeholder={t("profile.avatarUrlPlaceholder")}
                        className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm focus:border-primary focus:outline-none"
                    />
                    {errors.image && <p className="mt-1 text-xs text-destructive">{errors.image.message}</p>}
                </div>

                <div>
                    <label className="mb-1.5 block text-sm font-medium text-foreground">{t("dashboard.profile.bio")}</label>
                    <textarea
                        {...register("bio")}
                        rows={4}
                        placeholder={t("dashboard.profile.tellUsAboutYou")}
                        className="w-full resize-none rounded-xl border border-border bg-background px-4 py-2.5 text-sm focus:border-primary focus:outline-none"
                    />
                    {errors.bio && <p className="mt-1 text-xs text-destructive">{errors.bio.message}</p>}
                </div>

                <div className="rounded-xl border border-border bg-background p-4">
                    <div className="space-y-3">
                        <div className="flex items-center gap-3 text-sm text-muted-foreground">
                            <Mail className="h-4 w-4" />
                            <span>{t("common.email")}:</span>
                            <span className="font-medium text-foreground">{user.email}</span>
                        </div>
                        <div className="flex items-center gap-3 text-sm text-muted-foreground">
                            <Shield className="h-4 w-4" />
                            <span>{t("common.role")}:</span>
                            <span className="font-medium capitalize text-foreground">{getRoleLabel(user.role, locale)}</span>
                        </div>
                        <div className="flex items-center gap-3 text-sm text-muted-foreground">
                            <User className="h-4 w-4" />
                            <span>{t("common.account")}:</span>
                            <span className="font-medium text-foreground">{t("dashboard.profile.accountInfoEditable")}</span>
                        </div>
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={isProfilePending}
                    className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-70"
                >
                    {isProfilePending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                    {isProfilePending ? t("common.saving") : t("common.saveChanges")}
                </button>
            </form>

            <form
                onSubmit={handlePasswordSubmit(onSubmitPassword)}
                className="space-y-5 rounded-xl border border-border bg-card p-6"
            >
                <div className="flex items-center gap-2">
                    <LockKeyhole className="h-4 w-4 text-primary" />
                    <h3 className="text-base font-semibold text-foreground">{t("dashboard.profile.updatePassword")}</h3>
                </div>

                <div>
                    <label className="mb-1.5 block text-sm font-medium text-foreground">{t("dashboard.profile.currentPassword")}</label>
                    <div className="relative">
                        <input
                            type={showCurrentPassword ? "text" : "password"}
                            {...registerPassword("currentPassword")}
                            placeholder={t("dashboard.profile.enterCurrentPassword")}
                            className="w-full rounded-xl border border-border bg-background px-4 py-2.5 pr-11 text-sm focus:border-primary focus:outline-none"
                        />
                        <button
                            type="button"
                            onClick={() => setShowCurrentPassword((prev) => !prev)}
                            className="absolute inset-y-0 right-2 my-auto h-8 rounded-lg px-2 text-muted-foreground hover:bg-muted"
                            aria-label={showCurrentPassword ? t("dashboard.profile.hideCurrentPassword") : t("dashboard.profile.showCurrentPassword")}
                        >
                            {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                    </div>
                    {passwordErrors.currentPassword && (
                        <p className="mt-1 text-xs text-destructive">{passwordErrors.currentPassword.message}</p>
                    )}
                </div>

                <div>
                    <label className="mb-1.5 block text-sm font-medium text-foreground">{t("dashboard.profile.newPassword")}</label>
                    <div className="relative">
                        <input
                            type={showNewPassword ? "text" : "password"}
                            {...registerPassword("newPassword")}
                            placeholder={t("dashboard.profile.newPasswordHint")}
                            className="w-full rounded-xl border border-border bg-background px-4 py-2.5 pr-11 text-sm focus:border-primary focus:outline-none"
                        />
                        <button
                            type="button"
                            onClick={() => setShowNewPassword((prev) => !prev)}
                            className="absolute inset-y-0 right-2 my-auto h-8 rounded-lg px-2 text-muted-foreground hover:bg-muted"
                            aria-label={showNewPassword ? t("dashboard.profile.hideNewPassword") : t("dashboard.profile.showNewPassword")}
                        >
                            {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                    </div>
                    <div className="mt-2 space-y-1">
                        <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                            <div
                                className={`h-full transition-all ${passwordStrength.color}`}
                                style={{ width: `${Math.max((passwordStrength.score / 5) * 100, 8)}%` }}
                            />
                        </div>
                        <p className="text-xs text-muted-foreground">{t("dashboard.profile.passwordStrength", { label: localizedPasswordStrength })}</p>
                    </div>
                    {passwordErrors.newPassword && (
                        <p className="mt-1 text-xs text-destructive">{passwordErrors.newPassword.message}</p>
                    )}
                </div>

                <div>
                    <label className="mb-1.5 block text-sm font-medium text-foreground">{t("dashboard.profile.confirmNewPassword")}</label>
                    <div className="relative">
                        <input
                            type={showConfirmPassword ? "text" : "password"}
                            {...registerPassword("confirmPassword")}
                            placeholder={t("dashboard.profile.repeatNewPassword")}
                            className="w-full rounded-xl border border-border bg-background px-4 py-2.5 pr-11 text-sm focus:border-primary focus:outline-none"
                        />
                        <button
                            type="button"
                            onClick={() => setShowConfirmPassword((prev) => !prev)}
                            className="absolute inset-y-0 right-2 my-auto h-8 rounded-lg px-2 text-muted-foreground hover:bg-muted"
                            aria-label={showConfirmPassword ? t("dashboard.profile.hideConfirmPassword") : t("dashboard.profile.showConfirmPassword")}
                        >
                            {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                    </div>
                    {passwordErrors.confirmPassword && (
                        <p className="mt-1 text-xs text-destructive">{passwordErrors.confirmPassword.message}</p>
                    )}
                </div>

                <button
                    type="submit"
                    disabled={isPasswordPending}
                    className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-70"
                >
                    {isPasswordPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                    {isPasswordPending ? t("dashboard.profile.updating") : t("dashboard.profile.changePassword")}
                </button>
            </form>
        </div>
    );
}
