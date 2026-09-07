"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import { BRAND } from "@/lib/brand";
import { usePlatformBrand } from "@/components/providers/PlatformBrandProvider";

type BrandLogoSize = "xs" | "sm" | "md" | "lg";

const sizeMap: Record<
  BrandLogoSize,
  { height: number; src: string; text: string; gap: string }
> = {
  xs: { height: 22, src: BRAND.logo.markXs, text: "text-sm", gap: "gap-1.5" },
  sm: { height: 28, src: BRAND.logo.markSm, text: "text-base", gap: "gap-2" },
  md: { height: 34, src: BRAND.logo.markMd, text: "text-lg sm:text-xl", gap: "gap-2.5" },
  lg: { height: 42, src: BRAND.logo.markLg, text: "text-2xl", gap: "gap-3" },
};

interface BrandLogoProps {
  href?: string;
  size?: BrandLogoSize;
  showText?: boolean;
  className?: string;
  textClassName?: string;
  priority?: boolean;
  /** Override explícito (p. ej. emails/preview). Por defecto usa settings de plataforma. */
  name?: string;
}

export function BrandLogo({
  href = "/",
  size = "md",
  showText = true,
  className,
  textClassName,
  priority = false,
  name: nameProp,
}: BrandLogoProps) {
  const brand = usePlatformBrand();
  const displayName = nameProp?.trim() || brand.name;
  const s = sizeMap[size];

  const content = (
    <>
      {/* img nativo: evita warnings de Next/Image al escalar logos locales */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={s.src}
        alt={showText ? "" : displayName}
        height={s.height}
        width={s.height}
        decoding="async"
        fetchPriority={priority ? "high" : "auto"}
        className="shrink-0 object-contain"
        style={{ height: `${s.height}px`, width: "auto" }}
      />
      {showText && (
        <span className={cn("font-display font-semibold text-foreground", s.text, textClassName)}>
          {displayName}
        </span>
      )}
    </>
  );

  if (!href) {
    return (
      <div className={cn("inline-flex items-center", s.gap, className)}>{content}</div>
    );
  }

  return (
    <Link href={href} className={cn("inline-flex items-center", s.gap, className)}>
      {content}
    </Link>
  );
}
