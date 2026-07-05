import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { BRAND } from "@/lib/brand";

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
}

export function BrandLogo({
  href = "/",
  size = "md",
  showText = true,
  className,
  textClassName,
  priority = false,
}: BrandLogoProps) {
  const s = sizeMap[size];

  const content = (
    <>
      <Image
        src={s.src}
        alt={BRAND.name}
        width={Math.round(s.height * 1.15)}
        height={s.height}
        priority={priority}
        className="w-auto shrink-0 object-contain"
        style={{ height: s.height, width: "auto" }}
      />
      {showText && (
        <span className={cn("font-display font-semibold text-foreground", s.text, textClassName)}>
          {BRAND.name}
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
