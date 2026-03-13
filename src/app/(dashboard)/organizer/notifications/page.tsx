import { getNotifications } from "@/actions/notifications";
import { Bell } from "lucide-react";
import { MarkAllReadButton } from "@/components/dashboard/MarkAllReadButton";
import { getI18n } from "@/lib/i18n/server";
import { getIntlLocale } from "@/lib/i18n/core";

export default async function OrganizerNotificationsPage() {
    const { locale, t } = await getI18n();
    const items = await getNotifications(50);
    const unread = items.filter((n) => !n.read);

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="font-display text-3xl font-semibold text-foreground">
                        {t("common.notifications")}
                    </h1>
                    <p className="mt-1 text-muted-foreground">
                        {unread.length > 0
                            ? t("dashboard.admin.unreadNotifications", {
                                count: unread.length,
                                label: unread.length === 1 ? (locale === "en" ? "notification" : "notificación") : (locale === "en" ? "notifications" : "notificaciones"),
                            })
                            : t("dashboard.admin.allCaughtUp")}
                    </p>
                </div>
                {unread.length > 0 && <MarkAllReadButton />}
            </div>

            {items.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border bg-card p-12 text-center">
                    <Bell className="mx-auto h-10 w-10 text-muted-foreground/50" />
                    <p className="mt-4 font-medium text-foreground">{t("dashboard.admin.noNotifications")}</p>
                </div>
            ) : (
                <div className="space-y-2">
                    {items.map((n) => (
                        <div
                            key={n.id}
                            className={`flex items-start gap-4 rounded-xl border p-4 transition-colors ${n.read ? "border-border bg-card" : "border-primary/20 bg-primary/5"
                                }`}
                        >
                            <div
                                className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${n.read ? "bg-muted" : "bg-primary/10"
                                    }`}
                            >
                                <Bell className={`h-4 w-4 ${n.read ? "text-muted-foreground" : "text-primary"}`} />
                            </div>
                            <div className="flex-1">
                                <p className="text-sm font-medium text-foreground">{n.title}</p>
                                <p className="mt-0.5 text-sm text-muted-foreground">{n.message}</p>
                                <p className="mt-1 text-xs text-muted-foreground">
                                    {new Date(n.createdAt).toLocaleDateString(getIntlLocale(locale), {
                                        month: "short",
                                        day: "numeric",
                                        year: "numeric",
                                        hour: "numeric",
                                        minute: "2-digit",
                                    })}
                                </p>
                            </div>
                            {!n.read && (
                                <div className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
