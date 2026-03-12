import { cn } from "@/lib/utils";

export function EventCardSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "flex flex-col overflow-hidden rounded-2xl border border-border bg-card",
        className
      )}
    >
      <div className="skeleton h-48 w-full" />
      <div className="flex flex-col gap-3 p-5">
        <div className="skeleton h-6 w-3/4 rounded-lg" />
        <div className="skeleton h-4 w-full rounded-lg" />
        <div className="skeleton h-4 w-2/3 rounded-lg" />
        <div className="mt-2 space-y-2">
          <div className="skeleton h-3 w-1/2 rounded" />
          <div className="skeleton h-3 w-2/5 rounded" />
        </div>
      </div>
    </div>
  );
}
