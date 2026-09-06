"use server";

import { getRequestSession } from "@/lib/request-context";
import { EventService } from "@/services/events/event.service";
import type { Category } from "@/lib/db/schema";
import { db } from "@/lib/db";
import { events, categories } from "@/lib/db/schema";
import { eq, desc, asc } from "drizzle-orm";
import { resolveAdminScope, scopeEventCondition } from "@/lib/organizations/admin-scope";
import {
  requireAuth,
  requireOrganizerOrHigher,
  getOrganizerPendingApproval,
  requireOrganizerWithApprovalState,
} from "@/lib/auth/guards";
import { normalizeRole } from "@/lib/auth/rbac";

export async function getCategories(): Promise<Pick<Category, "slug" | "label" | "colorClass">[]> {
  const session = await getRequestSession();
  if (session?.user) {
    const { resolveAdminScopeForUser, getOrganizationIdForUser } = await import(
      "@/lib/organizations/admin-scope"
    );
    const { normalizeRole } = await import("@/lib/auth/rbac");
    const role = normalizeRole(session.user.role);

    if (role === "admin") {
      const scope = await resolveAdminScopeForUser(session.user.id, session.user.role);
      if (scope.mode === "org") return EventService.getCategories(scope.organizationId);
      return [];
    }

    if (role === "organizer") {
      const orgId = await getOrganizationIdForUser(session.user.id);
      if (orgId) return EventService.getCategories(orgId);
      return EventService.getCategories(null);
    }

    if (role === "super_admin") {
      return await db
        .select({ slug: categories.slug, label: categories.label, colorClass: categories.colorClass })
        .from(categories)
        .where(eq(categories.isActive, true))
        .orderBy(asc(categories.sortOrder));
    }
  }
  return EventService.getCategories(null);
}

export async function getPublicEvents(filterInput?: unknown) {
  return EventService.getPublicEvents(filterInput);
}

export async function getFeaturedPublicEvents(limit = 6) {
  return EventService.getFeaturedPublicEvents(limit);
}

export async function getOrganizerEvents() {
  await requireAuth();
  const { user, pending } = await requireOrganizerWithApprovalState();
  if (pending) return [];
  return EventService.getOrganizerEvents(user.id);
}

export async function getOrganizerDashboardSnapshot() {
  await requireAuth();
  const { user, pending } = await requireOrganizerWithApprovalState();
  if (pending) {
    return {
      totalEvents: 0,
      publishedCount: 0,
      totalAttendees: 0,
      recentEvents: [] as Awaited<ReturnType<typeof EventService.getOrganizerEvents>>,
    };
  }
  return EventService.getOrganizerDashboardSnapshot(user.id, 8);
}

export async function getBroadcastEvents(): Promise<{ id: string; title: string }[]> {
  const user = await requireOrganizerOrHigher();
  const role = normalizeRole(user.role);

  if (role === "organizer") {
    const pending = await getOrganizerPendingApproval(user);
    if (pending) return [];
    const rows = await db
      .select({ id: events.id, title: events.title })
      .from(events)
      .where(eq(events.organizerId, user.id))
      .orderBy(desc(events.date))
      .limit(200);
    return rows;
  }

  const adminScope = await resolveAdminScope();
  const orgFilter = scopeEventCondition(adminScope);

  const rows = await db
    .select({ id: events.id, title: events.title })
    .from(events)
    .where(orgFilter ?? undefined)
    .orderBy(desc(events.date))
    .limit(200);

  return rows;
}
