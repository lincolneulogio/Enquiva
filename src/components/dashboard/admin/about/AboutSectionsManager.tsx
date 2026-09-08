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
  GripVertical,
  Loader2,
  Landmark,
  FileText,
  Users2,
} from "lucide-react";
import type { PageSection } from "@/lib/db/schema";
import {
  createPageSectionAction,
  updatePageSectionAction,
  togglePageSectionActiveAction,
  deletePageSectionAction,
  reorderPageSectionsAction,
} from "@/actions/admin/pages";
import { TeamMemberPhotoField } from "./TeamMemberPhotoField";
import { toast } from "sonner";

type FormData = {
  kind: string;
  titleEs: string;
  titleEn: string;
  subtitleEs: string;
  subtitleEn: string;
  bodyEs: string;
  bodyEn: string;
  firstName: string;
  lastName: string;
  role: string;
  imageUrl: string;
  sortOrder: number;
  isActive: boolean;
};

const EMPTY_FORM: FormData = {
  kind: "section",
  titleEs: "",
  titleEn: "",
  subtitleEs: "",
  subtitleEn: "",
  bodyEs: "",
  bodyEn: "",
  firstName: "",
  lastName: "",
  role: "",
  imageUrl: "",
  sortOrder: 0,
  isActive: true,
};

function mapSectionToForm(section: PageSection): FormData {
  return {
    kind: section.kind ?? "section",
    titleEs: section.titleEs ?? "",
    titleEn: section.titleEn ?? "",
    subtitleEs: section.subtitleEs ?? "",
    subtitleEn: section.subtitleEn ?? "",
    bodyEs: section.bodyEs ?? "",
    bodyEn: section.bodyEn ?? "",
    firstName: section.firstName ?? "",
    lastName: section.lastName ?? "",
    role: section.role ?? "",
    imageUrl: section.imageUrl ?? "",
    sortOrder: section.sortOrder ?? 0,
    isActive: section.isActive ?? true,
  };
}

