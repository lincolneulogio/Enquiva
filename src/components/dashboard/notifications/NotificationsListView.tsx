"use client";

import Link from "next/link";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Bell,
  CreditCard,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  Megaphone,
  Clock,
  ListCheck,
  Users,
  Bus,
  Wallet,
} from "lucide-react";
import { markNotificationsAsRead } from "@/actions/notifications";
import { MarkAllReadButton } from "@/components/dashboard/notifications/MarkAllReadButton";
import { WebPushToggle } from "@/components/dashboard/notifications/WebPushToggle";
import { TablePagination } from "@/components/dashboard/shared/TablePagination";
import { useLocale, useTranslations } from "@/components/providers/LocaleProvider";
import { getIntlLocale, translateNotification } from "@/lib/i18n/core";
import { getNotificationHref } from "@/lib/notifications/notification-links";
import { cn } from "@/lib/utils";

export type NotificationListItem = {
  id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string | Date;
  metadata?: Record<string, unknown> | null;
};

interface NotificationsListViewProps {
  role: string;
  items: NotificationListItem[];
  total: number;
  unread: number;
  page: number;
  limit: number;
  basePath: string;
}

function notificationIcon(type: string) {
  const base = "h-4 w-4";
  switch (type) {
    case "payment_submitted":
    case "payment_status_updated":
      return <CreditCard className={`${base} text-emerald-500`} />;
    case "registration_confirmed":
      return <CheckCircle2 className={`${base} text-blue-500`} />;
    case "waitlist_promoted":
      return <ListCheck className={`${base} text-violet-500`} />;
    case "organizer_request":
    case "organizer_approved":
    case "organizer_rejected":
      return <Users className={`${base} text-orange-500`} />;
    case "subscription_alert":
      return <Wallet className={`${base} text-amber-500`} />;
    case "transport_alert":
      return <Bus className={`${base} text-sky-500`} />;
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

function notificationIconBg(type: string, read: boolean) {
  if (read) return "bg-muted";
  switch (type) {
    case "payment_submitted":
    case "payment_status_updated":
      return "bg-emerald-500/10";
    case "registration_confirmed":
      return "bg-blue-500/10";
    case "waitlist_promoted":
      return "bg-violet-500/10";
    case "organizer_request":
    case "organizer_approved":
    case "organizer_rejected":
      return "bg-orange-500/10";
    case "subscription_alert":
      return "bg-amber-500/10";
    case "transport_alert":
      return "bg-sky-500/10";
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

function NotificationRow({
  item,
  role,
  locale,
  onRead,
}: {
  item: NotificationListItem;
  role: string;
  locale: string;
  onRead: (id: string) => void;
}) {
  const href = getNotificationHref(role, item.type, item.metadata);
  const { title, message } = translateNotification(item.type, item.title, item.message, locale);
  const intlLocale = getIntlLocale(locale as "es" | "en");
  const relativeDate = new Date(item.createdAt).toLocaleDateString(intlLocale, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

  const content = (
  <>
      <div
        className={cn(
          "mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl",
          notificationIconBg(item.type, item.read),
        )}
      >
        {notificationIcon(item.type)}
      </div>
      <div className="min-w-0 flex-1">
        <p className={cn("text-sm font-semibold leading-snug", item.read ? "text-foreground/80" : "text-foreground")}>
          {title}
        </p>
        <p className="mt-0.5 line-clamp-2 text-xs leading-relaxed text-muted-foreground">{message}</p>
        <span className="mt-1.5 inline-flex items-center gap-1 text-[11px] text-muted-foreground/70">
          <Clock className="h-3 w-3" />
          {relativeDate}
        </span>
      </div>
      {!item.read && <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-primary" />}
  </>
  );

  const className = cn(
    "flex items-start gap-3.5 px-4 py-3.5 transition-colors",
    item.read ? "bg-transparent hover:bg-secondary/20" : "bg-primary/[0.03] hover:bg-primary/[0.06]",
  );

  if (href) {
    return (
      <Link
        href={href}
        onClick={() => {
          if (!item.read) onRead(item.id);
        }}
        className={className}
      >
        {content}
      </Link>
    );
  }

  return (
    <button
      type="button"
      onClick={() => {
        if (!item.read) onRead(item.id);
      }}
      className={cn(className, "w-full text-left")}
    >
      {content}
    </button>
  );
}

export function NotificationsListView({
  role,
  items,
  total,
  unread,
  page,
  limit,
  basePath,
}: NotificationsListViewProps) {
  const { locale } = useLocale();
  const t = useTranslations();
  const router = useRouter();
  const [, startTransition] = useTransition();
  const totalPages = Math.max(1, Math.ceil(total / limit));

  const markOne = (id: string) => {
    startTransition(async () => {
      await markNotificationsAsRead([id]);
      router.refresh();
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground sm:text-3xl">
            {t("common.notifications")}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {unread > 0
              ? t("dashboard.admin.unreadNotifications", {
                  count: unread,
                  label:
                    unread === 1
                      ? locale === "en"
                        ? "notification"
                        : "notificación"
                      : locale === "en"
                        ? "notifications"
                        : "notificaciones",
                })
              : t("dashboard.admin.allCaughtUp")}
          </p>
        </div>
        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          {unread > 0 && (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
              <Bell className="h-3.5 w-3.5" />
              {unread} {locale === "en" ? "unread" : "sin leer"}
            </span>
          )}
          {unread > 0 && <MarkAllReadButton />}
          <WebPushToggle />
        </div>
      </div>

      {items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card/60 p-16 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-muted">
            <Bell className="h-7 w-7 text-muted-foreground/50" />
          </div>
          <p className="font-semibold text-foreground">{t("dashboard.admin.noNotifications")}</p>
          <p className="mt-1 text-sm text-muted-foreground">{t("dashboard.admin.notificationsHelp")}</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border bg-card">
          <div className="divide-y divide-border/60">
            {items.map((item) => (
              <NotificationRow
                key={item.id}
                item={item}
                role={role}
                locale={locale}
                onRead={markOne}
              />
            ))}
          </div>
          <TablePagination
            basePath={basePath}
            currentPage={page}
            totalPages={totalPages}
            totalItems={total}
            pageSize={limit}
          />
        </div>
      )}
    </div>
  );
}
