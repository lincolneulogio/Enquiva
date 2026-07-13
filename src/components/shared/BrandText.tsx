"use client";

import { usePlatformBrand } from "@/components/providers/PlatformBrandProvider";

/** Nombre de plataforma desde Settings (Superadmin). */
export function BrandText({
  className,
  as: Tag = "span",
}: {
  className?: string;
  as?: "span" | "p" | "strong";
}) {
  const { name } = usePlatformBrand();
  return <Tag className={className}>{name}</Tag>;
}

/** mailto + texto del correo de soporte configurado. */
export function SupportEmailLink({ className }: { className?: string }) {
  const { supportEmail } = usePlatformBrand();
  return (
    <a href={`mailto:${supportEmail}`} className={className}>
      {supportEmail}
    </a>
  );
}

/** Badge compacto logo + nombre (landing hero, etc.). */
export function BrandBadge({ className }: { className?: string }) {
  const { name } = usePlatformBrand();
  return (
    <span
      className={
        className ??
        "inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-medium text-primary"
      }
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/images/logo-mark-xs.png"
        alt={name}
        height={18}
        className="object-contain"
        style={{ height: "18px", width: "auto" }}
      />
      {name}
    </span>
  );
}
