"use client";

import { useState, useTransition, useMemo } from "react";
import {
  Mail,
  Download,
  Send,
  Trash2,
  CheckCircle2,
  XCircle,
  Search,
  Filter,
  Loader2,
  Users,
  UserCheck,
  UserX,
  AlertCircle,
  Sparkles,
} from "lucide-react";
import type { NewsletterSubscriber } from "@/lib/db/schema/marketing";
import {
  toggleSubscriberStatusAction,
  deleteSubscriberAction,
  exportNewsletterSubscribersCsvAction,
  sendNewsletterBroadcastAction,
  type NewsletterStats,
} from "@/actions/admin/newsletter";
import { toast } from "sonner";

interface NewsletterManagerProps {
  initialSubscribers: NewsletterSubscriber[];
  initialStats: NewsletterStats;
}

export function NewsletterManager({
  initialSubscribers,
  initialStats,
}: NewsletterManagerProps) {
  const [subscribers, setSubscribers] = useState<NewsletterSubscriber[]>(initialSubscribers);
  const [stats, setStats] = useState<NewsletterStats>(initialStats);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "unsubscribed">("all");
  const [isBroadcastModalOpen, setIsBroadcastModalOpen] = useState(false);
  const [broadcastSubject, setBroadcastSubject] = useState("");
  const [broadcastMessage, setBroadcastMessage] = useState("");
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const [isPending, startTransition] = useTransition();

  // Filtrado del lado cliente para respuesta instantánea
  const filteredSubscribers = useMemo(() => {
    return subscribers.filter((sub) => {
      const matchesSearch = sub.email.toLowerCase().includes(searchTerm.toLowerCase().trim());
      const matchesStatus = statusFilter === "all" || sub.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [subscribers, searchTerm, statusFilter]);

  const handleExportCsv = () => {
    startTransition(async () => {
      try {
        const csvContent = await exportNewsletterSubscribersCsvAction();
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute(
          "download",
          `enquiva-suscriptores-boletin-${new Date().toISOString().slice(0, 10)}.csv`
        );
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        toast.success("Archivo CSV exportado exitosamente.");
      } catch {
        toast.error("Error al exportar los datos.");
      }
    });
  };

  const handleToggleStatus = (sub: NewsletterSubscriber) => {
    const nextStatus = sub.status === "active" ? "unsubscribed" : "active";
    setSubscribers((prev) =>
      prev.map((s) => (s.id === sub.id ? { ...s, status: nextStatus } : s))
    );
    setStats((prev) => ({
      ...prev,
      active: nextStatus === "active" ? prev.active + 1 : Math.max(0, prev.active - 1),
      unsubscribed: nextStatus === "unsubscribed" ? prev.unsubscribed + 1 : Math.max(0, prev.unsubscribed - 1),
    }));

    startTransition(async () => {
      try {
        await toggleSubscriberStatusAction(sub.id, nextStatus);
        toast.success(
          nextStatus === "active"
            ? "Suscriptor activado."
            : "Suscriptor dado de baja."
        );
      } catch {
        setSubscribers((prev) =>
          prev.map((s) => (s.id === sub.id ? { ...s, status: sub.status } : s))
        );
        toast.error("Error al cambiar el estado del suscriptor.");
      }
    });
  };

  const handleDelete = (id: string) => {
    startTransition(async () => {
      try {
        const res = await deleteSubscriberAction(id);
        if (res.success) {
          const removed = subscribers.find((s) => s.id === id);
          setSubscribers((prev) => prev.filter((s) => s.id !== id));
          if (removed) {
            setStats((prev) => ({
              total: Math.max(0, prev.total - 1),
              active: removed.status === "active" ? Math.max(0, prev.active - 1) : prev.active,
              unsubscribed: removed.status === "unsubscribed" ? Math.max(0, prev.unsubscribed - 1) : prev.unsubscribed,
            }));
          }
          toast.success("Suscriptor eliminado.");
          setDeleteConfirmId(null);
        } else {
          toast.error("No se pudo eliminar el suscriptor.");
        }
      } catch {
        toast.error("Error al eliminar suscriptor.");
      }
    });
  };

  const handleSendBroadcast = (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastSubject.trim() || !broadcastMessage.trim()) {
      toast.error("Por favor completa el asunto y el mensaje.");
      return;
    }

    startTransition(async () => {
      try {
        const res = await sendNewsletterBroadcastAction({
          subject: broadcastSubject,
          message: broadcastMessage,
        });

        if (res.success) {
          toast.success(`Comunicado enviado a ${res.recipientCount} suscriptores activos.`);
          setIsBroadcastModalOpen(false);
          setBroadcastSubject("");
          setBroadcastMessage("");
        } else {
          toast.error(res.error ?? "No se pudo enviar el comunicado.");
        }
      } catch {
        toast.error("Error inesperado al enviar comunicado.");
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Total Suscriptores
            </span>
            <div className="p-2 rounded-xl bg-primary/10 text-primary">
              <Users className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="font-display text-3xl font-bold text-foreground">
              {stats.total}
            </span>
            <span className="text-xs text-muted-foreground">registrados</span>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Suscriptores Activos
            </span>
            <div className="p-2 rounded-xl bg-green-500/10 text-green-600 dark:text-green-400">
              <UserCheck className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="font-display text-3xl font-bold text-green-600 dark:text-green-400">
              {stats.active}
            </span>
            <span className="text-xs text-muted-foreground">reciben correos</span>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Bajas / Desuscritos
            </span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500">
              <UserX className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="font-display text-3xl font-bold text-amber-600 dark:text-amber-400">
              {stats.unsubscribed}
            </span>
            <span className="text-xs text-muted-foreground">inactivos</span>
          </div>
        </div>
      </div>

      {/* Control Bar: Search + Filters + Export + Broadcast */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 flex-1">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por correo electrónico..."
              className="w-full rounded-xl border border-border bg-background pl-9 pr-4 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          {/* Status Tabs */}
          <div className="flex items-center rounded-xl border border-border bg-muted/40 p-1 text-xs">
            <button
              type="button"
              onClick={() => setStatusFilter("all")}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                statusFilter === "all"
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Todos ({stats.total})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter("active")}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                statusFilter === "active"
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Activos ({stats.active})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter("unsubscribed")}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                statusFilter === "unsubscribed"
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Bajas ({stats.unsubscribed})
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleExportCsv}
            disabled={isPending || stats.total === 0}
            className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-medium text-foreground hover:bg-muted transition-colors disabled:opacity-50"
          >
            <Download className="h-4 w-4 text-muted-foreground" />
            Exportar CSV
          </button>
          <button
            type="button"
            onClick={() => setIsBroadcastModalOpen(true)}
            disabled={stats.active === 0}
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground shadow-sm hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            <Send className="h-4 w-4" />
            Redactar Comunicado
          </button>
        </div>
      </div>

      {/* Table Container */}
      {filteredSubscribers.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card p-12 text-center">
          <Mail className="mx-auto h-12 w-12 text-muted-foreground/40" />
          <h3 className="mt-4 font-semibold text-foreground">No se encontraron suscriptores</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {searchTerm
              ? "Ningún correo coincide con los criterios de búsqueda actuales."
              : "Aún no hay suscriptores registrados en el boletín."}
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="border-b border-border bg-muted/40 text-muted-foreground font-medium">
                <tr>
                  <th className="px-4 py-3.5">N°</th>
                  <th className="px-4 py-3.5">Correo Electrónico</th>
                  <th className="px-4 py-3.5">Origen</th>
                  <th className="px-4 py-3.5">Fecha de Suscripción</th>
                  <th className="px-4 py-3.5 text-center">Estado</th>
                  <th className="px-4 py-3.5 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredSubscribers.map((sub, index) => {
                  const isActive = sub.status === "active";
                  return (
                    <tr key={sub.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3.5 text-muted-foreground font-mono">{index + 1}</td>
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
                            onClick={() => handleToggleStatus(sub)}
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
                            onClick={() => setDeleteConfirmId(sub.id)}
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
      )}

      {/* Modal Redactar Comunicado a Suscriptores */}
      {isBroadcastModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-xl rounded-2xl border border-border bg-card p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <h3 className="font-display text-lg font-semibold text-foreground flex items-center gap-2">
                <Send className="h-5 w-5 text-primary" />
                Comunicado a Suscriptores del Boletín
              </h3>
              <button
                type="button"
                onClick={() => setIsBroadcastModalOpen(false)}
                className="text-muted-foreground hover:text-foreground text-sm font-medium"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSendBroadcast} className="mt-5 space-y-4">
              <div className="rounded-xl border border-primary/30 bg-primary/5 p-3.5 flex items-center gap-3">
                <Sparkles className="h-5 w-5 text-primary shrink-0" />
                <p className="text-xs text-foreground">
                  Este mensaje se enviará directamente por correo a los <strong>{stats.active} suscriptores activos</strong> registrados a través de la portada.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-1.5">
                  Asunto del Correo *
                </label>
                <input
                  type="text"
                  required
                  value={broadcastSubject}
                  onChange={(e) => setBroadcastSubject(e.target.value)}
                  placeholder="Ej. Nuevos eventos disponibles en Enquiva este mes"
                  className="w-full rounded-xl border border-border bg-background px-3.5 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-1.5">
                  Contenido del Mensaje *
                </label>
                <textarea
                  required
                  rows={6}
                  value={broadcastMessage}
                  onChange={(e) => setBroadcastMessage(e.target.value)}
                  placeholder="Escribe el mensaje o anuncio para los miembros de la comunidad..."
                  className="w-full rounded-xl border border-border bg-background px-3.5 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary leading-relaxed"
                />
              </div>

              <div className="flex items-center justify-end gap-3 border-t border-border pt-4">
                <button
                  type="button"
                  onClick={() => setIsBroadcastModalOpen(false)}
                  className="rounded-xl border border-border px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2 text-sm font-medium text-primary-foreground shadow-sm hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                  {isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                  Enviar a {stats.active} suscriptores
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Confirmar Eliminación */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-6 shadow-xl">
            <h4 className="font-semibold text-foreground">¿Eliminar este suscriptor?</h4>
            <p className="mt-2 text-xs text-muted-foreground">
              Esta acción eliminará permanentemente la dirección de correo de la lista de difusión.
            </p>
            <div className="mt-5 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeleteConfirmId(null)}
                className="rounded-xl border border-border px-3.5 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => handleDelete(deleteConfirmId)}
                disabled={isPending}
                className="inline-flex items-center gap-1.5 rounded-xl bg-red-600 px-4 py-1.5 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-50"
              >
                {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
