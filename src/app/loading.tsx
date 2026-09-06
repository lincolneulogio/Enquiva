import { PageLoadingSpinner } from "@/components/shared/PageLoadingSpinner";

export default function RootLoading() {
  return <PageLoadingSpinner minHeight="min-h-[70vh]" label="Cargando página..." />;
}
