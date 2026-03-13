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
import { UploadButton } from "@/lib/uploadthing/components";
import { Eye, EyeOff, Loader2, Mail, Shield, User, ImageIcon, LockKeyhole, Phone } from "lucide-react";

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
            img.onerror = () => reject(new Error("No se pudo leer la imagen"));
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
        throw new Error("No se pudo procesar la imagen");
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
                    reject(new Error("No se pudo generar el avatar"));
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
        toast.error("No pudimos optimizar la imagen. Intenta con otra foto.");
        return files;
    }
}

export function ProfileEditor({ user }: ProfileEditorProps) {
    const router = useRouter();
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

    const onSubmit = (data: UpdateProfileInput) => {
        startProfileTransition(async () => {
            try {
                await updateCurrentUserProfile({
                    ...data,
                    phone: data.phone?.trim() ? data.phone : null,
                    bio: data.bio?.trim() ? data.bio : null,
                    image: data.image?.trim() ? data.image : null,
                });
                toast.success("Perfil actualizado correctamente");
                router.refresh();
            } catch (error) {
                toast.error(error instanceof Error ? error.message : "No se pudo actualizar el perfil");
            }
        });
    };

    const onSubmitPassword = (data: UpdatePasswordInput) => {
        startPasswordTransition(async () => {
            try {
                await updateCurrentUserPassword(data);
                toast.success("Contraseña actualizada correctamente");
                resetPasswordForm();
            } catch (error) {
                toast.error(error instanceof Error ? error.message : "No se pudo actualizar la contraseña");
            }
        });
    };

    return (
        <div className="max-w-2xl space-y-6">
            <div className="flex items-center gap-5 rounded-xl border border-border bg-card p-6">
                <div className="relative flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary/10 text-2xl font-semibold text-primary">
                    {previewImage ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={previewImage} alt="Profile" className="h-full w-full object-cover" />
                    ) : (
                        initials
                    )}
                </div>
                <div>
                    <p className="text-xl font-semibold text-foreground">{watch("name") || user.name}</p>
                    <p className="text-sm text-muted-foreground">{user.email}</p>
                    <span className="mt-1 inline-flex items-center rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium text-foreground capitalize">
                        {user.role}
                    </span>
                </div>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 rounded-xl border border-border bg-card p-6">
                <div>
                    <label className="mb-1.5 block text-sm font-medium text-foreground">Nombre completo *</label>
                    <input
                        {...register("name")}
                        placeholder="Tu nombre"
                        className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm focus:border-primary focus:outline-none"
                    />
                    {errors.name && <p className="mt-1 text-xs text-destructive">{errors.name.message}</p>}
                </div>

                <div>
                    <label className="mb-1.5 flex items-center gap-2 text-sm font-medium text-foreground">
                        <Phone className="h-4 w-4" />
                        Teléfono (+51) *
                    </label>
                    <input
                        {...register("phone")}
                        placeholder="+51987654321"
                        className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm focus:border-primary focus:outline-none"
                    />
                    <p className="mt-1 text-xs text-muted-foreground">
                        Formato requerido: +51 seguido de 9 dígitos (ej. +51987654321).
                    </p>
                    {errors.phone && <p className="mt-1 text-xs text-destructive">{errors.phone.message}</p>}
                </div>

                <div className="space-y-2">
                    <label className="block text-sm font-medium text-foreground">Foto de perfil</label>

                    <div className="rounded-xl border border-border bg-background p-4">
                        {previewImage ? (
                            <div className="space-y-3">
                                <div className="relative h-40 w-full overflow-hidden rounded-lg border border-border">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img src={previewImage} alt="Avatar preview" className="h-full w-full object-cover" />
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    <UploadButton
                                        endpoint="profileAvatar"
                                        onBeforeUploadBegin={optimizeAvatarFiles}
                                        onClientUploadComplete={(res) => {
                                            if (res?.[0]?.url) {
                                                setValue("image", res[0].url, {
                                                    shouldDirty: true,
                                                    shouldTouch: true,
                                                    shouldValidate: true,
                                                });
                                                toast.success("Avatar subido correctamente");
                                            }
                                        }}
                                        onUploadError={(err) => {
                                            toast.error(err.message);
                                        }}
                                        appearance={{
                                            button:
                                                "bg-primary text-primary-foreground text-sm px-4 py-2 rounded-lg ut-readying:bg-primary ut-uploading:opacity-80",
                                        }}
                                    />
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setValue("image", "", {
                                                shouldDirty: true,
                                                shouldTouch: true,
                                                shouldValidate: true,
                                            })
                                        }
                                        className="rounded-lg border border-border px-3 py-2 text-sm text-foreground hover:bg-muted"
                                    >
                                        Quitar avatar
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col items-start gap-3 text-muted-foreground">
                                <div className="flex items-center gap-2 text-sm">
                                    <ImageIcon className="h-4 w-4" />
                                    <span>Sube una imagen para tu perfil</span>
                                </div>
                                <UploadButton
                                    endpoint="profileAvatar"
                                    onBeforeUploadBegin={optimizeAvatarFiles}
                                    onClientUploadComplete={(res) => {
                                        if (res?.[0]?.url) {
                                            setValue("image", res[0].url, {
                                                shouldDirty: true,
                                                shouldTouch: true,
                                                shouldValidate: true,
                                            });
                                            toast.success("Avatar subido correctamente");
                                        }
                                    }}
                                    onUploadError={(err) => {
                                        toast.error(err.message);
                                    }}
                                    appearance={{
                                        button:
                                            "bg-primary text-primary-foreground text-sm px-4 py-2 rounded-lg ut-readying:bg-primary ut-uploading:opacity-80",
                                    }}
                                />
                            </div>
                        )}
                    </div>

                    <p className="text-xs text-muted-foreground">
                        Opcional: puedes pegar una URL manual o dejarlo vacío si no la usarás.
                    </p>
                    <input
                        {...register("image")}
                        placeholder="Opcional (ej: https://mi-sitio.com/avatar.jpg)"
                        className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm focus:border-primary focus:outline-none"
                    />
                    {errors.image && <p className="mt-1 text-xs text-destructive">{errors.image.message}</p>}
                </div>

                <div>
                    <label className="mb-1.5 block text-sm font-medium text-foreground">Bio</label>
                    <textarea
                        {...register("bio")}
                        rows={4}
                        placeholder="Cuéntanos un poco sobre ti"
                        className="w-full resize-none rounded-xl border border-border bg-background px-4 py-2.5 text-sm focus:border-primary focus:outline-none"
                    />
                    {errors.bio && <p className="mt-1 text-xs text-destructive">{errors.bio.message}</p>}
                </div>

                <div className="rounded-xl border border-border bg-background p-4">
                    <div className="space-y-3">
                        <div className="flex items-center gap-3 text-sm text-muted-foreground">
                            <Mail className="h-4 w-4" />
                            <span>Email:</span>
                            <span className="font-medium text-foreground">{user.email}</span>
                        </div>
                        <div className="flex items-center gap-3 text-sm text-muted-foreground">
                            <Shield className="h-4 w-4" />
                            <span>Rol:</span>
                            <span className="font-medium capitalize text-foreground">{user.role}</span>
                        </div>
                        <div className="flex items-center gap-3 text-sm text-muted-foreground">
                            <User className="h-4 w-4" />
                            <span>Cuenta:</span>
                            <span className="font-medium text-foreground">Información personal editable</span>
                        </div>
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={isProfilePending}
                    className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-70"
                >
                    {isProfilePending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                    {isProfilePending ? "Guardando..." : "Guardar cambios"}
                </button>
            </form>

            <form
                onSubmit={handlePasswordSubmit(onSubmitPassword)}
                className="space-y-5 rounded-xl border border-border bg-card p-6"
            >
                <div className="flex items-center gap-2">
                    <LockKeyhole className="h-4 w-4 text-primary" />
                    <h3 className="text-base font-semibold text-foreground">Actualizar contraseña</h3>
                </div>

                <div>
                    <label className="mb-1.5 block text-sm font-medium text-foreground">Contraseña actual *</label>
                    <div className="relative">
                        <input
                            type={showCurrentPassword ? "text" : "password"}
                            {...registerPassword("currentPassword")}
                            placeholder="Ingresa tu contraseña actual"
                            className="w-full rounded-xl border border-border bg-background px-4 py-2.5 pr-11 text-sm focus:border-primary focus:outline-none"
                        />
                        <button
                            type="button"
                            onClick={() => setShowCurrentPassword((prev) => !prev)}
                            className="absolute inset-y-0 right-2 my-auto h-8 rounded-lg px-2 text-muted-foreground hover:bg-muted"
                            aria-label={showCurrentPassword ? "Ocultar contraseña actual" : "Mostrar contraseña actual"}
                        >
                            {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                    </div>
                    {passwordErrors.currentPassword && (
                        <p className="mt-1 text-xs text-destructive">{passwordErrors.currentPassword.message}</p>
                    )}
                </div>

                <div>
                    <label className="mb-1.5 block text-sm font-medium text-foreground">Nueva contraseña *</label>
                    <div className="relative">
                        <input
                            type={showNewPassword ? "text" : "password"}
                            {...registerPassword("newPassword")}
                            placeholder="Mínimo 8 caracteres, 1 mayúscula y 1 número"
                            className="w-full rounded-xl border border-border bg-background px-4 py-2.5 pr-11 text-sm focus:border-primary focus:outline-none"
                        />
                        <button
                            type="button"
                            onClick={() => setShowNewPassword((prev) => !prev)}
                            className="absolute inset-y-0 right-2 my-auto h-8 rounded-lg px-2 text-muted-foreground hover:bg-muted"
                            aria-label={showNewPassword ? "Ocultar nueva contraseña" : "Mostrar nueva contraseña"}
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
                        <p className="text-xs text-muted-foreground">Fortaleza: {passwordStrength.label}</p>
                    </div>
                    {passwordErrors.newPassword && (
                        <p className="mt-1 text-xs text-destructive">{passwordErrors.newPassword.message}</p>
                    )}
                </div>

                <div>
                    <label className="mb-1.5 block text-sm font-medium text-foreground">Confirmar nueva contraseña *</label>
                    <div className="relative">
                        <input
                            type={showConfirmPassword ? "text" : "password"}
                            {...registerPassword("confirmPassword")}
                            placeholder="Repite tu nueva contraseña"
                            className="w-full rounded-xl border border-border bg-background px-4 py-2.5 pr-11 text-sm focus:border-primary focus:outline-none"
                        />
                        <button
                            type="button"
                            onClick={() => setShowConfirmPassword((prev) => !prev)}
                            className="absolute inset-y-0 right-2 my-auto h-8 rounded-lg px-2 text-muted-foreground hover:bg-muted"
                            aria-label={showConfirmPassword ? "Ocultar confirmación de contraseña" : "Mostrar confirmación de contraseña"}
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
                    {isPasswordPending ? "Actualizando..." : "Cambiar contraseña"}
                </button>
            </form>
        </div>
    );
}
