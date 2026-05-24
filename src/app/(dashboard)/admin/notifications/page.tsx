import { getNotificationsPaginated } from "@/actions/notifications";
import { Bell } from "lucide-react";
import { MarkAllReadButton } from "@/components/dashboard";
import { getI18n } from "@/lib/i18n/server";
import { getIntlLocale, translateNotification } from "@/lib/i18n/core";
import { TablePagination } from "@/components/dashboard";

interface AdminNotificationsPageProps {
    searchParams: Promise<{
        page?: string;
    }>;
}

const PAGE_SIZE = 10;

export default async function AdminNotificationsPage({ searchParams }: AdminNotificationsPageProps) {
    const { locale, t } = await getI18n();
    const params = await searchParams;
    const requestedPage = Number(params.page ?? "1");
    const currentPage = Number.isFinite(requestedPage) && requestedPage > 0 ? Math.floor(requestedPage) : 1;

    const { items, total, unread, page } = await getNotificationsPaginated(currentPage, PAGE_SIZE);
    const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
    const safePage = Math.min(page, totalPages);
    const rowStart = (safePage - 1) * PAGE_SIZE;

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="font-display text-3xl font-semibold text-foreground">
                        {t("common.notifications")}
                    </h1>
                    <p className="mt-1 text-muted-foreground">
                        {unread > 0
                            ? t("dashboard.admin.unreadNotifications", {
                                count: unread,
                                label: unread === 1 ? (locale === "en" ? "notification" : "notificación") : (locale === "en" ? "notifications" : "notificaciones"),
                            })
                            : t("dashboard.admin.allCaughtUp")}
                    </p>
                </div>
                {unread > 0 && <MarkAllReadButton />}
            </div>

            {items.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border bg-card p-12 text-center">
                    <Bell className="mx-auto h-10 w-10 text-muted-foreground/50" />
                    <p className="mt-4 font-medium text-foreground">{t("dashboard.admin.noNotifications")}</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                        {t("dashboard.admin.notificationsHelp")}
                    </p>
                </div>
            ) : (
                <div className="overflow-hidden rounded-xl border border-border bg-card">
                    <p className="px-3 pt-2 text-[11px] text-muted-foreground sm:hidden">↔ Scroll</p>
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[820px] text-sm">
                            <thead>
                                <tr className="border-b border-border bg-muted/50">
                                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">N°</th>
                                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">{t("common.status")}</th>
                                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">{t("dashboard.admin.title")}</th>
                                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Mensaje</th>
                                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">{t("common.date")}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {items.map((n, index) => {
                                    const { title: displayTitle, message: displayMessage } = translateNotification(
                                        n.type,
                                        n.title,
                                        n.message,
                                        locale
                                    );
                                    return (
                                        <tr key={n.id} className="hover:bg-muted/30 transition-colors">
                                            <td className="px-4 py-3 text-muted-foreground">{rowStart + index + 1}</td>
                                            <td className="px-4 py-3">
                                                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${n.read ? "bg-secondary text-foreground" : "bg-primary/10 text-primary"}`}>
                                                    {n.read ? "Leída" : "No leída"}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 font-medium text-foreground">{displayTitle}</td>
                                            <td className="px-4 py-3 text-muted-foreground">{displayMessage}</td>
                                            <td className="px-4 py-3 text-muted-foreground">
                                                {new Date(n.createdAt).toLocaleDateString(getIntlLocale(locale), {
                                                    month: "short",
                                                    day: "numeric",
                                                    year: "numeric",
                                                    hour: "numeric",
                                                    minute: "2-digit",
                                                })}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    <TablePagination
                        basePath="/admin/notifications"
                        currentPage={safePage}
                        totalPages={totalPages}
                        totalItems={total}
                        pageSize={PAGE_SIZE}
                    />
                </div>
            )}
        </div>
    );
}
