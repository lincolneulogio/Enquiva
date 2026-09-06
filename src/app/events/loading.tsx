import { PageLoadingSpinner } from "@/components/shared/PageLoadingSpinner";

export default function EventsLoading() {
  return <PageLoadingSpinner minHeight="min-h-[60vh]" label="Cargando eventos..." />;
}
