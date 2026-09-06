export interface EventFiltersState {
  category?: string;
  type?: string;
  modality?: string;
  date?: string;
  price?: string;
  accessType?: string;
  eventStatus?: string;
  search?: string;
  location?: string;
}

export interface CategoryOption {
  slug: string;
  label: string;
  colorClass?: string | null;
}

export interface EventFiltersProps {
  currentFilters: EventFiltersState;
  categories?: CategoryOption[];
  totalEvents?: number;
  className?: string;
  sidebarOnly?: boolean;
}
