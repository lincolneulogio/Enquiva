"use client";

import type { ComponentProps } from "react";
import dynamic from "next/dynamic";
import { Loader2 } from "lucide-react";

const EventLocationMapInner = dynamic(
  () =>
    import("@/components/events/EventLocationMap").then((m) => m.EventLocationMap),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-64 items-center justify-center rounded-2xl border border-border/60 bg-muted/30 text-sm text-muted-foreground sm:h-72">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        Cargando mapa…
      </div>
    ),
  },
);

const EventLocationPickerInner = dynamic(
  () =>
    import("@/components/events/EventLocationPicker").then(
      (m) => m.EventLocationPicker,
    ),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-56 items-center justify-center rounded-xl border border-border bg-muted/30 text-xs text-muted-foreground">
        <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
        Cargando mapa…
      </div>
    ),
  },
);

export function EventLocationMapDynamic(
  props: ComponentProps<typeof EventLocationMapInner>,
) {
  return <EventLocationMapInner {...props} />;
}

export function EventLocationPickerDynamic(
  props: ComponentProps<typeof EventLocationPickerInner>,
) {
  return <EventLocationPickerInner {...props} />;
}
