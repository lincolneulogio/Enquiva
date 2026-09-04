import type { LucideIcon, LucideProps } from "lucide-react";
import {
  Mic,
  GraduationCap,
  Briefcase,
  Music,
  Trophy,
  Church,
  Palette,
  Users,
  Landmark,
  HeartHandshake,
  Store,
  Cpu,
  PartyPopper,
  Compass,
  HeartPulse,
  Building2,
  Smile,
  Sparkles,
  Tag,
} from "lucide-react";
import { canonicalCategorySlug } from "@/lib/events/taxonomy";

/**
 * Mapeo de categorías canónicas a componentes de icono de lucide-react.
 */
export const CATEGORY_LUCIDE_ICONS: Record<string, LucideIcon> = {
  conferences: Mic,
  education: GraduationCap,
  business: Briefcase,
  music: Music,
  sports: Trophy,
  religion: Church,
  arts: Palette,
  community: Users,
  government: Landmark,
  charity: HeartHandshake,
  tradeshows: Store,
  technology: Cpu,
  celebrations: PartyPopper,
  travel: Compass,
  health: HeartPulse,
  corporate: Building2,
  family: Smile,
  other: Sparkles,
};

export function getCategoryLucideIcon(slug: string | null | undefined): LucideIcon {
  const canonical = canonicalCategorySlug(slug);
  return CATEGORY_LUCIDE_ICONS[canonical] ?? Tag;
}

interface CategoryIconProps extends LucideProps {
  slug?: string | null;
}

export function CategoryIcon({ slug, className, ...props }: CategoryIconProps) {
  const IconComponent = getCategoryLucideIcon(slug);
  return <IconComponent className={className} aria-hidden="true" {...props} />;
}
