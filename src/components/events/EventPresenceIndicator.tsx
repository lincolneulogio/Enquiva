"use client";

import { Radio } from "lucide-react";
import { useEventPresence } from "@/hooks/useEventPresence";
import { useTranslations } from "@/components/providers/LocaleProvider";
import { cn } from "@/lib/utils";

interface EventPresenceIndicatorProps {
  eventId: string;
  currentUserId?: string | null;
  variant?: "compact" | "staff";
  className?: string;
}

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function MemberAvatar({
  name,
  image,
  className,
}: {
  name: string;
  image: string | null;
  className?: string;
}) {
  if (image) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={image}
        alt={name}
        className={cn(
          "h-7 w-7 rounded-full object-cover ring-2 ring-card",
          className,
        )}
      />
    );
  }

  return (
    <span
      className={cn(
        "flex h-7 w-7 items-center justify-center rounded-full bg-primary/15 text-[10px] font-bold text-primary ring-2 ring-card",
        className,
      )}
      aria-hidden
    >
      {initials(name) || "?"}
    </span>
  );
}

export function EventPresenceIndicator({
  eventId,
  currentUserId,
  variant = "compact",
  className,
}: EventPresenceIndicatorProps) {
  const t = useTranslations();
  const { members, count, ready } = useEventPresence(eventId, true);

  if (!ready && count === 0) return null;

  const visible = members.slice(0, 5);
  const extra = Math.max(0, count - visible.length);

  if (variant === "compact") {
    if (count === 0) return null;
    return (
      <p
        className={cn(
          "inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700 dark:text-emerald-300",
          className,
        )}
      >
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
        </span>
        {t("realtime.onlineCount", { count })}
      </p>
    );
  }

  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-3 rounded-2xl border border-border/70 bg-card px-3.5 py-2.5",
        className,
      )}
    >
      <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
        <Radio className="h-3.5 w-3.5 text-emerald-500" />
        {t("realtime.viewingNow")}
      </div>
      {count === 0 ? (
        <p className="text-xs text-muted-foreground">{t("realtime.noOneOnline")}</p>
      ) : (
        <div className="flex min-w-0 items-center gap-2">
          <div className="flex -space-x-2">
            {visible.map((member) => (
              <MemberAvatar key={member.id} name={member.name} image={member.image} />
            ))}
            {extra > 0 && (
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-muted text-[10px] font-bold text-muted-foreground ring-2 ring-card">
                +{extra}
              </span>
            )}
          </div>
          <p className="truncate text-xs text-muted-foreground">
            {members
              .slice(0, 3)
              .map((member) =>
                member.id === currentUserId ? t("realtime.you") : member.name,
              )
              .join(", ")}
            {count > 3 ? ` +${count - 3}` : ""}
          </p>
        </div>
      )}
    </div>
  );
}
