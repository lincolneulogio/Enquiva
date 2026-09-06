"use client";

import { Controller } from "react-hook-form";
import { cn } from "@/lib/utils";
import { getValidationMessage } from "@/lib/auth/messages";
import { ACCOUNT_TYPES, AccountTypeSelectorProps, inputClassName } from "./types";

export function AccountTypeSelector({
  control,
  register,
  errors,
  accountType,
  organizerLinkMode,
  t,
}: AccountTypeSelectorProps) {
  const activeAccountType =
    ACCOUNT_TYPES.find((type) => type.value === accountType) ?? ACCOUNT_TYPES[0];

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-foreground">{t("auth.accountTypeLabel")}</label>
      <Controller
        name="accountType"
        control={control}
        render={({ field }) => (
          <div
            role="tablist"
            aria-label={t("auth.accountTypeLabel")}
            className="grid grid-cols-3 gap-1 rounded-xl border border-border bg-muted/40 p-1"
          >
            {ACCOUNT_TYPES.map((type) => {
              const Icon = type.icon;
              const isActive = field.value === type.value;

              return (
                <button
                  key={type.value}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => field.onChange(type.value)}
                  className={cn(
                    "flex flex-col items-center gap-1 rounded-lg px-2 py-2 text-center transition sm:flex-row sm:justify-center sm:gap-1.5 cursor-pointer",
                    isActive
                      ? "bg-background text-foreground shadow-xs ring-1 ring-primary/25"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  <Icon className={cn("h-4 w-4 shrink-0", isActive && "text-primary")} />
                  <span className="text-[11px] font-medium leading-tight sm:text-sm">{t(type.tabKey)}</span>
                </button>
              );
            })}
          </div>
        )}
      />
      <p className="text-xs text-muted-foreground">{t(activeAccountType.helpKey)}</p>

      {accountType === "entity_admin" && (
        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground">
            {t("auth.orgNameLabel")}
          </label>
          <input
            {...register("orgName")}
            placeholder={t("auth.orgNamePlaceholder")}
            className={inputClassName}
          />
          {errors.orgName && (
            <p className="mt-1 text-xs text-destructive">{getValidationMessage(errors.orgName.message, t)}</p>
          )}
        </div>
      )}

      {accountType === "organizer" && (
        <div className="space-y-2">
          <label className="block text-sm font-medium text-foreground">
            {t("auth.organizerLinkModeLabel")}
          </label>
          <Controller
            name="organizerLinkMode"
            control={control}
            render={({ field }) => (
              <div className="grid grid-cols-2 gap-1 rounded-xl border border-border bg-muted/40 p-1">
                <button
                  type="button"
                  onClick={() => field.onChange("independent")}
                  className={cn(
                    "rounded-lg px-3 py-2 text-left transition cursor-pointer",
                    field.value === "independent"
                      ? "bg-background text-foreground shadow-xs ring-1 ring-primary/25"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  <span className="block text-sm font-medium">{t("auth.organizerLinkIndependent")}</span>
                  <span className="mt-0.5 block text-[11px] leading-snug text-muted-foreground">
                    {t("auth.organizerLinkIndependentHelp")}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => field.onChange("entity")}
                  className={cn(
                    "rounded-lg px-3 py-2 text-left transition cursor-pointer",
                    field.value === "entity"
                      ? "bg-background text-foreground shadow-xs ring-1 ring-primary/25"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  <span className="block text-sm font-medium">{t("auth.organizerLinkEntity")}</span>
                  <span className="mt-0.5 block text-[11px] leading-snug text-muted-foreground">
                    {t("auth.organizerLinkEntityHelp")}
                  </span>
                </button>
              </div>
            )}
          />

          {organizerLinkMode === "entity" && (
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">
                {t("auth.inviteCodeLabel")}
              </label>
              <input
                {...register("inviteCode", { required: organizerLinkMode === "entity" })}
                placeholder={t("auth.inviteCodePlaceholder")}
                required={organizerLinkMode === "entity"}
                className={cn(inputClassName, "uppercase")}
              />
              {errors.inviteCode && (
                <p className="mt-1 text-xs text-destructive">
                  {getValidationMessage(errors.inviteCode.message, t)}
                </p>
              )}
              <p className="mt-1 text-xs text-muted-foreground">{t("auth.inviteCodeHelp")}</p>
            </div>
          )}
        </div>
      )}

      {(accountType === "organizer" || accountType === "entity_admin") && (
        <p className="rounded-xl border border-amber-200/60 bg-amber-50/50 px-3 py-2 text-xs text-amber-900 dark:border-amber-900/30 dark:bg-amber-950/20 dark:text-amber-200">
          {accountType === "entity_admin"
            ? t("auth.accountTypeEntityAdminPlanNote")
            : organizerLinkMode === "entity"
              ? t("auth.accountTypeOrganizerPlanNote")
              : t("auth.accountTypeOrganizerIndependentPlanNote")}
        </p>
      )}
    </div>
  );
}
