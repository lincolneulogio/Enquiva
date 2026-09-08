"use client";

import { useState, useRef, useCallback, useTransition, type FormEvent } from "react";
import { createPortal } from "react-dom";
import {
  Plus,
  Edit2,
  Trash2,
  ArrowUp,
  ArrowDown,
  Eye,
  EyeOff,
  Loader2,
  Mail,
  MessageSquareHeart,
  Building2,
  MapPin,
  Ticket,
  Clock,
  type LucideIcon,
} from "lucide-react";
import type { PageSection } from "@/lib/db/schema";
import {
  createPageSectionAction,
  updatePageSectionAction,
  togglePageSectionActiveAction,
  deletePageSectionAction,
  reorderPageSectionsAction,
} from "@/actions/admin/pages";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export type ContactChannelType = "email" | "support" | "corporate" | "address";

export const CONTACT_CHANNEL_TYPES: Array<{
  value: ContactChannelType;
  labelEs: string;
  labelEn: string;
  icon: LucideIcon;
  fast?: boolean;
}> = [
  { value: "email", labelEs: "Atención general", labelEn: "General inbox", icon: Mail },
  {
    value: "support",
    labelEs: "Soporte y validación",
    labelEn: "Support & validation",
    icon: MessageSquareHeart,
    fast: true,
  },
  { value: "corporate", labelEs: "Eventos empresariales", labelEn: "Corporate events", icon: Building2 },
  { value: "address", labelEs: "Sede central", labelEn: "Headquarters", icon: MapPin },
];

export type AttentionCardType = "attendee" | "business" | "hours";

export const ATTENTION_CARD_TYPES: Array<{
  value: AttentionCardType;
  labelEs: string;
  labelEn: string;
  icon: LucideIcon;
  online?: boolean;
}> = [
  { value: "attendee", labelEs: "Soporte a Asistentes", labelEn: "Attendee Support", icon: Ticket },
  { value: "business", labelEs: "Empresarial & Eventos", labelEn: "Business & Events", icon: Building2 },
  { value: "hours", labelEs: "Horario Continuo", labelEn: "Always-on Hours", icon: Clock, online: true },
];

function contactTypeLabel(type: string, isEn: boolean): string {
  const entry = CONTACT_CHANNEL_TYPES.find((t) => t.value === type);
  if (!entry) return type;
  return isEn ? entry.labelEn : entry.labelEs;
}

function attentionTypeLabel(type: string, isEn: boolean): string {
  const entry = ATTENTION_CARD_TYPES.find((t) => t.value === type);
  if (!entry) return type;
  return isEn ? entry.labelEn : entry.labelEs;
}

