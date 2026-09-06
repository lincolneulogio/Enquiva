import { CreditCard, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslations } from "@/components/providers/LocaleProvider";
import { UploadQRDropzone } from "./UploadQRDropzone";
import {
  TYPE_ICONS,
  TYPE_LABELS,
  type PaymentMethodFormValues,
  type PaymentMethodScope,
} from "./types";

interface PaymentMethodFormProps {
  scope: PaymentMethodScope;
  editingId: string | null;
  formValues: PaymentMethodFormValues;
  availableTypes: readonly ("cash" | "culqi" | "yape" | "plin")[];
  isPending: boolean;
  onFieldChange: <K extends keyof PaymentMethodFormValues>(
    field: K,
    value: PaymentMethodFormValues[K],
  ) => void;
  onSelectType: (next: "yape" | "plin" | "cash" | "culqi") => void;
  onSubmit: () => void;
  onCancel: () => void;
}

export function PaymentMethodForm({
  scope,
  editingId,
  formValues,
  availableTypes,
  isPending,
  onFieldChange,
  onSelectType,
  onSubmit,
  onCancel,
}: PaymentMethodFormProps) {
  const t = useTranslations();
  const isPlatform = scope === "platform";
  const { type, label, holderName, phone, qrPreview, culqiPublicKey, culqiSecretKey } = formValues;
  const isCulqiType = type === "culqi";

  return (
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
                  onClick={() => !editingId && onSelectType(tKey)}
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
              onChange={(e) => onFieldChange("culqiPublicKey", e.target.value)}
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
              onChange={(e) => onFieldChange("culqiSecretKey", e.target.value)}
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
            onChange={(e) => onFieldChange("label", e.target.value)}
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
            onChange={(e) => onFieldChange("holderName", e.target.value)}
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
              onChange={(e) => onFieldChange("phone", e.target.value)}
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
            <UploadQRDropzone value={qrPreview} onChange={(value) => onFieldChange("qrPreview", value)} />
          </div>
        )}
      </div>

      <div className="flex gap-2">
        <button
          onClick={onSubmit}
          disabled={isPending}
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
        >
          {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
          {editingId ? t("payments.config.saveChanges") : t("payments.config.createMethod")}
        </button>
        <button
          onClick={onCancel}
          className="rounded-xl border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
        >
          {t("common.cancel")}
        </button>
      </div>
    </div>
  );
}
