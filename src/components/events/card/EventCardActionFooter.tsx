import { ArrowRight, QrCode } from "lucide-react";

interface EventCardActionFooterProps {
  hasRegistration: boolean;
  isEventExpired: boolean;
  expiredText: string;
}

export function EventCardActionFooter({
  hasRegistration,
  isEventExpired,
  expiredText,
}: EventCardActionFooterProps) {
  return (
    <div className="mt-4 pt-1">
      {hasRegistration ? (
        <div className="flex w-full items-center justify-center gap-2 rounded-2xl bg-primary py-2.5 text-center text-xs font-bold text-primary-foreground shadow-xs shadow-primary/25 transition-all hover:bg-primary/90">
          <QrCode className="h-4 w-4" />
          <span>VER MI PASE CON QR</span>
        </div>
      ) : !isEventExpired ? (
        <div className="flex w-full items-center justify-center gap-1.5 rounded-2xl border border-primary/30 bg-primary/10 py-2.5 text-center text-xs font-bold text-primary shadow-2xs transition-all duration-200 group-hover:border-primary group-hover:bg-primary group-hover:text-primary-foreground group-hover:shadow-md group-hover:shadow-primary/25">
          <span>VER DETALLES</span>
          <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-1" />
        </div>
      ) : (
        <div className="flex w-full items-center justify-center rounded-2xl border border-destructive/20 bg-destructive/10 py-2.5 text-center text-xs font-bold text-destructive">
          {expiredText}
        </div>
      )}
    </div>
  );
}
