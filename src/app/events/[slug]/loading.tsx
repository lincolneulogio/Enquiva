import { PageLoadingSpinner } from "@/components/shared/PageLoadingSpinner";

export default function EventDetailLoading() {
  return <PageLoadingSpinner minHeight="min-h-[60vh]" label="Cargando evento..." />;
}
