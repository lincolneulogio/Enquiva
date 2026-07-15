type TranslateFn = (key: string, params?: Record<string, string | number>) => string;

/**
 * Maps AccountPasswordError codes (and wipe/delete fallthroughs) to user-facing copy.
 */
export function passwordErrorMessage(
  t: TranslateFn,
  message: string,
  context: "delete" | "wipe",
): string {
  const code = message.trim();
  if (code === "PASSWORD_NOT_SET") {
    return t("common.passwordNotSet");
  }
  if (code === "PASSWORD_RATE_LIMITED") {
    return t("common.passwordRateLimited");
  }
  if (code === "PASSWORD_REQUIRED") {
    return context === "wipe"
      ? t("billing.organizer.wipePasswordRequired")
      : t("common.deleteEventPasswordRequired");
  }
  if (
    code === "PASSWORD_INVALID" ||
    code.toLowerCase().includes("password") ||
    code.toLowerCase().includes("contraseña")
  ) {
    return context === "wipe"
      ? t("billing.organizer.wipeWrongPassword")
      : t("common.deleteEventWrongPassword");
  }
  return message;
}
