import { getNotificationsPaginated } from "@/actions/notifications";
import {
    Bell,
    CreditCard,
    Calendar,
    Bus,
    CheckCircle2,
    AlertTriangle,
    Megaphone,
    Clock,
    ListCheck,
} from "lucide-react";
import { MarkAllReadButton } from "@/components/dashboard";
import { TablePagination } from "@/components/dashboard/shared/TablePagination";
import { getI18n } from "@/lib/i18n/server";
import { getIntlLocale, translateNotification } from "@/lib/i18n/core";

const PAGE_SIZE = 10;

type NotificationType =
    | "event_published"
    | "registration_confirmed"
    | "event_cancelled"
    | "event_updated"
    | "event_reminder"
    | "waitlist_promoted"
    | "payment_submitted"
    | "payment_status_updated";

function notificationIcon(type: NotificationType) {
    const base = "h-4 w-4";
    switch (type) {
        case "payment_submitted":
        case "payment_status_updated":
            return <CreditCard className={`${base} text-emerald-500`} />;
        case "registration_confirmed":
            return <CheckCircle2 className={`${base} text-blue-500`} />;
        case "waitlist_promoted":
            return <ListCheck className={`${base} text-violet-500`} />;
        case "event_published":
        case "event_reminder":
            return <Calendar className={`${base} text-primary`} />;
        case "event_cancelled":
            return <AlertTriangle className={`${base} text-red-500`} />;
        case "event_updated":
            return <Megaphone className={`${base} text-amber-500`} />;
        default:
            return <Bell className={`${base} text-muted-foreground`} />;
    }
}

function notificationIconBg(type: NotificationType, read: boolean) {
    if (read) return "bg-muted";
    switch (type) {
        case "payment_submitted":
        case "payment_status_updated":
            return "bg-emerald-500/10";
        case "registration_confirmed":
            return "bg-blue-500/10";
        case "waitlist_promoted":
            return "bg-violet-500/10";
        case "event_published":
        case "event_reminder":
            return "bg-primary/10";
        case "event_cancelled":
            return "bg-red-500/10";
        case "event_updated":
            return "bg-amber-500/10";
        default:
            return "bg-muted";
    }
}

export default async function MemberNotificationsPage({
    searchParams,
}: {
    searchParams: Promise<{ page?: string }>;
}) {
    const { locale, t } = await getI18n();
    const params = await searchParams;
    const page = Math.max(1, parseInt(params.page ?? "1", 10) || 1);
    const intlLocale = getIntlLocale(locale);

    const { items, total, unread, page: safePage, limit } =
        await getNotificationsPaginated(page, PAGE_SIZE);

    const totalPages = Math.max(1, Math.ceil(total / limit));

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="font-display text-2xl font-bold text-foreground">
                        {t("common.notifications")}
                    </h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                        {unread > 0
                            ? t("dashboard.admin.unreadNotifications", {
                                count: unread,
                                label: unread === 1
                                    ? (locale === "en" ? "notification" : "notificación")
                                    : (locale === "en" ? "notifications" : "notificaciones"),
                            })
                            : t("dashboard.admin.allCaughtUp")}
                    </p>
                </div>
                <div className="flex items-center gap-2.5 self-start sm:self-auto">
                    {unread > 0 && (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 border border-primary/20 px-3 py-1 text-xs font-bold text-primary">
                            <Bell className="h-3.5 w-3.5" />
                            {unread} {locale === "en" ? "unread" : "sin leer"}
                        </span>
                    )}
                    {unread > 0 && <MarkAllReadButton />}
                </div>
            </div>

            {/* Empty state */}
            {items.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-border bg-card/60 p-16 text-center">
                    <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-muted">
                        <Bell className="h-7 w-7 text-muted-foreground/50" />
                    </div>
                    <p className="font-semibold text-foreground">{t("dashboard.admin.noNotifications")}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{t("dashboard.admin.notificationsHelp")}</p>
                </div>
            ) : (
                <div className="rounded-2xl border border-border bg-card overflow-hidden">
                    {/* Items list */}
                    <div className="divide-y divide-border/60">
                        {items.map((n) => {
                            const { title: displayTitle, message: displayMessage } =
                                translateNotification(n.type, n.title, n.message, locale);

                            const relativeDate = new Date(n.createdAt).toLocaleDateString(intlLocale, {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                                hour: "numeric",
                                minute: "2-digit",
                            });

                            return (
                                <div
                                    key={n.id}
                                    className={`flex items-start gap-3.5 px-4 py-3.5 transition-colors ${
                                        n.read
                                            ? "bg-transparent hover:bg-secondary/20"
                                            : "bg-primary/[0.03] hover:bg-primary/[0.06]"
                                    }`}
                                >
                                    {/* Icon */}
                                    <div
                                        className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${notificationIconBg(
                                            n.type as NotificationType,
                                            n.read
                                        )}`}
                                    >
                                        {notificationIcon(n.type as NotificationType)}
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between gap-3">
                                            <p className={`text-sm font-semibold leading-snug ${n.read ? "text-foreground/80" : "text-foreground"}`}>
                                                {displayTitle}
                                            </p>
                                            <div className="flex items-center gap-1.5 shrink-0 mt-0.5">
                                                {!n.read && (
                                                    <span className="h-2 w-2 rounded-full bg-primary shrink-0" />
                                                )}
                                            </div>
                                        </div>
                                        <p className="mt-0.5 text-xs text-muted-foreground leading-relaxed line-clamp-2">
                                            {displayMessage}
                                        </p>
                                        <span className="mt-1.5 inline-flex items-center gap-1 text-[11px] text-muted-foreground/70">
                                            <Clock className="h-3 w-3" />
                                            {relativeDate}
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Pagination */}
                    <TablePagination
                        basePath="/member/notifications"
                        currentPage={safePage}
                        totalPages={totalPages}
                        totalItems={total}
                        pageSize={limit}
                    />
                </div>
            )}
        </div>
    );
}
