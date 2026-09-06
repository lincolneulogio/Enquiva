import { toast } from "sonner";
import type { GuestInput } from "../../types";

interface ValidateRegistrationOptions {
  hasMultipleSchedules: boolean;
  effectiveScheduleId: string;
  effectiveWantsTransport: boolean;
  contactPhone: string;
  guests: GuestInput[];
  t: (key: string, params?: Record<string, any>) => string;
}

export function validateRegistrationInputs({
  hasMultipleSchedules,
  effectiveScheduleId,
  effectiveWantsTransport,
  contactPhone,
  guests,
  t,
}: ValidateRegistrationOptions): boolean {
  if (hasMultipleSchedules && !effectiveScheduleId) {
    toast.error(t("register.selectedScheduleRequired"));
    return false;
  }

  if (effectiveWantsTransport) {
    if (contactPhone.trim() === "") {
      toast.error(t("register.phoneRequiredForTransport"));
      return false;
    }
    const cleanPhone = contactPhone.replace(/\D/g, "");
    if (cleanPhone.length !== 9 || !cleanPhone.startsWith("9")) {
      toast.error(t("register.phoneMustBePeruMobile"));
      return false;
    }

    for (let i = 0; i < guests.length; i++) {
      const guest = guests[i];
      if (guest.phone) {
        const cleanGuestPhone = guest.phone.replace(/\D/g, "");
        if (cleanGuestPhone.length !== 9 || !cleanGuestPhone.startsWith("9")) {
          toast.error(
            t("register.guestPhoneInvalid", { index: i + 1, name: guest.name }),
          );
          return false;
        }
      }
    }
  }

  for (let i = 0; i < guests.length; i++) {
    if (guests[i].name.trim().length < 2) {
      toast.error(t("register.guestNameInvalid", { index: i + 1 }));
      return false;
    }
  }

  return true;
}