function FormModal({
  portalTarget,
  isOpen,
  editingId,
  isPending,
  formData,
  allowedKinds,
  pageLabel,
  onFormChange,
  onSubmit,
  onClose,
}: {
  portalTarget: HTMLElement | null;
  isOpen: boolean;
  editingId: string | null;
  isPending: boolean;
  formData: FormData;
  allowedKinds: string[];
  pageLabel: string;
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
      <div className="w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl border border-border bg-card p-6 shadow-2xl">
        <div className="flex items-center justify-between border-b border-border pb-4">
          <h3 className="font-display text-lg font-semibold text-foreground flex items-center gap-2">
            <Landmark className="h-5 w-5 text-primary" />
            {editingId
              ? formData.kind === "team" ? "Editar Miembro del Equipo" : "Editar Sección"
              : formData.kind === "team" ? "Nuevo Miembro del Equipo" : "Crear Nueva Sección"}
          </h3>
          <button type="button" onClick={onClose} className="text-muted-foreground hover:text-foreground text-sm font-medium">
            ✕
          </button>
        </div>

        <form onSubmit={onSubmit} className="mt-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-1.5">Tipo de Sección</label>
              <select
                value={formData.kind}
                onChange={(e) => onFormChange("kind", e.target.value)}
                className="w-full rounded-xl border border-border bg-background px-3.5 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              >
                {allowedKinds.includes("hero") ? <option value="hero">Hero (Portada)</option> : null}
                {allowedKinds.includes("section") ? <option value="section">Sección de contenido</option> : null}
                {allowedKinds.includes("team") ? <option value="team">Miembro del Equipo</option> : null}
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

          {formData.kind === "team" ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-1.5">Nombre *</label>
                  <input
                    type="text"
                    required
                    value={formData.firstName}
                    onChange={(e) => onFormChange("firstName", e.target.value)}
                    placeholder="Ej. Sofía"
                    className="w-full rounded-xl border border-border bg-background px-3.5 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-1.5">Apellido *</label>
                  <input
                    type="text"
                    required
                    value={formData.lastName}
                    onChange={(e) => onFormChange("lastName", e.target.value)}
                    placeholder="Ej. Benavides"
                    className="w-full rounded-xl border border-border bg-background px-3.5 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-1.5">Cargo / Rol *</label>
                <input
                  type="text"
                  required
                  value={formData.role}
                  onChange={(e) => onFormChange("role", e.target.value)}
                  placeholder="Ej. Directora de Operaciones"
                  className="w-full rounded-xl border border-border bg-background px-3.5 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-1.5">Descripción (Español)</label>
                <textarea
                  rows={4}
                  value={formData.bodyEs}
                  onChange={(e) => onFormChange("bodyEs", e.target.value)}
                  placeholder="Breve descripción profesional en español..."
                  className="w-full rounded-xl border border-border bg-background px-3.5 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary leading-relaxed"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-1.5">Descripción (Inglés)</label>
                <textarea
                  rows={4}
                  value={formData.bodyEn}
                  onChange={(e) => onFormChange("bodyEn", e.target.value)}
                  placeholder="Brief professional description in English..."
                  className="w-full rounded-xl border border-border bg-background px-3.5 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary leading-relaxed"
                />
              </div>

              <TeamMemberPhotoField
                value={formData.imageUrl}
                onChange={(url) => onFormChange("imageUrl", url)}
              />
            </>
          ) : (
            <>
              {formData.kind === "hero" ? (
                <p className="rounded-lg border border-primary/20 bg-primary/5 px-3 py-2 text-xs text-muted-foreground">
                  El contenido del hero se muestra en la parte superior de la página &quot;{pageLabel}&quot;. Puedes personalizar título y subtítulo en ambos idiomas.
                </p>
              ) : null}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-1.5">Título (Español)</label>
                  <input
                    type="text"
                    value={formData.titleEs}
                    onChange={(e) => onFormChange("titleEs", e.target.value)}
                    placeholder="Ej. Nuestra Misión"
                    className="w-full rounded-xl border border-border bg-background px-3.5 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-1.5">Título (Inglés)</label>
                  <input
                    type="text"
                    value={formData.titleEn}
                    onChange={(e) => onFormChange("titleEn", e.target.value)}
                    placeholder="Ej. Our Mission"
                    className="w-full rounded-xl border border-border bg-background px-3.5 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-1.5">Subtítulo (Español)</label>
                  <input
                    type="text"
                    value={formData.subtitleEs}
                    onChange={(e) => onFormChange("subtitleEs", e.target.value)}
                    placeholder="Descripción corta (opcional)"
                    className="w-full rounded-xl border border-border bg-background px-3.5 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-1.5">Subtítulo (Inglés)</label>
                  <input
                    type="text"
                    value={formData.subtitleEn}
                    onChange={(e) => onFormChange("subtitleEn", e.target.value)}
                    placeholder="Short description (optional)"
                    className="w-full rounded-xl border border-border bg-background px-3.5 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-1.5">Cuerpo (Español)</label>
                <textarea
                  rows={5}
                  value={formData.bodyEs}
                  onChange={(e) => onFormChange("bodyEs", e.target.value)}
                  placeholder="Contenido principal de la sección en español..."
                  className="w-full rounded-xl border border-border bg-background px-3.5 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary leading-relaxed"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-1.5">Cuerpo (Inglés)</label>
                <textarea
                  rows={5}
                  value={formData.bodyEn}
                  onChange={(e) => onFormChange("bodyEn", e.target.value)}
                  placeholder="Main section content in English..."
                  className="w-full rounded-xl border border-border bg-background px-3.5 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary leading-relaxed"
                />
              </div>

              <TeamMemberPhotoField
                value={formData.imageUrl}
                onChange={(url) => onFormChange("imageUrl", url)}
              />
            </>
          )}

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
              {editingId ? "Guardar Cambios" : "Crear Sección"}
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
          <h3 className="font-display text-lg font-semibold text-foreground">Eliminar Sección</h3>
        </div>
        <p className="mt-4 text-sm text-muted-foreground">
          ¿Estás seguro de que deseas eliminar esta sección? Esta acción no se puede deshacer.
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

export function AboutSectionsManager({
  initialSections,
  pageKey = "about",
  contextLabel = "Sobre Nosotros",
  createLabel = "Nueva Sección / Miembro",
  emptyCreateLabel = "Crear Primera Sección",
  allowedKinds = ["hero", "section", "team"],
}: {
  initialSections: PageSection[];
  pageKey?: string;
  contextLabel?: string;
  createLabel?: string;
  emptyCreateLabel?: string;
  allowedKinds?: string[];
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
      div.id = `${pageKey}-sections-portal`;
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
    startTransition(async () => {
      try {
        if (editingId) {
          const result = await updatePageSectionAction(editingId, formData, pageKey);
          if (result.success && "section" in result && result.section) {
            setSections((prev) =>
              prev.map((s) => (s.id === editingId ? result.section! : s)),
            );
            toast.success("Sección actualizada correctamente");
          } else {
            toast.error("Error al actualizar");
          }
        } else {
          const result = await createPageSectionAction(formData, pageKey);
          if (result.success && "section" in result && result.section) {
            setSections((prev) => [...prev, result.section!]);
            toast.success("Sección creada correctamente");
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
        toast.success(newActive ? "Sección activada" : "Sección desactivada");
      }
    });
  };

  const handleDelete = () => {
    if (!deleteId) return;
    startTransition(async () => {
      const result = await deletePageSectionAction(deleteId, pageKey);
      if (result.success) {
        setSections((prev) => prev.filter((s) => s.id !== deleteId));
        toast.success("Sección eliminada");
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
  const heroCount = sections.filter((s) => s.kind === "hero").length;

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <FileText className="h-3.5 w-3.5" />
              {sections.length} secciones
            </span>
            <span className="inline-flex items-center gap-1.5 text-green-600 dark:text-green-400">
              <Eye className="h-3.5 w-3.5" />
              {activeCount} activas
            </span>
            {heroCount > 0 && (
              <span className="inline-flex items-center gap-1.5 text-primary">
                <Landmark className="h-3.5 w-3.5" />
                Hero
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground shadow-sm transition-all hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" />
            {createLabel}
          </button>
        </div>
      </div>

      {sections.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card p-12 text-center">
          <Landmark className="mx-auto h-12 w-12 text-muted-foreground/40" />
          <h3 className="mt-4 font-semibold text-foreground">No hay secciones creadas</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Comienza creando la primera sección de la página &quot;{contextLabel}&quot;.
          </p>
          <button
            type="button"
            onClick={openCreateModal}
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" />
            {emptyCreateLabel}
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
                  <th className="px-4 py-3.5">Nombre / Título (ES)</th>
                  <th className="px-4 py-3.5">Nombre / Título (EN)</th>
                  <th className="px-4 py-3.5">Descripción</th>
                  <th className="px-4 py-3.5 text-center">Estado</th>
                  <th className="px-4 py-3.5 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {sections.map((section, idx) => (
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
                        <GripVertical className="h-3.5 w-3.5 text-muted-foreground/40" />
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
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                        section.kind === "hero"
                          ? "bg-primary/10 text-primary border border-primary/25"
                          : section.kind === "team"
                            ? "bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/25"
                            : "bg-muted text-muted-foreground border border-border/60"
                      }`}>
                        {section.kind === "hero" ? <Landmark className="h-3 w-3" /> : section.kind === "team" ? <Users2 className="h-3 w-3" /> : <FileText className="h-3 w-3" />}
                        {section.kind === "hero" ? "Hero" : section.kind === "team" ? "Miembro" : "Sección"}
                      </span>
                    </td>
                    <td className="px-4 py-4 font-medium text-foreground max-w-[180px] truncate">
                      {section.kind === "team"
                        ? `${section.firstName ?? ""} ${section.lastName ?? ""}`.trim() || "—"
                        : section.titleEs || "—"}
                    </td>
                    <td className="px-4 py-4 font-medium text-foreground max-w-[180px] truncate">
                      {section.kind === "team"
                        ? (section.role || "—")
                        : section.titleEn || "—"}
                    </td>
                    <td className="px-4 py-4 max-w-xs">
                      <p className="line-clamp-2 text-xs text-muted-foreground">
                        {section.bodyEs || "Sin contenido"}
                      </p>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <button
                        type="button"
                        onClick={() => handleToggleActive(section)}
                        disabled={isPending}
                        title={section.isActive ? "Activa (clic para desactivar)" : "Inactiva (clic para activar)"}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold transition-all ${
                          section.isActive
                            ? "bg-green-500/15 text-green-600 dark:text-green-400 border border-green-400/40 hover:bg-green-500/25"
                            : "bg-muted text-muted-foreground border border-border/60 hover:bg-muted/80"
                        }`}
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
                          title="Editar sección"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteId(section.id)}
                          className="p-1.5 rounded-lg border border-red-200/50 bg-card text-red-600 hover:bg-red-50 dark:border-red-900/40 dark:text-red-400 dark:hover:bg-red-950/20 transition-colors"
                          title="Eliminar sección"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
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
        allowedKinds={allowedKinds}
        pageLabel={contextLabel}
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
