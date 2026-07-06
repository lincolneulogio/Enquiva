import { EventCoverImage } from "@/components/events/EventCoverImage";
import { cn } from "@/lib/utils";

export type EventCoverVariant = "card" | "detail" | "preview";

const VARIANT_CONFIG: Record<
  EventCoverVariant,
  { shell: string; image: string; sizes: string }
> = {
  card: {
    shell: "aspect-[16/10] w-full bg-transparent",
    image: "max-h-full max-w-full object-contain",
    sizes: "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw",
  },
  detail: {
    shell: "w-full",
    image:
      "max-h-[min(78vh,720px)] max-w-full w-auto h-auto rounded-2xl object-contain sm:rounded-3xl",
    sizes: "(max-width: 1024px) 100vw, 960px",
  },
  preview: {
    shell: "aspect-[16/10] w-full min-h-[12rem] bg-transparent",
    image: "max-h-full max-w-full object-contain",
    sizes: "400px",
  },
};

export interface EventCoverFrameProps {
  src: string;
  alt: string;
  variant?: EventCoverVariant;
  priority?: boolean;
  className?: string;
  imageClassName?: string;
  dimmed?: boolean;
}

export function EventCoverFrame({
  src,
  alt,
  variant = "card",
  priority = false,
  className,
  imageClassName,
  dimmed = false,
}: EventCoverFrameProps) {
  const config = VARIANT_CONFIG[variant];
  const isDetail = variant === "detail";

  return (
    <div
      className={cn(
        "relative flex items-center justify-center",
        isDetail ? "justify-center" : "h-full w-full",
        config.shell,
        className,
      )}
    >
      <EventCoverImage
        src={src}
        alt={alt}
        width={isDetail ? 1200 : 836}
        height={isDetail ? 750 : 522}
        priority={priority}
        sizes={config.sizes}
        className={cn(
          config.image,
          "transition-transform duration-700 ease-out",
          dimmed && "grayscale-[0.35]",
          imageClassName,
        )}
      />
    </div>
  );
}

export function EventCoverPlaceholder({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "relative flex aspect-[16/10] w-full items-center justify-center overflow-hidden bg-gradient-to-br from-secondary via-secondary to-muted/80",
        className,
      )}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_35%_30%,hsl(var(--primary)/0.2),transparent_40%),radial-gradient(circle_at_80%_70%,hsl(var(--accent)/0.18),transparent_45%)]" />
      <div className="absolute inset-0 animate-pulse bg-[radial-gradient(circle_at_50%_50%,hsl(var(--primary)/0.04),transparent_60%)]" />
      <span className="relative text-5xl opacity-30">✦</span>
    </div>
  );
}
