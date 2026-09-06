"use client";

import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { updateCurrentUserProfile } from "@/actions/profile";
import { updateProfileSchema, type UpdateProfileInput } from "@/lib/validations";
import { Loader2, Mail, Shield, User, Phone, MapPin } from "lucide-react";
import { useLocale, useTranslations } from "@/components/providers/LocaleProvider";
import { getRoleLabel } from "@/lib/i18n/core";
import { useFormPersistence } from "@/hooks/useFormPersistence";
import { formStorageKey } from "@/lib/form-persistence";
import { formatPeruPhoneInput } from "@/lib/utils";
import { AvatarUploadCard } from "./AvatarUploadCard";

interface ProfileFormProps {
  user: {
    name: string;
    email: string;
    role: string;
    phone: string | null;
    address: string | null;
    bio: string | null;
    image: string | null;
  };
}

export function ProfileForm({ user }: ProfileFormProps) {
  const router = useRouter();
  const t = useTranslations();
  const { locale } = useLocale();
  const [isProfilePending, startProfileTransition] = useTransition();

  const form = useForm<UpdateProfileInput>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: {
      name: user.name ?? "",
      phone: formatPeruPhoneInput(user.phone),
      address: user.address ?? "",
      bio: user.bio ?? "",
      image: user.image ?? "",
    },
  });
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = form;
  const { clearDraft } = useFormPersistence(
    formStorageKey(`profile.${user.email}`),
    form,
  );

  const previewImage = watch("image") || user.image;

  const onSubmit = (data: UpdateProfileInput) => {
    startProfileTransition(async () => {
      try {
        await updateCurrentUserProfile({
          ...data,
          phone: data.phone?.trim() || null,
          address: data.address?.trim() ? data.address.trim() : null,
          bio: data.bio?.trim() ? data.bio : null,
          image: data.image?.trim() ? data.image : null,
        });
        toast.success(t("dashboard.profile.profileUpdated"));
        clearDraft();
        router.refresh();
      } catch (error) {
        toast.error(
          error instanceof Error
            ? error.message
            : t("dashboard.profile.profileUpdateError"),
        );
      }
    });
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-5 rounded-xl border border-border bg-card p-4 sm:p-6"
    >
      <div>
        <label className="mb-1.5 block text-sm font-medium text-foreground">
          {t("common.fullName")} *
        </label>
        <input
          {...register("name")}
          placeholder={t("common.fullName")}
          className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm focus:border-primary focus:outline-none"
        />
        {errors.name && (
          <p className="mt-1 text-xs text-destructive">{errors.name.message}</p>
        )}
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
        <p className="mt-1 text-xs text-muted-foreground">{t("profile.phoneHint")}</p>
        {errors.phone && (
          <p className="mt-1 text-xs text-destructive">{errors.phone.message}</p>
        )}
      </div>

      <div>
        <label className="mb-1.5 flex items-center gap-2 text-sm font-medium text-foreground">
          <MapPin className="h-4 w-4" />
          {t("profile.addressLabel")}
        </label>
        <input
          {...register("address")}
          placeholder={t("profile.addressPlaceholder")}
          maxLength={100}
          className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm focus:border-primary focus:outline-none"
        />
        <p className="mt-1 text-xs text-muted-foreground">{t("profile.addressHint")}</p>
        {errors.address && (
          <p className="mt-1 text-xs text-destructive">{errors.address.message}</p>
        )}
      </div>

      <div>
        <AvatarUploadCard
          previewImage={previewImage}
          onUploadSuccess={(url) =>
            setValue("image", url, {
              shouldDirty: true,
              shouldTouch: true,
              shouldValidate: true,
            })
          }
          onRemove={() =>
            setValue("image", "", {
              shouldDirty: true,
              shouldTouch: true,
              shouldValidate: true,
            })
          }
          onChangeUrl={(url) =>
            setValue("image", url, {
              shouldDirty: true,
              shouldTouch: true,
              shouldValidate: true,
            })
          }
          error={errors.image?.message}
        />
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-foreground">
          {t("dashboard.profile.bio")}
        </label>
        <textarea
          {...register("bio")}
          rows={4}
          placeholder={t("dashboard.profile.tellUsAboutYou")}
          className="w-full resize-none rounded-xl border border-border bg-background px-4 py-2.5 text-sm focus:border-primary focus:outline-none"
        />
        {errors.bio && (
          <p className="mt-1 text-xs text-destructive">{errors.bio.message}</p>
        )}
      </div>

      <div className="rounded-xl border border-border bg-background p-4">
        <div className="space-y-3.5">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-3 text-sm text-muted-foreground">
            <div className="flex items-center gap-2 shrink-0">
              <Mail className="h-4 w-4 text-muted-foreground/80" />
              <span className="font-medium">{t("common.email")}:</span>
            </div>
            <span className="font-semibold text-foreground break-all sm:break-normal select-all">
              {user.email}
            </span>
          </div>
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-3 text-sm text-muted-foreground">
            <div className="flex items-center gap-2 shrink-0">
              <Shield className="h-4 w-4 text-muted-foreground/80" />
              <span className="font-medium">{t("common.role")}:</span>
            </div>
            <span className="font-semibold capitalize text-foreground">
              {getRoleLabel(user.role, locale)}
            </span>
          </div>
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-3 text-sm text-muted-foreground">
            <div className="flex items-center gap-2 shrink-0">
              <User className="h-4 w-4 text-muted-foreground/80" />
              <span className="font-medium">{t("common.account")}:</span>
            </div>
            <span className="font-semibold text-foreground">
              {t("dashboard.profile.accountInfoEditable")}
            </span>
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
  );
}
