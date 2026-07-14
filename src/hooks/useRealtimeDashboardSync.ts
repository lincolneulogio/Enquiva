"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  getPusherClient,
  PUSHER_CHANNELS,
  PUSHER_EVENTS,
  type TableRefreshPayload,
  type TableResource,
} from "@/lib/pusher/client";
import { normalizeRole } from "@/lib/auth/rbac";

function matchesResource(pathname: string, resource: TableResource): boolean {
  switch (resource) {
    case "dashboard":
      return true;
    case "registrations":
      return /\/(admin|superadmin)\/registrations/.test(pathname);
    case "attendees":
      return /\/organizer\/attendees/.test(pathname) || /\/(admin|superadmin)\/registrations/.test(pathname);
    case "events":
      return (
        /\/(admin|superadmin|organizer)\/events/.test(pathname) ||
        /\/member\/events/.test(pathname) ||
        /\/superadmin\/my-events/.test(pathname)
      );
    case "payments":
      return /\/(admin|superadmin|organizer|member)\/payments/.test(pathname);
    case "users":
      return /\/(admin|superadmin)\/users/.test(pathname);
    case "team":
      return /\/admin\/team/.test(pathname);
    case "transport":
      return /\/member\/transport/.test(pathname) || /\/organizer\/transport/.test(pathname);
    case "broadcasts":
      return /\/(admin|superadmin|organizer)\/broadcasts/.test(pathname);
    case "categories":
      return /\/admin\/categories/.test(pathname);
    case "plans":
      return /\/superadmin\/plans/.test(pathname);
    default:
      return false;
  }
}

function shouldRefreshPath(pathname: string, payload: TableRefreshPayload) {
  const resources = Array.isArray(payload.resource) ? payload.resource : [payload.resource];
  return resources.some((resource) => matchesResource(pathname, resource));
}

const NOTIFICATION_TYPES_REFRESH_ALL_PAGES = new Set([
  "registration_confirmed",
  "waitlist_promoted",
  "payment_submitted",
  "payment_status_updated",
]);

export function useRealtimeDashboardSync({
  userId,
  role,
}: {
  userId: string;
  role?: string | null;
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

    const scheduleRefresh = (payload?: TableRefreshPayload) => {
      if (cancelledRef.current) return;
      const currentPath = pathnameRef.current;
      if (payload && !shouldRefreshPath(currentPath, payload)) return;

      if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
      refreshTimerRef.current = setTimeout(() => {
        if (!cancelledRef.current) routerRef.current.refresh();
      }, 350);
    };

    const pusher = getPusherClient();
    const channel = pusher.subscribe(PUSHER_CHANNELS.adminDashboard);

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
  }, [role]);

  useEffect(() => {
    const scheduleRefresh = (payload?: TableRefreshPayload) => {
      if (cancelledRef.current) return;
      const currentPath = pathnameRef.current;
      if (payload && !shouldRefreshPath(currentPath, payload)) return;

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
