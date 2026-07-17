"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  getPusherClient,
  PUSHER_CHANNELS,
  PUSHER_EVENTS,
  type TableRefreshPayload,
} from "@/lib/pusher/client";
import { normalizeRole } from "@/lib/auth/rbac";
import { shouldRefreshRealtimePath } from "@/lib/pusher/refresh-policy";

const NOTIFICATION_TYPES_REFRESH_ALL_PAGES = new Set([
  "registration_confirmed",
  "waitlist_promoted",
  "payment_submitted",
  "payment_status_updated",
]);

export function useRealtimeDashboardSync({
  userId,
  role,
  organizationId,
}: {
  userId: string;
  role?: string | null;
  organizationId?: string | null;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const pathnameRef = useRef(pathname);
  const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cancelledRef = useRef(false);
  const routerRef = useRef(router);

  useEffect(() => {
    pathnameRef.current = pathname;
  }, [pathname]);

  useEffect(() => {
    routerRef.current = router;
  }, [router]);

  useEffect(() => {
    cancelledRef.current = false;
    return () => {
      cancelledRef.current = true;
      if (refreshTimerRef.current) {
        clearTimeout(refreshTimerRef.current);
        refreshTimerRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    const normalizedRole = normalizeRole(role ?? "member");
    const isStaff =
      normalizedRole === "admin" ||
      normalizedRole === "super_admin" ||
      normalizedRole === "organizer";
    if (!isStaff) return;
    const dashboardChannel =
      normalizedRole === "super_admin"
        ? PUSHER_CHANNELS.platformDashboard
        : normalizedRole === "admin"
          ? organizationId
            ? PUSHER_CHANNELS.organizationDashboard(organizationId)
            : null
          : PUSHER_CHANNELS.organizerDashboard(userId);
    if (!dashboardChannel) return;

    const scheduleRefresh = (payload?: TableRefreshPayload) => {
      if (cancelledRef.current) return;
      const currentPath = pathnameRef.current;
      if (payload && !shouldRefreshRealtimePath(currentPath, payload)) return;

      if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
      refreshTimerRef.current = setTimeout(() => {
        if (!cancelledRef.current) routerRef.current.refresh();
      }, 350);
    };

    const pusher = getPusherClient();
    const channel = pusher.subscribe(dashboardChannel);

    channel.bind(PUSHER_EVENTS.tableRefresh, (data: TableRefreshPayload) => {
      scheduleRefresh(data);
    });
    channel.bind(PUSHER_EVENTS.newRegistration, () => {
      scheduleRefresh({ resource: ["registrations", "attendees", "events"] });
    });
    channel.bind(PUSHER_EVENTS.attendeeCountUpdated, () => {
      scheduleRefresh({ resource: ["registrations", "attendees"] });
    });
    channel.bind(PUSHER_EVENTS.paymentUpdated, () => {
      scheduleRefresh({ resource: "payments" });
    });
    channel.bind(PUSHER_EVENTS.eventUpdated, () => {
      scheduleRefresh({ resource: "events" });
    });
    channel.bind(PUSHER_EVENTS.checkIn, () => {
      scheduleRefresh({ resource: ["registrations", "attendees"] });
    });

    return () => {
      channel.unbind_all();
      channel.unsubscribe();
    };
  }, [organizationId, role, userId]);

  useEffect(() => {
    const scheduleRefresh = (payload?: TableRefreshPayload) => {
      if (cancelledRef.current) return;
      const currentPath = pathnameRef.current;
      if (payload && !shouldRefreshRealtimePath(currentPath, payload)) return;

      if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
      refreshTimerRef.current = setTimeout(() => {
        if (!cancelledRef.current) routerRef.current.refresh();
      }, 350);
    };

    const pusher = getPusherClient();
    const channel = pusher.subscribe(PUSHER_CHANNELS.userNotifications(userId));

    channel.bind(PUSHER_EVENTS.tableRefresh, (data: TableRefreshPayload) => {
      scheduleRefresh(data);
    });
    channel.bind(
      PUSHER_EVENTS.notificationCreated,
      (data: { type?: string; eventId?: string }) => {
        if (data.type && NOTIFICATION_TYPES_REFRESH_ALL_PAGES.has(data.type)) {
          scheduleRefresh({
            resource: data.type.includes("payment")
              ? ["payments", "registrations", "events"]
              : ["registrations", "events", "payments"],
            eventId: data.eventId,
            userId,
          });
        }
      },
    );

    return () => {
      channel.unbind_all();
      channel.unsubscribe();
    };
  }, [userId]);
}
