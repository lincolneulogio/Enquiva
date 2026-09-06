"use client";

import React from "react";

interface TransportContactPhoneInputProps {
  contactPhone: string;
  onChangeContactPhone: (phone: string) => void;
  t: (key: string, params?: Record<string, any>) => string;
}

export function TransportContactPhoneInput({
  contactPhone,
  onChangeContactPhone,
  t,
}: TransportContactPhoneInputProps) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-semibold text-foreground uppercase tracking-wider block">
        {t("register.contactPhoneForBus")}{" "}
        <span className="text-rose-500 font-bold">{t("register.requiredMark")}</span>:
      </label>
      <div className="relative flex items-center">
        <span className="absolute left-3.5 text-sm text-muted-foreground font-medium select-none pointer-events-none border-r border-border/80 pr-2.5">
          +51
        </span>
        <input
          type="tel"
          maxLength={9}
          placeholder="912345678"
          value={contactPhone}
          onChange={(e) => {
            const onlyDigits = e.target.value.replace(/\D/g, "");
            if (onlyDigits.length <= 9) {
              onChangeContactPhone(onlyDigits);
            }
          }}
          style={{ paddingLeft: "54px" }}
          className={`w-full pr-3 py-2.5 text-sm bg-card border rounded-xl focus:outline-none focus:ring-2 transition-all duration-300 font-medium tracking-wide ${
            contactPhone.length === 0
              ? "border-border focus:ring-primary/20 focus:border-primary"
              : contactPhone.length < 9
              ? "border-amber-500/40 focus:ring-amber-500/20 focus:border-amber-500"
              : !contactPhone.startsWith("9")
              ? "border-rose-500/40 focus:ring-rose-500/20 focus:border-rose-500"
              : "border-green-500/40 focus:ring-green-500/20 focus:border-green-500"
          }`}
        />
      </div>
      {contactPhone.length > 0 && (
        <p
          className={`text-[10px] font-semibold transition-all duration-300 ${
            contactPhone.length < 9
              ? "text-amber-500"
              : !contactPhone.startsWith("9")
              ? "text-rose-500"
              : "text-green-500"
          }`}
        >
          {contactPhone.length < 9
            ? t("register.digitsMissing", {
                count: 9 - contactPhone.length,
                plural: 9 - contactPhone.length > 1 ? "s" : "",
              })
            : !contactPhone.startsWith("9")
            ? t("register.phoneMustStartWith9")
            : t("register.phoneCompleteValid")}
        </p>
      )}
      {contactPhone.length === 0 && (
        <p className="text-[10px] text-muted-foreground">
          {t("register.phoneExactly9Help")}
        </p>
      )}
    </div>
  );
}
