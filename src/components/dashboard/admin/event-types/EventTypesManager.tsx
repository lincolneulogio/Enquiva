"use client";

import { useMemo, useState, useTransition } from "react";
import {
  Layers,
  Search,
  Plus,
  RefreshCw,
  CheckCircle2,
  XCircle,
  FolderTree,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { normalizeCategorySlug } from "@/lib/utils";
import { confirmDeleteAction } from "@/lib/ui/confirm";
import { useLocale, useTranslations } from "@/components/providers/LocaleProvider";
import { TaxonomyNavTabs } from "../categories/TaxonomyNavTabs";
import {
  createEventType,
  updateEventType,
  deleteEventType,
  syncDefaultEventTypesAction,
} from "@/actions/admin";
import type { EventTypeItem, EventTypesManagerProps } from "./types";

export function EventTypesManager({ initialEventTypes, categories, eventCounts }: EventTypesManagerProps) {
  const { locale } = useLocale();
  const t = useTranslations();
  const [items, setItems] = useState<EventTypeItem[]>(initialEventTypes);
  const [isPending, startTransition] = useTransition();

  // Filters
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Create Form State
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newItem, setNewItem] = useState({
    categorySlug: categories[0]?.slug ?? "conferences",
    label: "",
    slug: "",
    description: "",
    sortOrder: 1,
  });

  // Category mapping for quick lookup
  const categoryMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const cat of categories) {
      map.set(cat.slug, cat.label);
    }
    return map;
  }, [categories]);

  // Handle label change with auto-slug
  const handleLabelChange = (val: string) => {
    setNewItem((prev) => ({
      ...prev,
      label: val,
      slug: normalizeCategorySlug(val),
    }));
  };

  // Stats calculation
  const stats = useMemo(() => {
    const total = items.length;
    const active = items.filter((i) => i.isActive).length;
    const inactive = total - active;
    const uniqueCategories = new Set(items.map((i) => i.categorySlug)).size;
    return { total, active, inactive, uniqueCategories };
  }, [items]);

  // Filtered and sorted items
  const filteredItems = useMemo(() => {
    return items
      .filter((item) => {
        if (selectedCategory !== "all" && item.categorySlug !== selectedCategory) {
          return false;
        }
        if (selectedStatus === "active" && !item.isActive) {
          return false;
        }
        if (selectedStatus === "inactive" && item.isActive) {
          return false;
        }
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const matchesLabel = item.label.toLowerCase().includes(q);
          const matchesSlug = item.slug.toLowerCase().includes(q);
          const matchesCategory = item.categorySlug.toLowerCase().includes(q);
          const matchesDesc = item.description?.toLowerCase().includes(q);
          if (!matchesLabel && !matchesSlug && !matchesCategory && !matchesDesc) {
            return false;
          }
        }
        return true;
      })
      .sort((a, b) => {
        if (a.categorySlug !== b.categorySlug) {
          return a.categorySlug.localeCompare(b.categorySlug);
        }
        return a.sortOrder - b.sortOrder;
      });
  }, [items, selectedCategory, selectedStatus, searchQuery]);

  // Actions
  const handleCreate = () => {
    if (!newItem.categorySlug || !newItem.label.trim() || !newItem.slug.trim()) {
      toast.error(
        locale === "en"
          ? "Category, label, and slug are required"
          : "La categoría, etiqueta y slug son obligatorios",
      );
      return;
    }

    startTransition(async () => {
      try {
        const result = await createEventType({
          categorySlug: newItem.categorySlug,
          label: newItem.label.trim(),
          slug: newItem.slug.trim(),
          description: newItem.description.trim() || undefined,
          sortOrder: Number(newItem.sortOrder) || 1,
        });

        if (result.success && result.eventType) {
          setItems((prev) => [...prev, result.eventType as EventTypeItem]);
          setNewItem({
            categorySlug: newItem.categorySlug,
            label: "",
            slug: "",
            description: "",
            sortOrder: items.length + 1,
          });
          setShowCreateForm(false);
          toast.success(
            locale === "en" ? "Event type created successfully" : "Tipo de evento creado con éxito",
          );
        }
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Error al crear tipo de evento");
      }
    });
  };

  const handleToggleActive = (id: string, currentStatus: boolean) => {
    const nextStatus = !currentStatus;
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, isActive: nextStatus } : it)));

    startTransition(async () => {
      try {
        await updateEventType(id, { isActive: nextStatus });
        toast.success(
          nextStatus
            ? (locale === "en" ? "Event type activated" : "Tipo de evento activado")
            : (locale === "en" ? "Event type deactivated" : "Tipo de evento desactivado"),
        );
      } catch (err) {
        // Rollback
        setItems((prev) => prev.map((it) => (it.id === id ? { ...it, isActive: currentStatus } : it)));
        toast.error(err instanceof Error ? err.message : "Error al actualizar estado");
      }
    });
  };

  const handlePatchLocal = (id: string, patch: Partial<EventTypeItem>) => {
    setItems((prev) => prev.map((it) => (
      it.id === id
        ? {
            ...it,
            ...patch,
            ...(patch.label !== undefined && { slug: normalizeCategorySlug(patch.label) }),
          }
        : it
    )));
  };

  const handleBlurSave = (item: EventTypeItem) => {
    startTransition(async () => {
      try {
        const result = await updateEventType(item.id, {
          label: item.label,
          description: item.description ?? undefined,
          sortOrder: item.sortOrder,
        });
        if (result.eventType) {
          setItems((prev) => prev.map((current) => (
            current.id === item.id ? result.eventType as EventTypeItem : current
          )));
        }
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Error al guardar cambios");
      }
    });
  };

  const handleDelete = async (item: EventTypeItem) => {
    const confirmed = await confirmDeleteAction({
      title: locale === "en" ? "Delete Event Type" : "Eliminar Tipo de Evento",
      text:
        locale === "en"
          ? `Are you sure you want to delete "${item.label}" (${item.slug})?`
          : `¿Estás seguro de eliminar el tipo "${item.label}" (${item.slug})?`,
      confirmText: t("common.delete"),
      cancelText: t("common.cancel"),
      tone: "danger",
    });

    if (!confirmed) return;

    startTransition(async () => {
      try {
        await deleteEventType(item.id);
        setItems((prev) => prev.filter((it) => it.id !== item.id));
        toast.success(
          locale === "en" ? "Event type deleted" : "Tipo de evento eliminado",
        );
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Error al eliminar tipo de evento");
      }
    });
  };

  const handleSyncDefaults = () => {
    startTransition(async () => {
      try {
        const res = await syncDefaultEventTypesAction();
        if (res.success) {
          toast.success(
            locale === "en"
              ? `Sync completed: ${res.inserted} new types inserted (${res.total} total)`
              : `Sincronización completada: ${res.inserted} nuevos tipos insertados (${res.total} en total)`,
          );
          // Reload page to re-fetch all types
          window.location.reload();
        }
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Error al sincronizar");
      }
    });
  };

  return (
    <div className="space-y-6">
      <TaxonomyNavTabs />

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-border bg-card p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">
              {locale === "en" ? "Total Types" : "Total Tipos"}
            </span>
            <Layers className="h-4 w-4 text-primary" />
          </div>
          <p className="mt-2 text-2xl font-bold text-foreground">{stats.total}</p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">
              {locale === "en" ? "Categories Covered" : "Categorías Cubiertas"}
            </span>
            <FolderTree className="h-4 w-4 text-indigo-500" />
          </div>
          <p className="mt-2 text-2xl font-bold text-foreground">{stats.uniqueCategories}</p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">
              {locale === "en" ? "Active" : "Activos"}
            </span>
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          </div>
          <p className="mt-2 text-2xl font-bold text-emerald-600 dark:text-emerald-400">{stats.active}</p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">
              {locale === "en" ? "Inactive" : "Inactivos"}
            </span>
            <XCircle className="h-4 w-4 text-amber-500" />
          </div>
          <p className="mt-2 text-2xl font-bold text-amber-600 dark:text-amber-400">{stats.inactive}</p>
        </div>
      </div>

      {/* Action & Filter Bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-3">
          {/* Search */}
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={locale === "en" ? "Search event types..." : "Buscar tipos de evento..."}
              className="w-full rounded-xl border border-border bg-background pl-9 pr-8 py-2 text-sm text-foreground focus:border-primary focus:ring-1 focus:ring-primary shadow-xs"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:ring-1 focus:ring-primary shadow-xs cursor-pointer"
          >
            <option value="all">
              {locale === "en" ? "All Categories" : "Todas las categorías"}
            </option>
            {categories.map((cat) => (
              <option key={cat.slug} value={cat.slug}>
                {cat.label}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:ring-1 focus:ring-primary shadow-xs cursor-pointer"
          >
            <option value="all">{locale === "en" ? "All Status" : "Todos los estados"}</option>
            <option value="active">{locale === "en" ? "Active only" : "Solo activos"}</option>
            <option value="inactive">{locale === "en" ? "Inactive only" : "Solo inactivos"}</option>
          </select>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Sync Defaults */}
          <button
            type="button"
            onClick={handleSyncDefaults}
            disabled={isPending}
            className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-background hover:bg-muted px-3 py-2 text-xs font-semibold text-foreground transition disabled:opacity-50 cursor-pointer shadow-xs"
            title={locale === "en" ? "Sync default event types from taxonomy" : "Sincronizar tipos de taxonomía predeterminados"}
          >
            <RefreshCw className={cn("h-3.5 w-3.5 text-primary", isPending && "animate-spin")} />
            <span className="hidden sm:inline">
              {locale === "en" ? "Sync Defaults" : "Sincronizar por defecto"}
            </span>
          </button>

          {/* New Event Type Button */}
          <button
            type="button"
            onClick={() => setShowCreateForm((prev) => !prev)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 px-3.5 py-2 text-xs font-semibold shadow-sm transition active:scale-95 cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>{locale === "en" ? "New Event Type" : "Nuevo Tipo"}</span>
          </button>
        </div>
      </div>

      {/* Create Form Card (Collapsible) */}
      {showCreateForm && (
        <div className="rounded-2xl border border-border bg-card p-5 shadow-xs space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center justify-between pb-2 border-b border-border">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Plus className="h-4 w-4 text-primary" />
              {locale === "en" ? "Add New Event Type" : "Crear Nuevo Tipo de Evento"}
            </h3>
            <button
              type="button"
              onClick={() => setShowCreateForm(false)}
              className="text-muted-foreground hover:text-foreground cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {/* Category */}
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">
                {locale === "en" ? "Category" : "Categoría"} *
              </label>
              <select
                value={newItem.categorySlug}
                onChange={(e) => setNewItem((prev) => ({ ...prev, categorySlug: e.target.value }))}
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:ring-1 focus:ring-primary shadow-xs"
              >
                {categories.map((cat) => (
                  <option key={cat.slug} value={cat.slug}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Label */}
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">
                {locale === "en" ? "Type Name (Label)" : "Nombre del Tipo"} *
              </label>
              <input
                type="text"
                value={newItem.label}
                onChange={(e) => handleLabelChange(e.target.value)}
                placeholder={locale === "en" ? "e.g. Masterclass" : "ej. Clase Magistral"}
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:ring-1 focus:ring-primary shadow-xs"
              />
            </div>

            {/* Slug */}
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">
                {locale === "en" ? "Slug (Identifier)" : "Slug (Identificador)"} *
              </label>
              <input
                type="text"
                value={newItem.slug}
                onChange={(e) => setNewItem((prev) => ({ ...prev, slug: normalizeCategorySlug(e.target.value) }))}
                placeholder="masterclass"
                className="w-full rounded-xl border border-border bg-background font-mono px-3 py-2 text-sm text-foreground focus:border-primary focus:ring-1 focus:ring-primary shadow-xs"
              />
            </div>

            {/* Sort Order */}
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">
                {locale === "en" ? "Sort Order" : "Orden"}
              </label>
              <input
                type="number"
                min="0"
                value={newItem.sortOrder}
                onChange={(e) => setNewItem((prev) => ({ ...prev, sortOrder: Number(e.target.value) }))}
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:ring-1 focus:ring-primary shadow-xs"
              />
            </div>

            {/* Description */}
            <div className="sm:col-span-2 md:col-span-3">
              <label className="block text-xs font-medium text-muted-foreground mb-1">
                {locale === "en" ? "Description (Optional)" : "Descripción (Opcional)"}
              </label>
              <input
                type="text"
                value={newItem.description}
                onChange={(e) => setNewItem((prev) => ({ ...prev, description: e.target.value }))}
                placeholder={locale === "en" ? "Brief purpose or explanation..." : "Breve descripción o propósito..."}
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:ring-1 focus:ring-primary shadow-xs"
              />
            </div>

            {/* Actions */}
            <div className="flex items-end justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                className="rounded-xl border border-border px-4 py-2 text-xs font-medium text-muted-foreground hover:text-foreground cursor-pointer"
              >
                {t("common.cancel")}
              </button>
              <button
                type="button"
                onClick={handleCreate}
                disabled={isPending}
                className="rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50 cursor-pointer shadow-xs"
              >
                {isPending ? t("common.saving") : (locale === "en" ? "Save Type" : "Guardar Tipo")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Event Types Table */}
      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-xs">
        <div className="px-4 py-3 flex items-center justify-between border-b border-border bg-muted/10">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <Layers className="h-4 w-4 text-primary" />
              {locale === "en" ? "Event Types Directory" : "Directorio de Tipos de Evento"}
            </span>
            <span className="rounded-full bg-primary/10 border border-primary/20 px-2 py-0.5 text-[11px] font-bold text-primary">
              {filteredItems.length}
            </span>
          </div>

          <span className="text-[11px] text-muted-foreground">
            {locale === "en"
              ? "Edits save automatically on blur"
              : "Los cambios se guardan al salir del campo"}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] table-fixed text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50 text-left text-xs font-semibold text-muted-foreground">
                <th className="w-16 px-4 py-3">#</th>
                <th className="w-44 px-4 py-3">{locale === "en" ? "Category" : "Categoría"}</th>
                <th className="w-60 px-4 py-3">{locale === "en" ? "Label" : "Nombre / Etiqueta"}</th>
                <th className="w-48 px-4 py-3">Slug</th>
                <th className="px-4 py-3">{locale === "en" ? "Description" : "Descripción"}</th>
                <th className="w-24 px-4 py-3 text-center">{locale === "en" ? "Order" : "Orden"}</th>
                <th className="w-20 px-4 py-3 text-center">{locale === "en" ? "Events" : "Eventos"}</th>
                <th className="w-24 px-4 py-3 text-center">{locale === "en" ? "Active" : "Activo"}</th>
                <th className="w-24 px-4 py-3 text-right">{t("common.actions")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center text-muted-foreground">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Layers className="h-8 w-8 text-muted-foreground/50" />
                      <p className="font-medium text-foreground">
                        {locale === "en" ? "No event types found" : "No se encontraron tipos de evento"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {locale === "en"
                          ? "Try clearing filters or click 'Sync Defaults' to populate."
                          : "Prueba limpiando los filtros o presiona 'Sincronizar por defecto'."}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredItems.map((item, idx) => (
                  <tr key={item.id} className="hover:bg-muted/30 transition-colors">
                    {/* Index */}
                    <td className="px-4 py-3.5 text-xs text-muted-foreground font-mono">
                      {idx + 1}
                    </td>

                    {/* Category */}
                    <td className="px-4 py-3.5">
                      <span className="inline-flex items-center rounded-lg bg-secondary px-2.5 py-1 text-xs font-semibold text-secondary-foreground">
                        {categoryMap.get(item.categorySlug) ?? item.categorySlug}
                      </span>
                    </td>

                    {/* Label (Editable) */}
                    <td className="px-4 py-3.5">
                      <input
                        type="text"
                        value={item.label}
                        onChange={(e) => handlePatchLocal(item.id, { label: e.target.value })}
                        onBlur={() => handleBlurSave(item)}
                        className="w-full rounded-lg border border-border bg-background/50 focus:bg-background px-2.5 py-1 text-sm font-semibold text-foreground transition-all focus:border-primary focus:ring-1 focus:ring-primary shadow-2xs"
                      />
                    </td>

                    {/* Slug */}
                    <td className="px-4 py-3.5 font-mono text-xs text-muted-foreground truncate" title={item.slug}>
                      <span className="rounded bg-muted px-2 py-1 text-foreground/80">
                        {item.slug}
                      </span>
                    </td>

                    {/* Description (Editable) */}
                    <td className="px-4 py-3.5">
                      <input
                        type="text"
                        value={item.description ?? ""}
                        onChange={(e) => handlePatchLocal(item.id, { description: e.target.value })}
                        onBlur={() => handleBlurSave(item)}
                        placeholder={locale === "en" ? "No description" : "Sin descripción"}
                        className="w-full rounded-lg border border-transparent hover:border-border focus:border-primary bg-transparent focus:bg-background px-2.5 py-1 text-xs text-muted-foreground focus:text-foreground transition-all focus:ring-1 focus:ring-primary"
                      />
                    </td>

                    {/* Sort Order */}
                    <td className="px-4 py-3.5 text-center">
                      <input
                        type="number"
                        min="0"
                        value={item.sortOrder}
                        onChange={(e) => handlePatchLocal(item.id, { sortOrder: Number(e.target.value) })}
                        onBlur={() => handleBlurSave(item)}
                        className="w-16 rounded-lg border border-border bg-background/50 text-center px-2 py-1 text-xs font-mono font-medium focus:border-primary focus:ring-1 focus:ring-primary"
                      />
                    </td>

                    {/* Event Count (Impact Preview) */}
                    <td className="px-4 py-3.5 text-center">
                      <span
                        className={cn(
                          "inline-flex min-w-8 items-center justify-center rounded-full px-2 py-0.5 text-xs font-bold",
                          (eventCounts?.[item.id] ?? 0) > 0
                            ? "bg-primary/10 text-primary border border-primary/20"
                            : "bg-muted text-muted-foreground border border-border/60",
                        )}
                      >
                        {eventCounts?.[item.id] ?? 0}
                      </span>
                    </td>

                    {/* Active Checkbox */}
                    <td className="px-4 py-3.5 text-center">
                      <input
                        type="checkbox"
                        checked={item.isActive}
                        onChange={() => handleToggleActive(item.id, item.isActive)}
                        className="h-4.5 w-4.5 rounded border-border text-primary bg-background focus:ring-primary focus:ring-offset-background cursor-pointer"
                      />
                    </td>

                    {/* Delete */}
                    <td className="px-4 py-3.5 text-right">
                      <button
                        type="button"
                        onClick={() => handleDelete(item)}
                        className="inline-flex items-center justify-center rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white p-1.5 transition active:scale-95 cursor-pointer"
                        title={t("common.delete")}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
