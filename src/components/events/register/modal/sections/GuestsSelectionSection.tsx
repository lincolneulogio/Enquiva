"use client";

import React from "react";
import { Users, X } from "lucide-react";
import type { GuestInput } from "../../types";

interface GuestsSelectionSectionProps {
  guests: GuestInput[];
  onChangeGuests: (guests: GuestInput[]) => void;
  t: (key: string, params?: Record<string, any>) => string;
}

export function GuestsSelectionSection({
  guests,
  onChangeGuests,
  t,
}: GuestsSelectionSectionProps) {
  const addGuest = () => {
    if (guests.length < 5) {
      onChangeGuests([...guests, { name: "", phone: "" }]);
    }
  };

  const removeGuest = (indexToRemove: number) => {
    onChangeGuests(guests.filter((_, i) => i !== indexToRemove));
  };

  const updateGuestName = (index: number, name: string) => {
    const updated = [...guests];
    updated[index].name = name;
    onChangeGuests(updated);
  };

  const updateGuestPhone = (index: number, phone: string) => {
    const updated = [...guests];
    updated[index].phone = phone;
    onChangeGuests(updated);
  };

  return (
    <div className="space-y-4 p-4 rounded-2xl bg-muted/30 border border-border/60">
      <div className="flex items-center justify-between">
        <div className="space-y-0.5 text-left">
          <label className="text-sm font-semibold text-foreground flex items-center gap-1.5">
            <Users className="h-4 w-4 text-primary" />
            {t("register.guestsQuestion")}
          </label>
          <p className="text-[11px] text-muted-foreground">
            {t("register.guestsHelp")}
          </p>
        </div>
        {guests.length < 5 && (
          <button
            type="button"
            onClick={addGuest}
            className="px-2.5 py-1 text-xs font-semibold bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 transition-all rounded-lg select-none cursor-pointer"
          >
            {t("register.addGuest")}
          </button>
        )}
      </div>

      {guests.length > 0 && (
        <div className="space-y-4 pt-2 border-t border-dashed border-border/80 animate-slideDown">
          {guests.map((guest, idx) => (
            <div
              key={idx}
              className="relative p-3.5 rounded-xl bg-card border border-border flex flex-col gap-2.5"
            >
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  {t("register.guestNumber", { index: idx + 1 })}
                </span>
                <button
                  type="button"
                  onClick={() => removeGuest(idx)}
                  className="text-xs font-bold text-rose-500 hover:text-rose-600 transition-colors flex items-center gap-0.5 select-none cursor-pointer"
                >
                  <X className="h-3.5 w-3.5" /> {t("register.removeGuest")}
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1 text-left">
                  <label className="text-[10px] font-bold text-foreground uppercase block">
                    {t("register.guestFullName")}
                  </label>
                  <input
                    type="text"
                    required
                    placeholder={t("register.guestFullNamePlaceholder")}
                    value={guest.name}
                    onChange={(e) => updateGuestName(idx, e.target.value)}
                    className="w-full px-3 py-1.5 text-xs bg-muted/40 border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary text-foreground placeholder:text-muted-foreground/60"
                  />
                </div>

                <div className="space-y-1 text-left">
                  <label className="text-[10px] font-bold text-foreground uppercase block">
                    {t("register.guestPhoneOptional")}
                  </label>
                  <div className="relative flex items-center">
                    <span className="absolute left-2.5 text-xs text-muted-foreground font-medium select-none border-r border-border pr-2">
                      +51
                    </span>
                    <input
                      type="tel"
                      maxLength={9}
                      placeholder="912345678"
                      value={guest.phone}
                      onChange={(e) => {
                        const onlyDigits = e.target.value.replace(/\D/g, "");
                        if (onlyDigits.length <= 9) {
                          updateGuestPhone(idx, onlyDigits);
                        }
                      }}
                      style={{ paddingLeft: "46px" }}
                      className="w-full pr-3 py-1.5 text-xs bg-muted/40 border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary text-foreground placeholder:text-muted-foreground/60 tracking-wider"
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
