import { countGuestsFromNotes } from "@/lib/registrations/guests";

export function getPaymentDynamicCaption(
  notes: string | null,
  registrationNotes: string | null,
  seatsCount: number | null,
  locale: string,
) {
  const isEn = locale === "en";

  let guestCount = countGuestsFromNotes(registrationNotes);

  // Fallback to regex on payment notes if database records are blank
  if (guestCount === 0 && notes) {
    const guestMatch =
      notes.match(/y (\d+) invitado/i) || notes.match(/and (\d+) guest/i);
    if (guestMatch) guestCount = parseInt(guestMatch[1]);
  }

  let finalSeatsCount = seatsCount ?? 0;
  if (finalSeatsCount === 0 && notes) {
    const seatMatch =
      notes.match(/(\d+) asiento/i) || notes.match(/(\d+) seat/i);
    if (seatMatch) finalSeatsCount = parseInt(seatMatch[1]);
  }

  if (guestCount > 0 || finalSeatsCount > 0) {
    const parts: string[] = [];
    if (guestCount > 0) {
      parts.push(
        isEn
          ? `Owner + ${guestCount} guest${guestCount > 1 ? "s" : ""}`
          : `Titular + ${guestCount} invitado${guestCount > 1 ? "s" : ""}`,
      );
    } else {
      parts.push(isEn ? "1 ticket" : "1 entrada");
    }

    if (finalSeatsCount > 0) {
      parts.push(
        isEn
          ? `${finalSeatsCount} seat${finalSeatsCount > 1 ? "s" : ""}`
          : `${finalSeatsCount} asiento${finalSeatsCount > 1 ? "s" : ""}`,
      );
    }

    return parts.join(" · ");
  }

  if (
    notes &&
    (notes.toLowerCase().includes("offline") ||
      notes.toLowerCase().includes("manual"))
  ) {
    return isEn ? "Manual registration" : "Registro manual";
  }

  return null;
}
