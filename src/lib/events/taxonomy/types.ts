export interface EventTypeOption {
  slug: string;
  label: string;
  description?: string;
}

export interface EventCategoryDefinition {
  id: string;
  slug: string;
  iconName: string;
  labelEs: string;
  labelEn: string;
  shortLabelEs: string;
  shortLabelEn: string;
  description: string;
  examples: string[];
  colorClass: string;
  featured: boolean;
  sortOrder: number;
  types: EventTypeOption[];
}

export type EventModality = "all" | "in_person" | "online" | "hybrid";

export type EventDateFilter =
  | "all"
  | "today"
  | "tomorrow"
  | "this_week"
  | "this_month"
  | "upcoming"
  | "past";

export type EventPriceFilter = "all" | "free" | "paid";

export type EventAccessFilter = "all" | "free" | "paid" | "registration" | "invitation";

export type EventStatusFilter = "all" | "upcoming" | "ongoing" | "completed";
