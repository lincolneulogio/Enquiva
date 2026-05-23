import { z } from "zod";

export type ExportScope = "admin" | "organizer";
export type ExportResource = "events" | "registrations" | "payments";

export interface ExportEventOption {
    id: string;
    title: string;
}

export interface ExportColumn {
    key: string;
    label: string;
}

export interface ExportCategoryOption {
    value: string;
    label: string;
}

export interface ExportPayload {
    title: string;
    subtitle?: string;
    suggestedFileName: string;
    generatedAt: string;
    columns: ExportColumn[];
    rows: Array<Record<string, string | number | null>>;
    summary: Array<{ label: string; value: string | number }>;
}

export const exportSchema = z.object({
    resource: z.enum(["events", "registrations", "payments"]),
    scope: z.enum(["admin", "organizer"]),
    eventId: z.string().uuid().optional().nullable(),
    status: z.string().optional().nullable(),
    category: z.string().optional().nullable(),
    fromDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
    toDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
});

export type SessionUser = {
    id: string;
    role?: string | null;
};

export type ExportFilters = Pick<z.infer<typeof exportSchema>, "eventId" | "status" | "category" | "fromDate" | "toDate">;
