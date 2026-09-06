import { db } from "@/lib/db";
import {
  registrations,
  events,
  users,
  payments,
  transportBookings,
  transportRoutes,
  registrationStatusEnum,
  registrationGuests,
} from "@/lib/db/schema";
import { eq, desc, count, and, gte, lte, sql, inArray, type SQL } from "drizzle-orm";
import { isGuestRegistration, parseGuestRegistrationIds } from "@/lib/registrations/guests";
import { scopeEventCondition, type AdminScope } from "@/lib/organizations/admin-scope";

export interface AdminRegistrationsQueryParams {
  eventId?: string;
  category?: string;
  status?: string;
  fromDate?: string;
  toDate?: string;
}

export async function fetchAdminRegistrationsData({
  params,
  adminScope,
  currentPage,
  pageSize,
}: {
  params: AdminRegistrationsQueryParams;
  adminScope: AdminScope;
  currentPage: number;
  pageSize: number;
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
    const status = registrationStatusEnum.enumValues.find((value) => value === params.status);
    if (status) {
      conditions.push(eq(registrations.status, status));
    }
  }
  if (params.fromDate) {
    conditions.push(gte(registrations.registeredAt, new Date(`${params.fromDate}T00:00:00.000`)));
  }
  if (params.toDate) {
    conditions.push(lte(registrations.registeredAt, new Date(`${params.toDate}T23:59:59.999`)));
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const [{ total }] = await db
    .select({ total: count() })
    .from(registrations)
    .innerJoin(events, eq(registrations.eventId, events.id))
    .leftJoin(users, eq(registrations.userId, users.id))
    .leftJoin(registrationGuests, eq(registrations.guestId, registrationGuests.id))
    .where(whereClause);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const offset = (safePage - 1) * pageSize;

  const allRegistrations = await db
    .select({
      id: registrations.id,
      status: registrations.status,
      registeredAt: registrations.registeredAt,
      checkedInAt: registrations.checkedInAt,
      guestId: registrations.guestId,
      parentRegistrationId: registrations.parentRegistrationId,
      wantsCertificate: registrations.wantsCertificate,
      certificateCode: registrations.certificateCode,
      event: {
        id: events.id,
        title: events.title,
        slug: events.slug,
        date: events.date,
        location: events.location,
        isVirtual: events.isVirtual,
        hasCertificate: events.hasCertificate,
        certificateTitle: events.certificateTitle,
        certificatePrice: events.certificatePrice,
      },
      attendee: {
        id: sql<string>`coalesce(${users.id}, ${registrationGuests.id}::text)`,
        name: sql<string>`coalesce(${registrationGuests.name}, ${users.name}, 'Asistente')`,
        email: users.email,
      },
    })
    .from(registrations)
    .innerJoin(events, eq(registrations.eventId, events.id))
    .leftJoin(users, eq(registrations.userId, users.id))
    .leftJoin(registrationGuests, eq(registrations.guestId, registrationGuests.id))
    .where(whereClause)
    .orderBy(desc(registrations.registeredAt))
    .limit(pageSize)
    .offset(offset);

  const guestRegs = allRegistrations.filter((r) =>
    isGuestRegistration({
      guestId: r.guestId,
      parentRegistrationId: r.parentRegistrationId,
      email: r.attendee?.email,
    }),
  );
  const guestIds = guestRegs.map((r) => r.id);
  const invitersMap = new Map<string, { name: string | null; email: string }>();
  const guestToParentRegIdMap = new Map<string, string>();

  if (guestIds.length > 0) {
    try {
      const guestRows = await db
        .select({
          guestId: registrations.id,
          parentId: registrations.parentRegistrationId,
          notes: registrations.notes,
        })
        .from(registrations)
        .where(inArray(registrations.id, guestIds));

      const parentIdsFromFk = guestRows
        .map((g) => g.parentId)
        .filter((id): id is string => Boolean(id));

      const eventId = allRegistrations[0].event.id;
      const parentsWithNotes = await db
        .select({
          id: registrations.id,
          notes: registrations.notes,
          inviterName: users.name,
          inviterEmail: users.email,
        })
        .from(registrations)
        .innerJoin(users, eq(registrations.userId, users.id))
        .where(
          and(
            eq(registrations.eventId, eventId),
            sql`${registrations.notes} IS NOT NULL`,
          ),
        );

      const parentIds = new Set([
        ...parentIdsFromFk,
        ...parentsWithNotes
          .filter((p) => parseGuestRegistrationIds(p.notes).some((id) => guestIds.includes(id)))
          .map((p) => p.id),
      ]);

      if (parentIds.size > 0) {
        const parents = await db
          .select({
            id: registrations.id,
            inviterName: users.name,
            inviterEmail: users.email,
          })
          .from(registrations)
          .innerJoin(users, eq(registrations.userId, users.id))
          .where(inArray(registrations.id, Array.from(parentIds)));

        const parentInfo = new Map(parents.map((p) => [p.id, p]));

        for (const guest of guestRows) {
          let parentId = guest.parentId;
          if (!parentId) {
            for (const p of parentsWithNotes) {
              if (parseGuestRegistrationIds(p.notes).includes(guest.guestId)) {
                parentId = p.id;
                break;
              }
            }
          }
          if (!parentId) continue;
          const info = parentInfo.get(parentId);
          if (!info) continue;
          invitersMap.set(guest.guestId, {
            name: info.inviterName,
            email: info.inviterEmail,
          });
          guestToParentRegIdMap.set(guest.guestId, parentId);
        }
      }
    } catch (err) {
      console.error("Failed to load inviters map:", err);
    }
  }

  const currentRegIds = allRegistrations.map((r) => r.id);
  const parentRegIds = Array.from(guestToParentRegIdMap.values());
  const allLookupIds = Array.from(new Set([...currentRegIds, ...parentRegIds]));

  const paymentsMap = new Map<string, { amount: string; status: string; method: string; currency: string }>();
  const transportMap = new Map<string, { seats: number; routeName: string | null; totalSeats: number | null }>();

  if (allLookupIds.length > 0) {
    const paymentsList = await db
      .select({
        registrationId: payments.registrationId,
        amount: payments.amount,
        status: payments.status,
        method: payments.method,
        currency: payments.currency,
      })
      .from(payments)
      .where(inArray(payments.registrationId, allLookupIds))
      .orderBy(desc(payments.createdAt));

    for (const p of paymentsList) {
      if (p.registrationId && !paymentsMap.has(p.registrationId)) {
        paymentsMap.set(p.registrationId, p);
      }
    }

    const bookingsList = await db
      .select({
        registrationId: transportBookings.registrationId,
        seats: transportBookings.seats,
        routeName: transportRoutes.name,
        totalSeats: transportRoutes.totalSeats,
      })
      .from(transportBookings)
      .leftJoin(transportRoutes, eq(transportRoutes.id, transportBookings.routeId))
      .where(inArray(transportBookings.registrationId, allLookupIds));

    for (const b of bookingsList) {
      if (b.registrationId) {
        transportMap.set(b.registrationId, {
          seats: b.seats,
          routeName: b.routeName,
          totalSeats: b.totalSeats,
        });
      }
    }
  }

  return {
    total,
    totalPages,
    safePage,
    offset,
    allRegistrations,
    invitersMap,
    guestToParentRegIdMap,
    paymentsMap,
    transportMap,
  };
}
