import { createElement } from "react";
import type { LucideIcon, LucideProps } from "lucide-react";
import {
  Folder,
  Mic,
  GraduationCap,
  Briefcase,
  Music,
  Trophy,
  Cross,
  Palette,
  Users,
  Landmark,
  HeartHandshake,
  Store,
  Laptop,
  PartyPopper,
  Plane,
  HeartPulse,
  Building2,
  Smile,
  Sparkles,
  Wine,
  Tag,
} from "lucide-react";
import { canonicalCategorySlug } from "@/lib/events/taxonomy";

/**
 * Mapeo de categorías canónicas a componentes de icono vectoriales de lucide-react.
 */
export const CATEGORY_LUCIDE_ICONS: Record<string, LucideIcon> = {
  all: Folder,
  conferences: Mic,
  education: GraduationCap,
  business: Briefcase,
  music: Music,
  sports: Trophy,
  religion: Cross,
  arts: Palette,
  art: Palette,
  community: Users,
  government: Landmark,
  charity: HeartHandshake,
  tradeshows: Store,
  technology: Laptop,
  tech: Laptop,
  celebrations: PartyPopper,
  travel: Plane,
  health: HeartPulse,
  corporate: Building2,
  family: Smile,
  gastronomy: Wine,
  other: Sparkles,
};

export function getCategoryLucideIcon(slug: string | null | undefined): LucideIcon {
  if (!slug || slug === "all") return Folder;
  const canonical = canonicalCategorySlug(slug);
  return CATEGORY_LUCIDE_ICONS[canonical] ?? Tag;
}

interface CategoryIconProps extends LucideProps {
  slug?: string | null;
}

export function CategoryIcon({ slug, className, ...props }: CategoryIconProps) {
  const IconComponent = getCategoryLucideIcon(slug);
  return createElement(IconComponent, { className, "aria-hidden": "true", ...props });
}


