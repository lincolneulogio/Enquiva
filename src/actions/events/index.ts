"use server";

import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { EventService } from "@/services/event.service";
import type { Category } from "@/lib/db/schema";
import {
  type CreateEventInput,
  type UpdateEventInput,
} from "@/lib/validations";

// ─── Auth Helpers ─────────────────────────────────────────────────────────────

async function requireAuth() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) throw new Error("Unauthorized");
  return session.user;
}

async function requireOrganizer() {
  const user = await requireAuth();
  if (user.role !== "organizer" && user.role !== "super_admin" && user.role !== "admin") {
    throw new Error("Only organizers or administrators can perform this action");
  }
  return user;
}

// ─── Categories ───────────────────────────────────────────────────────────────

export async function getCategories(): Promise<Pick<Category, "slug" | "label" | "colorClass">[]> {
  return EventService.getCategories();
}

// ─── Create Event ─────────────────────────────────────────────────────────────

export async function createEvent(input: CreateEventInput) {
  const user = await requireOrganizer();
  const event = await EventService.createEvent(input, user.id);

  revalidatePath("/events");
  revalidatePath("/(dashboard)/organizer");

  return { success: true, event };
}

// ─── Update Event ─────────────────────────────────────────────────────────────

export async function updateEvent(eventId: string, input: UpdateEventInput) {
  const user = await requireOrganizer();
  const event = await EventService.updateEvent(eventId, input, user.id, user.role ?? "member");

  revalidatePath(`/events/${event.slug}`);

  return { success: true, event };
}

// ─── Delete Event ─────────────────────────────────────────────────────────────

export async function deleteEvent(eventId: string) {
  const user = await requireOrganizer();
  await EventService.deleteEvent(eventId, user.id, user.role ?? "member");

  revalidatePath("/events");

  return { success: true };
}

// ─── Get Public Events ────────────────────────────────────────────────────────

export async function getPublicEvents(filterInput?: unknown) {
  return EventService.getPublicEvents(filterInput);
}

// ─── Get Event by Slug ────────────────────────────────────────────────────────

export async function getEventBySlug(slug: string) {
  return EventService.getEventBySlug(slug);
}

// ─── Get Organizer Events ─────────────────────────────────────────────────────

export async function getOrganizerEvents() {
  const user = await requireOrganizer();
  return EventService.getOrganizerEvents(user.id);
}
