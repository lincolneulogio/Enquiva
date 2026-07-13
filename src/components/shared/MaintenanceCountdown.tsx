"use client";

import { useEffect, useState } from "react";

export function MaintenanceCountdown({
  endsAt,
  locale,
}: {
  endsAt: string;
  locale: string;
}) {
  const [label, setLabel] = useState<string | null>(null);

  useEffect(() => {
    const update = () => {
      const end = new Date(endsAt).getTime();
      const diff = end - Date.now();
      if (Number.isNaN(end)) {
        setLabel(null);
        return;
      }
      if (diff <= 0) {
        setLabel(locale.startsWith("en") ? "Should be available now" : "Debería estar disponible");
        return;
      }
      const totalMin = Math.floor(diff / 60_000);
      const hours = Math.floor(totalMin / 60);
      const minutes = totalMin % 60;
      if (locale.startsWith("en")) {
        setLabel(hours > 0 ? `About ${hours}h ${minutes}m remaining` : `About ${minutes}m remaining`);
      } else {
        setLabel(
          hours > 0
            ? `Quedan aprox. ${hours}h ${minutes}m`
            : `Quedan aprox. ${minutes} min`,
        );
      }
    };
    update();
    const id = window.setInterval(update, 30_000);
    return () => window.clearInterval(id);
  }, [endsAt, locale]);

  if (!label) return null;
  return <p className="text-xs text-muted-foreground">{label}</p>;
}
