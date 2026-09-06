import { db } from "@/lib/db";
import { events, users, registrations, eventStatusEnum } from "@/lib/db/schema";
import { count, desc, eq, and, gte, lte, inArray, type SQL } from "drizzle-orm";
import { scopeEventCondition, type AdminScope } from "@/lib/organizations/admin-scope";
import {
  getViewerEventStatuses,
  type ViewerEventStatus,
} from "@/lib/events/viewer-event-status";

export interface AdminEventsQueryParams {
  eventId?: string;
  category?: string;
  status?: string;
  fromDate?: string;
  toDate?: string;
}

export async function fetchAdminEventsData({
  params,
  adminScope,
  currentPage,
  pageSize,
  sessionUserId,
}: {
  params: AdminEventsQueryParams;
  adminScope: AdminScope;
  currentPage: number;
  pageSize: number;
  sessionUserId?: string;
}) {
  const orgEventFilter = scopeEventCondition(adminScope);

  const conditions: SQL[] = [];
  if (orgEventFilter) {
    conditions.push(orgEventFilter);
  }
  if (params.eventId) {
    conditions.push(eq(events.id, params.eventId));
  }
  if (params.category) {
    conditions.push(eq(events.category, params.category));
  }
  if (params.status && params.status !== "all") {
    const status = eventStatusEnum.enumValues.find((value) => value === params.status);
    if (status) {
      conditions.push(eq(events.status, status));
    }
  }
  if (params.fromDate) {
    conditions.push(gte(events.date, new Date(`${params.fromDate}T00:00:00.000`)));
  }
  if (params.toDate) {
    conditions.push(lte(events.date, new Date(`${params.toDate}T23:59:59.999`)));
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const [[{ total }], [{ featuredTotal }]] = await Promise.all([
    db
      .select({ total: count() })
      .from(events)
      .innerJoin(users, eq(events.organizerId, users.id))
      .where(whereClause),
    db
      .select({ featuredTotal: count() })
      .from(events)
      .where(eq(events.isFeatured, true)),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const offset = (safePage - 1) * pageSize;

  const allEvents = await db
    .select({
      id: events.id,
      title: events.title,
      slug: events.slug,
      status: events.status,
      category: events.category,
      date: events.date,
      price: events.price,
      capacity: events.capacity,
      isFeatured: events.isFeatured,
      organizerId: events.organizerId,
      organizationId: events.organizationId,
      organizerName: users.name,
    })
    .from(events)
    .innerJoin(users, eq(events.organizerId, users.id))
    .where(whereClause)
    .orderBy(desc(events.createdAt))
    .limit(pageSize)
    .offset(offset);

  const eventIds = allEvents.map((e) => e.id);
  const regCountsMap = new Map<string, number>();
  const viewerStatuses = sessionUserId
    ? await getViewerEventStatuses(sessionUserId, eventIds)
    : new Map<string, ViewerEventStatus>();

  if (eventIds.length > 0) {
    const counts = await db
      .select({
        eventId: registrations.eventId,
        regCount: count(registrations.id),
      })
      .from(registrations)
      .where(inArray(registrations.eventId, eventIds))
      .groupBy(registrations.eventId);

    for (const c of counts) {
      regCountsMap.set(c.eventId, c.regCount);
    }
  }

  return {
    total,
    featuredTotal,
    totalPages,
    safePage,
    offset,
    allEvents,
    regCountsMap,
    viewerStatuses,
  };
}
