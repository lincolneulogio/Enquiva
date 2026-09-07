import { Mail, CheckCircle2, XCircle, Trash2 } from "lucide-react";
import type { NewsletterSubscriber } from "@/lib/db/schema/marketing";

interface NewsletterSubscribersTableProps {
  subscribers: NewsletterSubscriber[];
  searchTerm: string;
  isPending: boolean;
  onToggleStatus: (sub: NewsletterSubscriber) => void;
  onConfirmDelete: (id: string) => void;
}

export function NewsletterSubscribersTable({
  subscribers,
  searchTerm,
  isPending,
  onToggleStatus,
  onConfirmDelete,
}: NewsletterSubscribersTableProps) {
  if (subscribers.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-card p-12 text-center">
        <Mail className="mx-auto h-12 w-12 text-muted-foreground/40" />
        <h3 className="mt-4 font-semibold text-foreground">No se encontraron suscriptores</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          {searchTerm
            ? "Ningún correo coincide con los criterios de búsqueda actuales."
            : "Aún no hay suscriptores registrados en el boletín."}
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs sm:text-sm">
          <thead className="border-b border-border bg-muted/40 text-muted-foreground font-medium">
            <tr>
              <th className="px-4 py-3.5">N°</th>
              <th className="px-4 py-3.5">Nombre</th>
              <th className="px-4 py-3.5">Correo Electrónico</th>
              <th className="px-4 py-3.5">Origen</th>
              <th className="px-4 py-3.5">Fecha de Suscripción</th>
              <th className="px-4 py-3.5 text-center">Estado</th>
              <th className="px-4 py-3.5 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {subscribers.map((sub, index) => {
              const isActive = sub.status === "active";
              return (
                <tr key={sub.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3.5 text-muted-foreground font-mono">{index + 1}</td>
                  <td className="px-4 py-3.5 font-medium text-foreground">
                    {sub.name?.trim() || <span className="text-muted-foreground">—</span>}
                  </td>
                  <td className="px-4 py-3.5 font-medium text-foreground">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-primary shrink-0" />
                      <span>{sub.email}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3.5 text-muted-foreground">
                    <span className="inline-flex items-center rounded-lg border border-border/80 bg-muted/40 px-2 py-0.5 text-xs font-mono">
                      {sub.source}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-muted-foreground">
                    {new Date(sub.createdAt).toLocaleString("es-PE", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </td>
                  <td className="px-4 py-3.5 text-center">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        isActive
                          ? "border border-green-200 bg-green-100 text-green-800 dark:border-green-800/40 dark:bg-green-950/30 dark:text-green-400"
                          : "border border-amber-200 bg-amber-100 text-amber-800 dark:border-amber-800/40 dark:bg-amber-950/30 dark:text-amber-400"
                      }`}
                    >
                      {isActive ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                      {isActive ? "Activo" : "Baja"}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => onToggleStatus(sub)}
                        disabled={isPending}
                        title={isActive ? "Marcar como desuscrito" : "Reactivar suscriptor"}
                        className={`px-2.5 py-1 rounded-lg border text-xs font-medium transition-colors ${
                          isActive
                            ? "border-amber-200/60 bg-amber-50 text-amber-700 hover:bg-amber-100 dark:border-amber-900/40 dark:bg-amber-950/20 dark:text-amber-300"
                            : "border-green-200/60 bg-green-50 text-green-700 hover:bg-green-100 dark:border-green-900/40 dark:bg-green-950/20 dark:text-green-300"
                        }`}
                      >
                        {isActive ? "Dar de baja" : "Reactivar"}
                      </button>
                      <button
                        type="button"
                        onClick={() => onConfirmDelete(sub.id)}
                        title="Eliminar de la lista"
                        className="p-1.5 rounded-lg border border-red-200/50 text-red-600 hover:bg-red-50 dark:border-red-900/40 dark:text-red-400 dark:hover:bg-red-950/20 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