function stripHtml(value: string | null | undefined): string {
  return (value ?? "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

type FormData = {
  kind: string;
  role: string;
  titleEs: string;
  titleEn: string;
  subtitleEs: string;
  subtitleEn: string;
  bodyEs: string;
  bodyEn: string;
  sortOrder: number;
  isActive: boolean;
};

const EMPTY_FORM: FormData = {
  kind: "contact",
  role: "email",
  titleEs: "",
  titleEn: "",
  subtitleEs: "",
  subtitleEn: "",
  bodyEs: "",
  bodyEn: "",
  sortOrder: 0,
  isActive: true,
};

function mapSectionToForm(section: PageSection): FormData {
  return {
    kind: section.kind ?? "contact",
    role: section.role ?? "email",
    titleEs: section.titleEs ?? "",
    titleEn: section.titleEn ?? "",
    subtitleEs: section.subtitleEs ?? "",
    subtitleEn: section.subtitleEn ?? "",
    bodyEs: section.bodyEs ?? "",
    bodyEn: section.bodyEn ?? "",
    sortOrder: section.sortOrder ?? 0,
    isActive: section.isActive ?? true,
  };
}

export type InheritedContactValues = {
  email: string;
  support: string;
};

function inheritedForRole(role: string | null, inherited?: InheritedContactValues): string {
  if (!inherited) return "";
  if (role === "support") return inherited.support;
  if (role === "email" || role === "corporate") return inherited.email;
  return "";
}

function FormModal({
  portalTarget,
  isOpen,
  editingId,
  isPending,
  formData,
  pageKey,
  inherited,
  onFormChange,
  onSubmit,
  onClose,
}: {
  portalTarget: HTMLElement | null;
  isOpen: boolean;
  editingId: string | null;
  isPending: boolean;
  formData: FormData;
  pageKey: string;
  inherited?: InheritedContactValues;
  onFormChange: <K extends keyof FormData>(field: K, value: FormData[K]) => void;
  onSubmit: (e: FormEvent) => void;
  onClose: () => void;
}) {
  if (!portalTarget || !isOpen) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-2xl border border-border bg-card p-6 shadow-2xl">
        <div className="flex items-center justify-between border-b border-border pb-4">
          <h3 className="font-display text-lg font-semibold text-foreground flex items-center gap-2">
            <Mail className="h-5 w-5 text-primary" />
            {editingId ? "Editar Elemento" : "Nuevo Elemento"}
          </h3>
          <button type="button" onClick={onClose} className="text-muted-foreground hover:text-foreground text-sm font-medium">
            ✕
          </button>
        </div>

        <form onSubmit={onSubmit} className="mt-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-1.5">Tipo de elemento</label>
              <select
                value={formData.kind}
                onChange={(e) => {
                  onFormChange("kind", e.target.value);
                  onFormChange("role", e.target.value === "attention" ? "attendee" : "email");
                }}
                className="w-full rounded-xl border border-border bg-background px-3.5 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="contact">Canal de contacto directo</option>
                <option value="attention">Tarjeta de atención</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-1.5">Orden</label>
              <input
                type="number"
                value={formData.sortOrder}
                onChange={(e) => onFormChange("sortOrder", parseInt(e.target.value) || 0)}
                className="w-full rounded-xl border border-border bg-background px-3.5 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-1.5">
              {formData.kind === "attention" ? "Tipo de tarjeta" : "Tipo de canal"}
            </label>
            <select
              value={formData.role}
              onChange={(e) => onFormChange("role", e.target.value)}
              className="w-full rounded-xl border border-border bg-background px-3.5 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            >
              {(formData.kind === "attention" ? ATTENTION_CARD_TYPES : CONTACT_CHANNEL_TYPES).map((t) => (
                <option key={t.value} value={t.value}>
                  {t.labelEs}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-1.5">
              {formData.kind === "attention" ? "Título" : "Etiqueta"}
            </label>
            <input
              type="text"
              value={formData.titleEs}
              onChange={(e) => onFormChange("titleEs", e.target.value)}
              placeholder={formData.kind === "attention" ? "Ej. Soporte a Asistentes" : "Ej. Atención general"}
              className="w-full rounded-xl border border-border bg-background px-3.5 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-1.5">
              {formData.kind === "attention"
                ? "Descripción"
                : formData.role === "address"
                  ? "Dirección"
                  : "Correo electrónico"}
            </label>
            {formData.kind === "attention" || formData.role === "address" ? (
              <textarea
                rows={3}
                value={formData.subtitleEs}
                onChange={(e) => onFormChange("subtitleEs", e.target.value)}
                placeholder={
                  formData.kind === "attention"
                    ? "Ej. Descarga y reenvío de tickets QR, cambios de titular, verificación de pagos con Yape, Plin o tarjetas."
                    : "Ej. Jr. Dámaso Beraún N° 845"
                }
                className="w-full rounded-xl border border-border bg-background px-3.5 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary leading-relaxed"
              />
            ) : (
              <input
                type="text"
                value={formData.subtitleEs}
                onChange={(e) => onFormChange("subtitleEs", e.target.value)}
                placeholder={
                  inheritedForRole(formData.role, inherited) ||
                  "Ej. contacto@enquiva.site"
                }
                className="w-full rounded-xl border border-border bg-background px-3.5 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            )}
            {formData.kind === "contact" && formData.role !== "address" ? (
              <p className="mt-1.5 text-xs text-muted-foreground">
                {formData.role === "email" || formData.role === "support"
                  ? `Al guardar, este correo se refleja en Identidad global (Configuración).${formData.subtitleEs.trim() ? "" : " Vacío = se muestra el valor actual de Identidad global."}`
                  : "Visible en /contact y reflejado como lectura en Configuración → Identidad global."}
              </p>
            ) : null}
          </div>

          <div>
            <label className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-1.5">
              {formData.kind === "attention" ? "Pie de tarjeta" : formData.role === "address" ? "Ciudad / Referencia" : "Descripción"}
            </label>
            {formData.kind === "attention" ? (
              <input
                type="text"
                value={formData.bodyEs}
                onChange={(e) => onFormChange("bodyEs", e.target.value)}
                placeholder="Ej. Respuesta promedio < 45 min"
                className="w-full rounded-xl border border-border bg-background px-3.5 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            ) : (
              <textarea
                rows={3}
                value={formData.bodyEs}
                onChange={(e) => onFormChange("bodyEs", e.target.value)}
                placeholder={
                  formData.role === "address"
                    ? "Ej. Huánuco, Perú · Mesa de Partes"
                    : "Ej. Información general e institucional"
                }
                className="w-full rounded-xl border border-border bg-background px-3.5 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary leading-relaxed"
              />
            )}
            {formData.kind === "contact" && formData.role === "address" ? (
              <p className="mt-1.5 text-xs text-muted-foreground">
                Al guardar, la dirección y la ciudad / referencia se combinan en Ubicación pública (Configuración → Identidad global).
              </p>
            ) : null}
          </div>

          <div className="flex items-center gap-2 border-t border-border pt-4">
            <label className="relative inline-flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) => onFormChange("isActive", e.target.checked)}
                className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
              />
              <span className="text-xs font-semibold text-foreground">Activa (visible públicamente)</span>
            </label>
          </div>

          <div className="flex items-center justify-end gap-3 border-t border-border pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isPending}
              className="rounded-xl border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              {editingId ? "Guardar Cambios" : "Crear Canal"}
            </button>
          </div>
        </form>
      </div>
    </div>,
    portalTarget,
  );
}

function DeleteModal({
  portalTarget,
  isOpen,
  isPending,
  onConfirm,
  onClose,
}: {
  portalTarget: HTMLElement | null;
  isOpen: boolean;
  isPending: boolean;
  onConfirm: () => void;
  onClose: () => void;
}) {
  if (!portalTarget || !isOpen) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl">
        <div className="flex items-center gap-3 border-b border-border pb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-500/10">
            <Trash2 className="h-5 w-5 text-red-500" />
          </div>
          <h3 className="font-display text-lg font-semibold text-foreground">Eliminar Canal</h3>
        </div>
        <p className="mt-4 text-sm text-muted-foreground">
          ¿Estás seguro de que deseas eliminar este canal de contacto? Esta acción no se puede deshacer.
        </p>
        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            className="rounded-xl border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted transition-colors"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isPending}
            className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-5 py-2 text-sm font-medium text-white hover:bg-red-700 transition-colors disabled:opacity-50"
          >
            {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Eliminar
          </button>
        </div>
      </div>
    </div>,
    portalTarget,
  );
}

export function ContactChannelsManager({
  initialSections,
  pageKey = "contact",
  isEn = false,
  inherited,
}: {
  initialSections: PageSection[];
  pageKey?: string;
  isEn?: boolean;
  inherited?: InheritedContactValues;
}) {
  const [sections, setSections] = useState(initialSections);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormData>(EMPTY_FORM);
  const [isPending, startTransition] = useTransition();
  const portalTargetRef = useRef<HTMLDivElement | null>(null);

  const getPortal = useCallback(() => {
    if (!portalTargetRef.current) {
      const div = document.createElement("div");
      div.id = `${pageKey}-contact-portal`;
      document.body.appendChild(div);
      portalTargetRef.current = div;
    }
    return portalTargetRef.current;
  }, [pageKey]);

  const openCreateModal = () => {
    setEditingId(null);
    setFormData({ ...EMPTY_FORM, sortOrder: sections.length });
    setIsModalOpen(true);
  };

  const openEditModal = (section: PageSection) => {
    setEditingId(section.id);
    setFormData(mapSectionToForm(section));
    setIsModalOpen(true);
  };

  const handleFormChange = <K extends keyof FormData>(field: K, value: FormData[K]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      kind: formData.kind,
      titleEs: formData.titleEs,
      titleEn: formData.titleEn || formData.titleEs,
      subtitleEs: formData.subtitleEs,
      subtitleEn: formData.subtitleEn || formData.subtitleEs,
      bodyEs: formData.bodyEs,
      bodyEn: formData.bodyEn || formData.bodyEs,
      role: formData.role,
      imageUrl: "",
      firstName: "",
      lastName: "",
      sortOrder: formData.sortOrder,
      isActive: formData.isActive,
    };
    startTransition(async () => {
      try {
        if (editingId) {
          const result = await updatePageSectionAction(editingId, payload, pageKey);
          if (result.success && "section" in result && result.section) {
            setSections((prev) =>
              prev.map((s) => (s.id === editingId ? result.section! : s)),
            );
            toast.success("Canal actualizado correctamente");
          } else {
            toast.error("Error al actualizar");
          }
        } else {
          const result = await createPageSectionAction(payload, pageKey);
          if (result.success && "section" in result && result.section) {
            setSections((prev) => [...prev, result.section!]);
            toast.success("Canal creado correctamente");
          } else {
            toast.error("Error al crear");
          }
        }
        setIsModalOpen(false);
      } catch {
        toast.error("Error inesperado. Intenta de nuevo.");
      }
    });
  };

  const handleToggleActive = (section: PageSection) => {
    const newActive = !section.isActive;
    startTransition(async () => {
      const result = await togglePageSectionActiveAction(section.id, newActive, pageKey);
      if (result.success) {
        setSections((prev) =>
          prev.map((s) => (s.id === section.id ? { ...s, isActive: newActive } : s)),
        );
        toast.success(newActive ? "Canal activado" : "Canal desactivado");
      }
    });
  };

  const handleDelete = () => {
    if (!deleteId) return;
    startTransition(async () => {
      const result = await deletePageSectionAction(deleteId, pageKey);
      if (result.success) {
        setSections((prev) => prev.filter((s) => s.id !== deleteId));
        toast.success("Canal eliminado");
        setDeleteId(null);
      }
    });
  };

  const handleMove = (section: PageSection, direction: "up" | "down") => {
    const idx = sections.findIndex((s) => s.id === section.id);
    if (idx < 0) return;
    const swapIdx = direction === "up" ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= sections.length) return;

    const newSections = [...sections];
    [newSections[idx], newSections[swapIdx]] = [newSections[swapIdx], newSections[idx]];

    setSections(newSections);

    const orderedIds = newSections.map((s) => s.id);
    startTransition(async () => {
      const result = await reorderPageSectionsAction(orderedIds, pageKey);
      if (!result.success) {
        setSections(sections);
        toast.error("Error al reordenar");
      }
    });
  };

  const activeCount = sections.filter((s) => s.isActive).length;

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <Mail className="h-3.5 w-3.5" />
              {sections.length} {isEn ? "channels" : "canales"}
            </span>
            <span className="inline-flex items-center gap-1.5 text-green-600 dark:text-green-400">
              <Eye className="h-3.5 w-3.5" />
              {activeCount} {isEn ? "active" : "activos"}
            </span>
          </div>
          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground shadow-sm transition-all hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" />
            {isEn ? "New Channel" : "Nuevo Canal"}
          </button>
        </div>
      </div>

      {sections.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card p-12 text-center">
          <Mail className="mx-auto h-12 w-12 text-muted-foreground/40" />
          <h3 className="mt-4 font-semibold text-foreground">
            {isEn ? "No contact channels yet" : "No hay canales de contacto creados"}
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {isEn
              ? "Create the first contact channel for the /contact page."
              : "Crea el primer canal de contacto para la página /contact."}
          </p>
          <button
            type="button"
            onClick={openCreateModal}
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" />
            {isEn ? "Create First Channel" : "Crear Primer Canal"}
          </button>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="border-b border-border bg-muted/40 text-muted-foreground font-medium">
                <tr>
                  <th className="px-3 py-3.5 w-8" />
                  <th className="px-4 py-3.5">Tipo</th>
                  <th className="px-4 py-3.5">Etiqueta (ES)</th>
                  <th className="px-4 py-3.5">Correo / Dirección / Descripción</th>
                  <th className="px-4 py-3.5">Detalle</th>
                  <th className="px-4 py-3.5 text-center">Estado</th>
                  <th className="px-4 py-3.5 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {sections.map((section, idx) => {
                  const isAttention = section.kind === "attention";
                  const type = (isAttention ? ATTENTION_CARD_TYPES : CONTACT_CHANNEL_TYPES).find(
                    (t) => t.value === (section.role ?? (isAttention ? "attendee" : "email")),
                  );
                  const Icon = type?.icon ?? (isAttention ? Clock : Mail);
                  return (
                    <tr key={section.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-3 py-4">
                        <div className="flex flex-col items-center gap-0.5">
                          <button
                            type="button"
                            onClick={() => handleMove(section, "up")}
                            disabled={idx === 0 || isPending}
                            className="p-0.5 text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                            title="Mover arriba"
                          >
                            <ArrowUp className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleMove(section, "down")}
                            disabled={idx === sections.length - 1 || isPending}
                            className="p-0.5 text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                            title="Mover abajo"
                          >
                            <ArrowDown className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/25">
                          <Icon className="h-3 w-3" />
                          {isAttention
                            ? attentionTypeLabel(section.role ?? "attendee", isEn)
                            : contactTypeLabel(section.role ?? "email", isEn)}
                        </span>
                      </td>
                      <td className="px-4 py-4 font-medium text-foreground max-w-[160px] truncate">
                        {section.titleEs || "—"}
                      </td>
                      <td className="px-4 py-4 font-medium text-foreground max-w-[200px] truncate">
                        {isAttention ? (
                          stripHtml(section.subtitleEs) || "—"
                        ) : section.subtitleEs ? (
                          section.subtitleEs
                        ) : inheritedForRole(section.role, inherited) ? (
                          <span title="Valor actual de Identidad global">
                            {inheritedForRole(section.role, inherited)}{" "}
                            <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                              Identidad global
                            </span>
                          </span>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="px-4 py-4 max-w-xs">
                        <p className="line-clamp-2 text-xs text-muted-foreground">
                          {isAttention ? "—" : stripHtml(section.bodyEs) || "—"}
                        </p>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <button
                          type="button"
                          onClick={() => handleToggleActive(section)}
                          disabled={isPending}
                          title={section.isActive ? "Activa (clic para desactivar)" : "Inactiva (clic para activar)"}
                          className={cn(
                            "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold transition-all",
                            section.isActive
                              ? "bg-green-500/15 text-green-600 dark:text-green-400 border border-green-400/40 hover:bg-green-500/25"
                              : "bg-muted text-muted-foreground border border-border/60 hover:bg-muted/80",
                          )}
                        >
                          {section.isActive ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                          {section.isActive ? "Visible" : "Oculta"}
                        </button>
                      </td>
                      <td className="px-4 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => openEditModal(section)}
                            className="p-1.5 rounded-lg border border-border bg-card text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                            title="Editar canal"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteId(section.id)}
                            className="p-1.5 rounded-lg border border-red-200/50 bg-card text-red-600 hover:bg-red-50 dark:border-red-900/40 dark:text-red-400 dark:hover:bg-red-950/20 transition-colors"
                            title="Eliminar canal"
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

      <FormModal
        portalTarget={typeof document !== "undefined" ? getPortal() : null}
        isOpen={isModalOpen}
        editingId={editingId}
        isPending={isPending}
        formData={formData}
        pageKey={pageKey}
        inherited={inherited}
        onFormChange={handleFormChange}
        onSubmit={handleSubmit}
        onClose={() => setIsModalOpen(false)}
      />

      <DeleteModal
        portalTarget={typeof document !== "undefined" ? getPortal() : null}
        isOpen={!!deleteId}
        isPending={isPending}
        onConfirm={handleDelete}
        onClose={() => setDeleteId(null)}
      />
    </div>
  );
}