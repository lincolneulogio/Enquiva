"use client";

import { useLocale, useTranslations } from "@/components/providers/LocaleProvider";
import { getRoleLabel } from "@/lib/i18n/core";
import { ProfileForm } from "./ProfileForm";
import { PasswordForm } from "./PasswordForm";

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

export function ProfileEditor({ user }: ProfileEditorProps) {
  const t = useTranslations();
  const { locale } = useLocale();
  const initials = (user.name || "U").charAt(0).toUpperCase();

  return (
    <div className="max-w-2xl space-y-6">
      {/* Tarjeta de Encabezado de Perfil */}
      <div className="flex items-center gap-5 rounded-xl border border-border bg-card p-6">
        <div className="relative flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary/10 text-2xl font-semibold text-primary">
          {user.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={user.image}
              alt={t("common.profile")}
              className="h-full w-full object-cover"
            />
          ) : (
            initials
          )}
        </div>
        <div>
          <p className="text-xl font-semibold text-foreground">
            {user.name}
          </p>
          <p className="text-sm text-muted-foreground">{user.email}</p>
          <span className="mt-1 inline-flex items-center rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium text-foreground capitalize">
            {getRoleLabel(user.role, locale)}
          </span>
        </div>
      </div>

      {/* Formulario de Información de Perfil */}
      <ProfileForm user={user} />

      {/* Formulario de Cambio de Contraseña */}
      <PasswordForm />
    </div>
  );
}
