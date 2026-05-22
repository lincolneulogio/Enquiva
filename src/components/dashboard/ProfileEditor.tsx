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
import { Eye, EyeOff, Loader2, Mail, Shield, User, ImageIcon, LockKeyhole, Phone, Camera } from "lucide-react";
import { useLocale, useTranslations } from "@/components/providers/LocaleProvider";
import { getRoleLabel } from "@/lib/i18n/core";
import { normalizePeruPhone } from "@/lib/utils";

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
                    phone: data.phone?.trim() ? normalizePeruPhone(data.phone) : null,
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
            "h-full w-full rounded-2xl border border-dashed border-primary/25 bg-gradient-to-br from-primary/5 via-muted/10 to-transparent p-4 transition-all duration-300 hover:border-primary/40 hover:from-primary/10 hover:shadow-sm hover:shadow-primary/5 cursor-pointer",
        uploadIcon: "h-7 w-7 text-primary/70 transition-transform duration-300 hover:scale-110",
        label: "text-xs font-semibold text-foreground tracking-wide mt-1.5",
        allowedContent: "text-[10px] text-muted-foreground/80 mt-0.5 font-medium",
        button:
            "mt-3 rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground shadow-md shadow-primary/15 transition-all duration-300 hover:bg-primary/95 hover:shadow-lg hover:shadow-primary/25 active:scale-95",
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
                    <div className="flex overflow-hidden rounded-xl border border-border bg-background focus-within:border-primary">
                        <span className="flex items-center border-r border-border bg-muted/60 px-3 text-sm font-medium text-muted-foreground">
                            +51
                        </span>
                        <input
                            {...register("phone")}
                            inputMode="numeric"
                            maxLength={9}
                            placeholder="912345678"
                            className="w-full px-4 py-2.5 text-sm focus:outline-none"
                            onChange={(event) => {
                                const digits = event.target.value.replace(/\D/g, "").slice(0, 9);
                                setValue("phone", digits, { shouldDirty: true, shouldValidate: true });
                            }}
                        />
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                        {t("profile.phoneHint")}
                    </p>
                    {errors.phone && <p className="mt-1 text-xs text-destructive">{errors.phone.message}</p>}
                </div>

                <div className="space-y-3">
                    <label className="block text-sm font-semibold tracking-wide text-foreground">{t("dashboard.profile.profilePhoto")}</label>

                    <div className="rounded-2xl border border-border/80 bg-background/60 backdrop-blur-sm p-6 shadow-sm hover:shadow-md transition-all duration-300">
                        <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start sm:justify-start">
                            <div className="shrink-0 group relative">
                                {/* Tech Glow Background Ring */}
                                <div className="absolute -inset-1.5 rounded-[2rem] bg-gradient-to-tr from-primary via-violet-500 to-accent opacity-20 blur-md group-hover:opacity-40 transition duration-500 pointer-events-none" />
                                
                                <div className="relative h-40 w-40 overflow-hidden rounded-3xl border border-primary/20 bg-card sm:h-44 sm:w-44 shadow-lg shadow-primary/5 transition-all duration-500 group-hover:border-primary/40 group-hover:shadow-primary/10 flex flex-col items-center justify-center p-4">
                                    {/* Tech Grid Pattern */}
                                    <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:14px_24px] pointer-events-none" />
                                    
                                    {/* Ambient Glows */}
                                    <div className="absolute -top-10 -right-10 h-24 w-24 rounded-full bg-primary/8 blur-xl group-hover:bg-primary/12 transition-all duration-300 pointer-events-none" />
                                    <div className="absolute -bottom-10 -left-10 h-24 w-24 rounded-full bg-violet-500/8 blur-xl group-hover:bg-violet-500/12 transition-all duration-300 pointer-events-none" />

                                    {previewImage ? (
                                        <div className="relative h-full w-full overflow-hidden rounded-2xl group/image">
                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                            <img 
                                                src={previewImage} 
                                                alt={t("dashboard.profile.profilePhoto")} 
                                                className="h-full w-full object-cover transition-transform duration-500 group-hover/image:scale-110" 
                                            />
                                            {/* Premium Hover Overlay */}
                                            <div className="absolute inset-0 bg-black/60 backdrop-blur-[3px] opacity-0 group-hover/image:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center gap-2 text-white">
                                                <div className="rounded-full bg-white/20 p-2.5 border border-white/30 shadow-inner transform scale-90 group-hover/image:scale-100 transition-transform duration-300">
                                                    <Camera className="h-5 w-5 text-white" />
                                                </div>
                                                <span className="text-xs font-semibold tracking-wider uppercase text-[10px]">
                                                    {t("dashboard.profile.uploadButton")}
                                                </span>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="relative flex h-full w-full flex-col items-center justify-center text-center">
                                            <div className="relative mb-3.5 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-tr from-primary/10 to-violet-500/10 border border-primary/20 shadow-md shadow-primary/5 transition-all duration-500 group-hover:scale-110 group-hover:rotate-6">
                                                <div className="absolute inset-0.5 rounded-xl bg-background/80 backdrop-blur-sm flex items-center justify-center">
                                                    <ImageIcon className="h-7 w-7 text-primary animate-pulse" />
                                                </div>
                                                {/* Slow rotating halo */}
                                                <span className="absolute -inset-2 rounded-2xl border border-dashed border-primary/25 animate-[spin_20s_linear_infinite]" />
                                            </div>
                                            
                                            <span className="text-[11px] font-bold text-foreground/90 tracking-wide leading-snug max-w-[130px] px-1">
                                                {t("dashboard.profile.uploadProfilePhoto")}
                                            </span>
                                            <span className="mt-2 text-[9px] font-semibold text-muted-foreground/80 uppercase tracking-widest bg-muted/60 px-2 py-0.5 rounded-full border border-border/40">
                                                {t("dashboard.profile.uploadAllowedContent")}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="w-full max-w-[320px] self-stretch flex flex-col justify-between py-1 gap-4">
                                <div className="w-full flex-1">
                                    <div className="h-full min-h-[140px]">
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
                                            content={{
                                                label: t("dashboard.profile.uploadDragDrop"),
                                                allowedContent: t("dashboard.profile.uploadAllowedContent"),
                                                button({ ready, isUploading }) {
                                                    if (isUploading) return t("common.loading");
                                                    return t("dashboard.profile.uploadButton");
                                                }
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
                                        className="w-full rounded-xl border border-destructive/20 bg-destructive/5 text-destructive px-3 py-2.5 text-xs font-semibold tracking-wider uppercase transition-all duration-200 hover:bg-destructive hover:text-white hover:border-destructive shadow-sm hover:shadow-md hover:shadow-destructive/10"
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
