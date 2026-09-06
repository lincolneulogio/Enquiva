import { PageLoadingSpinner } from "@/components/shared/PageLoadingSpinner";

export default function TicketLoading() {
  return <PageLoadingSpinner minHeight="min-h-[60vh]" label="Cargando ticket..." />;
}
