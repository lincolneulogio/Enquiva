"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  createPaymentMethod,
  updatePaymentMethod,
  deletePaymentMethod,
  detachLegacyWalletMethodsFromEvents,
} from "@/actions/payment-methods";
import { Plus } from "lucide-react";
import { useTranslations } from "@/components/providers/LocaleProvider";
import type { PaymentMethod } from "@/lib/db/schema";
import { usePersistedFormFields } from "@/hooks/useFormPersistence";
import { formStorageKey } from "@/lib/form-persistence";
import { assertOrganizerCulqiKeys, parseCulqiPublicKey, parseCulqiSecretKey } from "@/lib/culqi/keys";
import {
  type PaymentMethodsManagerProps,
  type PaymentMethodFormValues,
  ORGANIZER_BASE_TYPES,
  PLATFORM_TYPES,
  PaymentMethodScopeNotice,
  PaymentMethodForm,
  PaymentMethodList,
} from "./methods";

export type { PaymentMethodsManagerProps };

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
}: PaymentMethodsManagerProps) {
  const t = useTranslations();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const { values, setValue, setValues, clear } = usePersistedFormFields<PaymentMethodFormValues>(
    formStorageKey(`payment-methods.${scope}.v3`),
    {
      type: scope === "platform" ? "culqi" : "cash",
      label: scope === "platform" ? "Tarjeta de crédito/débito" : "",
      holderName: "",
      phone: "",
      qrPreview: null,
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

  return (
    <div className="space-y-6">
      <PaymentMethodScopeNotice
        scope={scope}
        canUseCulqi={canUseCulqi}
        planIncludesCulqi={planIncludesCulqi}
        billedPlanIncludesCulqi={billedPlanIncludesCulqi}
        subscriptionPastDue={subscriptionPastDue}
        culqiConfigured={culqiConfigured}
        role={role}
        isStaff={isStaff}
        canManageBilling={canManageBilling}
      />

      {!showForm ? (
        canCreate ? (
          <button
            type="button"
            onClick={openCreateForm}
            className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" />
            {isPlatform ? t("payments.config.addCulqiMethod") : t("payments.config.addMethod")}
          </button>
        ) : isPlatform && hasCulqiMethod ? (
          <p className="text-sm text-muted-foreground">{t("payments.config.platformCulqiAlreadyActive")}</p>
        ) : null
      ) : (
        <PaymentMethodForm
          scope={scope}
          editingId={editingId}
          formValues={values}
          availableTypes={availableTypes}
          isPending={isPending}
          onFieldChange={setValue}
          onSelectType={selectType}
          onSubmit={submit}
          onCancel={resetForm}
        />
      )}

      <PaymentMethodList
        scope={scope}
        visibleMethods={visibleMethods}
        legacyWalletMethods={legacyWalletMethods}
        legacyEventLinkCount={legacyEventLinkCount}
        hasCulqiMethod={hasCulqiMethod}
        planIncludesCulqi={planIncludesCulqi}
        isPending={isPending}
        onEdit={edit}
        onRemove={remove}
        onDetachLegacy={detachLegacyFromEvents}
      />
    </div>
  );
}
