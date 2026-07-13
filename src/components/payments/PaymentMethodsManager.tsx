"use client";

import { useState, useTransition, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { createPaymentMethod, updatePaymentMethod, deletePaymentMethod, detachLegacyWalletMethodsFromEvents, type PaymentMethodScope } from "@/actions/payment-methods";
import { Loader2, Plus, Trash2, QrCode, Smartphone, Wallet, Upload, X, CreditCard, Crown, Info } from "lucide-react";
import { useTranslations } from "@/components/providers/LocaleProvider";
import Image from "next/image";
import { cn } from "@/lib/utils";
import type { PaymentMethod } from "@/lib/db/schema";
import { usePersistedFormFields } from "@/hooks/useFormPersistence";
import { formStorageKey } from "@/lib/form-persistence";
import { assertOrganizerCulqiKeys, parseCulqiPublicKey, parseCulqiSecretKey } from "@/lib/culqi/keys";

const TYPE_ICONS = { yape: Smartphone, plin: QrCode, cash: Wallet, culqi: CreditCard };
const TYPE_LABELS = { yape: "Yape", plin: "Plin", cash: "Efectivo", culqi: "Tarjeta (Culqi)" };

/** Organizer: efectivo + Culqi (Yape/billeteras van dentro de Culqi). */
const ORGANIZER_BASE_TYPES = ["cash"] as const;
/** Plataforma: solo Culqi. */
const PLATFORM_TYPES = ["culqi"] as const;

function UploadQRDropzone({ value, onChange }: { value: string | null; onChange: (v: string | null) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const handleFile = (file: File) => {
    if (!file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = () => onChange(reader.result as string);
    reader.readAsDataURL(file);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  return (
    <div>
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        className={cn(
          "relative flex cursor-pointer items-center justify-center rounded-xl border-2 border-dashed p-4 transition-colors",
          dragging ? "border-primary bg-primary/5" : "border-border bg-background hover:border-primary/50",
        )}
      >
        {value ? (
          <div className="relative">
            <Image src={value} alt="QR" width={120} height={120} className="rounded-lg border object-contain" />
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onChange(null); }}
              className="absolute -right-2 -top-2 rounded-full bg-destructive p-0.5 text-destructive-foreground shadow"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-1.5 text-sm text-muted-foreground">
            <Upload className="h-5 w-5" />
            <span>Arrastra o haz clic para subir el QR</span>
          </div>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
      />
    </div>
  );
}

interface Props {
  scope: PaymentMethodScope;
  methods: PaymentMethod[];
  canUseCulqi: boolean;
  planIncludesCulqi?: boolean;
  billedPlanIncludesCulqi?: boolean;
  subscriptionPastDue?: boolean;
  culqiConfigured: boolean;
  hasCulqiMethod: boolean;
  legacyEventLinkCount?: number;
  role: string;
  isStaff: boolean;
  canManageBilling?: boolean;
}

export function PaymentMethodsManager({
  scope,
  methods,
  canUseCulqi,
  planIncludesCulqi = true,
  billedPlanIncludesCulqi = false,
  subscriptionPastDue = false,
  culqiConfigured,
  hasCulqiMethod,
  legacyEventLinkCount = 0,
  role,
  isStaff,
  canManageBilling = true,
}: Props) {
  const t = useTranslations();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const { values, setValue, setValues, clear } = usePersistedFormFields(
    formStorageKey(`payment-methods.${scope}.v3`),
    {
      type: (scope === "platform" ? "culqi" : "cash") as "yape" | "plin" | "cash" | "culqi",
      label: scope === "platform" ? "Tarjeta de crédito/débito" : "",
      holderName: "",
      phone: "",
      qrPreview: null as string | null,
      culqiPublicKey: "",
      culqiSecretKey: "",
    },
  );
  const { type, label, holderName, phone, qrPreview, culqiPublicKey, culqiSecretKey } = values;

  const isPlatform = scope === "platform";
  const isCulqiType = type === "culqi";
  const canAddCulqiType = isPlatform
    ? canUseCulqi && !hasCulqiMethod
    : planIncludesCulqi && !hasCulqiMethod;
  const availableTypes = isPlatform
    ? canAddCulqiType
      ? [...PLATFORM_TYPES]
      : []
    : [...ORGANIZER_BASE_TYPES, ...(canAddCulqiType ? (["culqi"] as const) : [])];

  const resetForm = () => {
    clear();
    setEditingId(null);
    setShowForm(false);
  };

  const openCreateForm = () => {
    if (isPlatform) {
      setValues({
        type: "culqi",
        label: "Tarjeta de crédito/débito",
        holderName: "",
        phone: "",
        qrPreview: null,
        culqiPublicKey: "",
        culqiSecretKey: "",
      });
    } else {
      const defaultType = canAddCulqiType ? "culqi" : "cash";
      setValues({
        type: defaultType,
        label: defaultType === "culqi" ? "Tarjeta de crédito/débito" : "",
        holderName: "",
        phone: "",
        qrPreview: null,
        culqiPublicKey: "",
        culqiSecretKey: "",
      });
    }
    setShowForm(true);
  };

  const edit = (m: PaymentMethod) => {
    setValues({
      type: m.type,
      label: m.label,
      holderName: m.holderName,
      phone: m.phone ?? "",
      qrPreview: m.qrCodeUrl,
      culqiPublicKey: m.culqiPublicKey ?? "",
      culqiSecretKey: "",
    });
    setEditingId(m.id);
    setShowForm(true);
  };

  const visibleMethods = isPlatform ? methods.filter((m) => m.type !== "cash") : methods;
  const legacyWalletMethods = visibleMethods.filter((m) => m.type === "yape" || m.type === "plin");
  const canCreate = availableTypes.length > 0;

  const submit = () => {
    if (!label.trim() || !holderName.trim()) {
      toast.error("Completa todos los campos obligatorios");
      return;
    }

    if (isCulqiType && !isPlatform) {
      try {
        if (!editingId) {
          assertOrganizerCulqiKeys(culqiPublicKey, culqiSecretKey);
        } else {
          if (culqiPublicKey.trim()) {
            const pub = parseCulqiPublicKey(culqiPublicKey);
            if (!pub.ok) throw new Error(pub.error);
          }
          if (culqiSecretKey.trim()) {
            const sec = parseCulqiSecretKey(culqiSecretKey);
            if (!sec.ok) throw new Error(sec.error);
            if (culqiPublicKey.trim()) {
              assertOrganizerCulqiKeys(culqiPublicKey, culqiSecretKey);
            }
          }
        }
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Llaves Culqi inválidas");
        return;
      }
    }

    startTransition(async () => {
      try {
        const data = {
          type,
          label: label.trim(),
          holderName: holderName.trim(),
          phone: isCulqiType || type === "cash" ? null : phone.trim() || null,
          qrCodeUrl: isCulqiType || type === "cash" ? null : qrPreview,
          culqiPublicKey: isCulqiType && !isPlatform ? culqiPublicKey.trim() || null : null,
          culqiSecretKey: isCulqiType && !isPlatform ? culqiSecretKey.trim() || null : null,
        };

        if (editingId) {
          await updatePaymentMethod(scope, editingId, data);
          toast.success("Medio de pago actualizado");
        } else {
          await createPaymentMethod(scope, data);
          toast.success("Medio de pago creado");
        }

        resetForm();
        router.refresh();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Error");
      }
    });
  };

  const remove = (id: string) => {
    const method = methods.find((m) => m.id === id);
    startTransition(async () => {
      try {
        const result = await deletePaymentMethod(scope, id);
        if (method?.type === "culqi" && result.detachedEventCount > 0) {
          toast.success(
            t("payments.config.culqiDeletedWithEvents", { count: result.detachedEventCount }),
          );
        } else if (result.detachedEventCount > 0) {
          toast.success(t("payments.config.methodDeletedWithEvents", { count: result.detachedEventCount }));
        } else {
          toast.success(t("payments.config.methodDeleted"));
        }
        router.refresh();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Error");
      }
    });
  };

  const detachLegacyFromEvents = () => {
    startTransition(async () => {
      try {
        const result = await detachLegacyWalletMethodsFromEvents();
        toast.success(t("payments.config.legacyDetached", { count: result.detached }));
        router.refresh();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Error");
      }
    });
  };

  const selectType = (next: typeof type) => {
    setValues((prev) => ({
      ...prev,
      type: next,
      label: next === "culqi" ? (prev.label || "Tarjeta de crédito/débito") : prev.label,
      phone: next === "culqi" || next === "cash" ? "" : prev.phone,
      qrPreview: next === "culqi" || next === "cash" ? null : prev.qrPreview,
    }));
  };

  const showOrganizerCulqiHints = !isPlatform && role === "organizer";
  const needsPlanUpgrade = showOrganizerCulqiHints && !planIncludesCulqi && !subscriptionPastDue;
  const needsRenewal = showOrganizerCulqiHints && subscriptionPastDue && billedPlanIncludesCulqi;
  const culqiReadyToAdd =
    showOrganizerCulqiHints && planIncludesCulqi && !culqiConfigured;
  const culqiActive =
    showOrganizerCulqiHints && planIncludesCulqi && culqiConfigured;

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-border bg-muted/20 p-4 dark:bg-muted/10">
        <div className="flex gap-3">
          <Info className="h-5 w-5 shrink-0 text-primary" />
          <div className="text-sm text-muted-foreground">
            {isPlatform ? (
              <>
                <p className="font-medium text-foreground">{t("payments.config.platformTitle")}</p>
                <p className="mt-1">{t("payments.config.platformDescription")}</p>
              </>
            ) : (
              <>
                <p className="font-medium text-foreground">{t("payments.config.organizerTitle")}</p>
                <p className="mt-1">{t("payments.config.organizerDescription")}</p>
              </>
            )}
            {needsPlanUpgrade && (
              <p className="mt-2 flex flex-wrap items-center gap-1.5 text-amber-700 dark:text-amber-400">
                <Crown className="h-3.5 w-3.5 shrink-0" />
                {t("payments.config.culqiUpgrade")}
                {canManageBilling ? (
                  <Link href="/organizer/billing" className="font-semibold underline">
                    {t("payments.config.viewPlans")}
                  </Link>
                ) : (
                  <span className="font-semibold">{t("dashboard.organizer.planLimitContactAdmin")}</span>
                )}
              </p>
            )}
            {needsRenewal && (
              <p className="mt-2 flex flex-wrap items-center gap-1.5 text-amber-700 dark:text-amber-400">
                <Crown className="h-3.5 w-3.5 shrink-0" />
                {t("payments.config.culqiRenewPlan")}
                {canManageBilling ? (
                  <Link href="/organizer/billing" className="font-semibold underline">
                    {t("payments.config.renewPlan")}
                  </Link>
                ) : (
                  <span className="font-semibold">{t("dashboard.organizer.planLimitContactAdmin")}</span>
                )}
              </p>
            )}
            {culqiReadyToAdd && (
              <p className="mt-2 text-emerald-700 dark:text-emerald-400">
                {t("payments.config.culqiReadyToAdd")}
              </p>
            )}
            {culqiReadyToAdd && (
              <p className="mt-1 text-xs text-muted-foreground">
                {t("payments.config.culqiKeysHelp")}
              </p>
            )}
            {culqiActive && (
              <p className="mt-2 text-emerald-700 dark:text-emerald-400">
                {t("payments.config.culqiActive")}
              </p>
            )}
            {canUseCulqi && !culqiConfigured && isPlatform && (
              <p className="mt-2 text-amber-700 dark:text-amber-400">
                {t("payments.config.culqiEnvMissing")}
              </p>
            )}
            {canUseCulqi && !culqiConfigured && isStaff && !isPlatform && (
              <p className="mt-2 text-amber-700 dark:text-amber-400">
                {t("payments.config.culqiEnvMissing")}
              </p>
            )}
          </div>
        </div>
      </div>

      {!showForm ? (
        canCreate ? (
          <button
            type="button"
            onClick={openCreateForm}
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" />
            {isPlatform ? t("payments.config.addCulqiMethod") : t("payments.config.addMethod")}
          </button>
        ) : isPlatform && hasCulqiMethod ? (
          <p className="text-sm text-muted-foreground">{t("payments.config.platformCulqiAlreadyActive")}</p>
        ) : null
      ) : (
        <div className="max-w-2xl space-y-5 rounded-2xl border border-border bg-card p-6 shadow-sm">
          <h3 className="font-semibold text-foreground">
            {editingId
              ? t("payments.config.editMethod")
              : isPlatform
                ? t("payments.config.newCulqiMethod")
                : t("payments.config.newMethod")}
          </h3>

          {(!isPlatform || editingId) && (
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">{t("payments.config.type")}</label>
            <div className="flex flex-wrap gap-2">
              {(editingId ? [type] : availableTypes).map((tKey) => {
                const Icon = TYPE_ICONS[tKey];
                const isActive = type === tKey;
                return (
                  <button
                    key={tKey}
                    type="button"
                    onClick={() => !editingId && selectType(tKey)}
                    disabled={!!editingId}
                    className={cn(
                      "flex items-center gap-1.5 rounded-xl border px-3 py-2 text-sm font-medium transition-colors",
                      isActive
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border bg-background text-foreground hover:bg-muted",
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {TYPE_LABELS[tKey]}
                  </button>
                );
              })}
            </div>
          </div>
          )}

          {isPlatform && !editingId && (
            <div className="flex items-center gap-2 rounded-xl border border-primary/20 bg-primary/5 px-3 py-2 text-sm font-medium text-foreground">
              <CreditCard className="h-4 w-4 text-primary" />
              {TYPE_LABELS.culqi}
            </div>
          )}

          {isCulqiType && (
            <div className="rounded-xl border border-violet-200/60 bg-violet-50/50 p-4 text-sm text-violet-900 dark:border-violet-900/30 dark:bg-violet-950/20 dark:text-violet-200">
              {isPlatform ? t("payments.config.platformCulqiHelp") : t("payments.config.culqiHelp")}
              {!isPlatform && (
                <p className="mt-2 text-xs opacity-90">{t("payments.config.culqiSingleMethodHelp")}</p>
              )}
            </div>
          )}

          {isCulqiType && !isPlatform && (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <p className="mb-2 text-xs text-muted-foreground">{t("payments.config.culqiKeysHelp")}</p>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-foreground">
                  {t("payments.config.culqiPublicKey")} *
                </label>
                <input
                  type="text"
                  value={culqiPublicKey}
                  onChange={(e) => setValue("culqiPublicKey", e.target.value)}
                  placeholder="pk_test_... o pk_live_..."
                  className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm font-mono placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-foreground">
                  {t("payments.config.culqiSecretKey")} {editingId ? "" : "*"}
                </label>
                <input
                  type="password"
                  value={culqiSecretKey}
                  onChange={(e) => setValue("culqiSecretKey", e.target.value)}
                  placeholder={editingId ? t("payments.config.culqiSecretKeyKeep") : "sk_test_... o sk_live_..."}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm font-mono placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  autoComplete="new-password"
                />
              </div>
              <p className="sm:col-span-2 text-xs text-muted-foreground">{t("payments.config.culqiKeyEnvHint")}</p>
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-foreground">
                {t("payments.config.label")} *
              </label>
              <input
                type="text"
                value={label}
                onChange={(e) => setValue("label", e.target.value)}
                placeholder={
                  isCulqiType
                    ? t("payments.config.labelPlaceholderCulqi")
                    : type === "yape"
                      ? t("payments.config.labelPlaceholderYape")
                      : type === "plin"
                        ? t("payments.config.labelPlaceholderPlin")
                        : t("payments.config.labelPlaceholderCash")
                }
                className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-foreground">
                {isCulqiType
                  ? isPlatform
                    ? t("payments.config.platformEntityName")
                    : t("payments.config.entityName")
                  : type === "cash"
                    ? t("payments.config.cashReceiver")
                    : t("payments.config.holder")}{" "}
                *
              </label>
              <input
                type="text"
                value={holderName}
                onChange={(e) => setValue("holderName", e.target.value)}
                placeholder={
                  isCulqiType
                    ? isPlatform
                      ? t("payments.config.platformEntityNamePlaceholder")
                      : t("payments.config.entityNamePlaceholder")
                    : type === "cash"
                      ? t("payments.config.cashReceiverPlaceholder")
                      : t("payments.config.holderPlaceholder")
                }
                className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            {!isCulqiType && type !== "cash" && (
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-foreground">
                  {type === "yape" ? "Número Yape" : "Número Plin"}
                </label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setValue("phone", e.target.value)}
                  placeholder="Celular, ej: +51 999 999 999"
                  className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            )}
            {!isCulqiType && type !== "cash" && (
              <div className="sm:col-span-2">
                <label className="mb-1.5 block text-sm font-semibold text-foreground">
                  QR de {type === "yape" ? "Yape" : "Plin"}
                </label>
                <UploadQRDropzone value={qrPreview} onChange={(value) => setValue("qrPreview", value)} />
              </div>
            )}
          </div>

          <div className="flex gap-2">
            <button
              onClick={submit}
              disabled={isPending}
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
            >
              {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              {editingId ? t("payments.config.saveChanges") : t("payments.config.createMethod")}
            </button>
            <button
              onClick={resetForm}
              className="rounded-xl border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
            >
              {t("common.cancel")}
            </button>
          </div>
        </div>
      )}

      <div className="max-w-2xl space-y-3">
        {legacyWalletMethods.length > 0 && (
          <div className="space-y-2 rounded-xl border border-amber-200/60 bg-amber-50/50 px-3 py-3 text-xs text-amber-900 dark:border-amber-900/30 dark:bg-amber-950/20 dark:text-amber-200">
            <p>
              {isPlatform
                ? t("payments.config.platformLegacyHint")
                : t("payments.config.organizerLegacyHint")}
            </p>
            {!isPlatform && legacyEventLinkCount > 0 && (
              <div className="flex flex-wrap items-center gap-2">
                <p>{t("payments.config.legacyEventLinks", { count: legacyEventLinkCount })}</p>
                <button
                  type="button"
                  disabled={isPending}
                  onClick={detachLegacyFromEvents}
                  className="rounded-lg border border-amber-300 bg-white/80 px-2.5 py-1 text-[11px] font-semibold text-amber-900 transition-colors hover:bg-white disabled:opacity-50 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-100"
                >
                  {t("payments.config.detachLegacyFromEvents")}
                </button>
              </div>
            )}
            {!isPlatform && !hasCulqiMethod && planIncludesCulqi && (
              <p className="font-medium">{t("payments.config.migrateToCulqiBanner")}</p>
            )}
          </div>
        )}
        {visibleMethods.length === 0 && (
          <p className="text-sm text-muted-foreground">{t("payments.config.empty")}</p>
        )}
        {visibleMethods.map((m) => {
          const Icon = TYPE_ICONS[m.type];
          const isLegacy = m.type === "yape" || m.type === "plin";
          return (
            <div key={m.id} className="flex items-center gap-4 rounded-xl border border-border bg-card p-4">
              <div className="rounded-lg bg-primary/10 p-2.5">
                <Icon className="h-5 w-5 text-primary" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-medium text-foreground">{m.label}</p>
                  {m.type === "culqi" && (
                    <span className="rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-bold uppercase text-violet-700 dark:bg-violet-900/30 dark:text-violet-300">
                      Instantáneo
                    </span>
                  )}
                  {isLegacy && (
                    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold uppercase text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">
                      Legacy
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  {TYPE_LABELS[m.type]} · {m.holderName}
                  {m.phone ? ` · ${m.phone}` : ""}
                </p>
              </div>
              {m.qrCodeUrl && (
                <Image src={m.qrCodeUrl} alt="QR" width={48} height={48} className="shrink-0 rounded border" />
              )}
              <div className="flex shrink-0 gap-1">
                {!isLegacy && (
                  <button
                    type="button"
                    onClick={() => edit(m)}
                    className="rounded-lg border border-border px-3 py-1 text-xs font-medium text-foreground transition-colors hover:bg-muted"
                  >
                    {t("common.edit")}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => remove(m.id)}
                  className="rounded-lg border border-destructive/30 px-3 py-1 text-xs font-medium text-destructive transition-colors hover:bg-destructive/10"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
