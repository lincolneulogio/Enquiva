export interface EventTypeItem {
  id: string;
  categorySlug: string;
  slug: string;
  label: string;
  description?: string | null;
  sortOrder: number;
  isActive: boolean;
  createdAt?: Date | null;
  updatedAt?: Date | null;
}

export interface CategoryOption {
  slug: string;
  label: string;
}

export interface EventTypesManagerProps {
  initialEventTypes: EventTypeItem[];
  categories: CategoryOption[];
}
