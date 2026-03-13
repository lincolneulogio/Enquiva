"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { Bell, CheckCheck, Info, CalendarClock, BadgeCheck, CreditCard, UserPlus, BellRing } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { getRecentNotifications, markNotificationsAsRead } from "@/actions/notifications";
import { useRealtimeNotifications } from "@/hooks/useRealtimeNotifications";

type NotificationItem = {
    id: string;
    type: string;
    title: string;
    message: string;
    read: boolean;
    createdAt: Date;
};

interface TopbarNotificationsProps {
    userId: string;
    role?: string | null;
    initialUnreadCount: number;
    initialNotifications: NotificationItem[];
}

function roleNotificationsPath(role?: string | null) {
    if (role === "organizer") return "/organizer/notifications";
    if (role === "member") return "/member/notifications";
    if (role === "admin" || role === "super_admin") return "/admin/notifications";
    return "/dashboard";
}

function iconForType(type: string) {
    switch (type) {
        case "registration_confirmed":
        case "waitlist_promoted":
            return UserPlus;
        case "event_reminder":
        case "event_updated":
        case "event_cancelled":
        case "event_published":
            return CalendarClock;
        case "payment_submitted":
        case "payment_status_updated":
            return CreditCard;
        default:
            return Info;
    }
}

export function TopbarNotifications({
    userId,
    role,
    initialUnreadCount,
    initialNotifications,
}: TopbarNotificationsProps) {
    const [open, setOpen] = useState(false);
    const [isPending, startTransition] = useTransition();
    const [unreadCount, setUnreadCount] = useState(initialUnreadCount);
    const [items, setItems] = useState<NotificationItem[]>(initialNotifications);
    const wrapperRef = useRef<HTMLDivElement | null>(null);

    const notificationsPath = useMemo(() => roleNotificationsPath(role), [role]);

    const refreshNotifications = useCallback(() => {
        startTransition(async () => {
            try {
                const latest = await getRecentNotifications(8);
                setItems(latest.items as NotificationItem[]);
                setUnreadCount(latest.unreadCount);
            } catch {
                // silent refresh fail
            }
        });
    }, []);

    useRealtimeNotifications({
        userId,
        onNotification: () => {
            refreshNotifications();
        },
    });

    useEffect(() => {
        const onPointerDown = (event: MouseEvent) => {
            if (!wrapperRef.current) return;
            if (!wrapperRef.current.contains(event.target as Node)) {
                setOpen(false);
            }
        };

        const onEscape = (event: KeyboardEvent) => {
            if (event.key === "Escape") setOpen(false);
        };

        document.addEventListener("mousedown", onPointerDown);
        document.addEventListener("keydown", onEscape);

        return () => {
            document.removeEventListener("mousedown", onPointerDown);
            document.removeEventListener("keydown", onEscape);
        };
    }, []);

    const onToggle = () => {
        const next = !open;
        setOpen(next);
        if (next) refreshNotifications();
    };

    const markAll = () => {
        startTransition(async () => {
            try {
                await markNotificationsAsRead();
                setUnreadCount(0);
                setItems((prev) => prev.map((item) => ({ ...item, read: true })));
            } catch {
                toast.error("Could not mark notifications as read.");
            }
        });
    };

    const markOne = (id: string) => {
        startTransition(async () => {
            try {
                await markNotificationsAsRead([id]);
                setItems((prev) =>
                    prev.map((item) => (item.id === id ? { ...item, read: true } : item))
                );
                setUnreadCount((prev) => Math.max(0, prev - 1));
            } catch {
                toast.error("Could not update notification.");
            }
        });
    };

    return (
        <div ref={wrapperRef} className="relative">
            <button
                onClick={onToggle}
                className="relative rounded-xl border border-border bg-secondary/50 p-2 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
                aria-label="Open notifications"
            >
                <Bell className="h-4 w-4" />
                {unreadCount > 0 && (
                    <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-accent text-[10px] font-bold text-accent-foreground">
                        {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                )}
            </button>

            {open && (
                <div className="absolute right-0 z-50 mt-2 w-[360px] max-w-[90vw] overflow-hidden rounded-2xl border border-border bg-popover shadow-xl">
                    <div className="flex items-center justify-between border-b border-border px-4 py-3">
                        <div className="flex items-center gap-2">
                            <BellRing className="h-4 w-4 text-primary" />
                            <p className="text-sm font-semibold text-foreground">Notifications</p>
                        </div>
                        {unreadCount > 0 && (
                            <button
                                onClick={markAll}
                                disabled={isPending}
                                className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-primary hover:bg-secondary disabled:opacity-50"
                            >
                                <CheckCheck className="h-3.5 w-3.5" /> Mark all
                            </button>
                        )}
                    </div>

                    <div className="max-h-[420px] overflow-y-auto p-2">
                        {items.length === 0 ? (
                            <div className="px-3 py-10 text-center text-sm text-muted-foreground">
                                No notifications yet.
                            </div>
                        ) : (
                            <div className="space-y-1">
                                {items.map((n) => {
                                    const Icon = iconForType(n.type);
                                    return (
                                        <button
                                            key={n.id}
                                            onClick={() => {
                                                if (!n.read) markOne(n.id);
                                            }}
                                            className={cn(
                                                "w-full rounded-xl border p-3 text-left transition-colors",
                                                n.read
                                                    ? "border-border bg-card hover:bg-secondary/40"
                                                    : "border-primary/20 bg-primary/5 hover:bg-primary/10"
                                            )}
                                        >
                                            <div className="flex items-start gap-3">
                                                <div className={cn(
                                                    "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
                                                    n.read ? "bg-muted" : "bg-primary/15"
                                                )}>
                                                    <Icon className={cn("h-4 w-4", n.read ? "text-muted-foreground" : "text-primary")} />
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <p className="truncate text-sm font-medium text-foreground">{n.title}</p>
                                                    <p className="line-clamp-2 text-xs text-muted-foreground">{n.message}</p>
                                                    <p className="mt-1 text-[11px] text-muted-foreground">
                                                        {new Date(n.createdAt).toLocaleDateString("en-US", {
                                                            month: "short",
                                                            day: "numeric",
                                                            hour: "numeric",
                                                            minute: "2-digit",
                                                        })}
                                                    </p>
                                                </div>
                                                {!n.read && <span className="mt-2 h-2 w-2 rounded-full bg-primary" />}
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    <div className="border-t border-border px-3 py-2">
                        <Link
                            href={notificationsPath}
                            onClick={() => setOpen(false)}
                            className="block rounded-lg px-2 py-1.5 text-center text-xs font-medium text-primary hover:bg-secondary"
                        >
                            View all notifications
                        </Link>
                    </div>
                </div>
            )}
        </div>
    );
}
