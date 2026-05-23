"use server";

import { z } from "zod";
import { db } from "@/lib/db";
import { events } from "@/lib/db/schema";
import { desc, eq } from "drizzle-orm";
import {
    exportSchema,
    ExportScope,
    ExportEventOption,
    ExportPayload,
} from "./exports/types";
import {
    requireUser,
    assertScopeAccess,
} from "./exports/helpers";
import { exportEventsData } from "./exports/events";
import { exportRegistrationsData } from "./exports/registrations";
import { exportPaymentsData } from "./exports/payments";

export type {
    ExportScope,
    ExportResource,
    ExportEventOption,
    ExportColumn,
    ExportCategoryOption,
    ExportPayload,
} from "./exports/types";

export async function getExportEventOptions(scope: ExportScope): Promise<ExportEventOption[]> {
    const user = await requireUser();
    assertScopeAccess(user, scope);

    const rows = await db
        .select({ id: events.id, title: events.title })
        .from(events)
        .where(
            scope === "organizer" && user.role !== "super_admin"
                ? eq(events.organizerId, user.id)
                : undefined
        )
        .orderBy(desc(events.date));

    return rows;
}

export async function getExportData(input: z.infer<typeof exportSchema>): Promise<ExportPayload> {
    const user = await requireUser();
    const validated = exportSchema.parse(input);

    assertScopeAccess(user, validated.scope);

    switch (validated.resource) {
        case "events":
            return exportEventsData(user, validated.scope, validated);
        case "registrations":
            return exportRegistrationsData(user, validated.scope, validated);
        case "payments":
            return exportPaymentsData(user, validated.scope, validated);
        default:
            throw new Error("Tipo de exportación no soportado");
    }
}
