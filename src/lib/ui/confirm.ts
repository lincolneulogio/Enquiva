"use client";

import Swal from "@/lib/ui/swal-client";

export type ConfirmTone = "danger" | "warning" | "info" | "success";

interface ConfirmDeleteOptions {
  title?: string;
  text: string;
  confirmText: string;
  cancelText: string;
  tone?: ConfirmTone;
}

interface ConfirmWithPasswordOptions extends ConfirmDeleteOptions {
  passwordPlaceholder: string;
  passwordRequiredMessage: string;
}

function getToneConfig(tone: ConfirmTone) {
  if (tone === "danger") {
    return {
      icon: "warning" as const,
      popupClass: "fe-swal-popup fe-swal-popup--danger",
      confirmClass: "fe-swal-confirm fe-swal-confirm--danger",
    };
  }

  if (tone === "success") {
    return {
      icon: "question" as const,
      popupClass: "fe-swal-popup fe-swal-popup--success",
      confirmClass: "fe-swal-confirm fe-swal-confirm--success",
    };
  }

  if (tone === "info") {
    return {
      icon: "question" as const,
      popupClass: "fe-swal-popup fe-swal-popup--info",
      confirmClass: "fe-swal-confirm fe-swal-confirm--info",
    };
  }

  return {
    icon: "warning" as const,
    popupClass: "fe-swal-popup fe-swal-popup--warning",
    confirmClass: "fe-swal-confirm fe-swal-confirm--warning",
  };
}

export async function confirmDeleteAction({
  title = "Confirmar acción",
  text,
  confirmText,
  cancelText,
  tone = "warning",
}: ConfirmDeleteOptions) {
  const toneConfig = getToneConfig(tone);

  const result = await Swal.fire({
    title,
    text,
    icon: toneConfig.icon,
    showCancelButton: true,
    confirmButtonText: confirmText,
    cancelButtonText: cancelText,
    reverseButtons: true,
    focusCancel: true,
    allowOutsideClick: true,
    allowEscapeKey: true,
    buttonsStyling: false,
    customClass: {
      popup: toneConfig.popupClass,
      title: "fe-swal-title",
      htmlContainer: "fe-swal-text",
      actions: "fe-swal-actions",
      confirmButton: toneConfig.confirmClass,
      cancelButton: "fe-swal-cancel",
    },
  });

  return result.isConfirmed;
}

/**
 * Modal especial Enquiva (fe-swal) con advertencia + campo de contraseña obligatorio.
 */
export async function confirmWithPasswordAction({
  title = "Confirmar acción",
  text,
  confirmText,
  cancelText,
  tone = "danger",
  passwordPlaceholder,
  passwordRequiredMessage,
}: ConfirmWithPasswordOptions): Promise<string | null> {
  const toneConfig = getToneConfig(tone);

  const result = await Swal.fire({
    title,
    html: `<p class="fe-swal-password-hint">${text}</p>`,
    icon: toneConfig.icon,
    input: "password",
    inputPlaceholder: passwordPlaceholder,
    inputAttributes: {
      autocapitalize: "off",
      autocorrect: "off",
      autocomplete: "current-password",
      "aria-label": passwordPlaceholder,
    },
    showCancelButton: true,
    confirmButtonText: confirmText,
    cancelButtonText: cancelText,
    reverseButtons: true,
    focusConfirm: false,
    focusCancel: false,
    allowOutsideClick: false,
    allowEscapeKey: true,
    buttonsStyling: false,
    customClass: {
      popup: `${toneConfig.popupClass} fe-swal-popup--with-password`,
      title: "fe-swal-title",
      htmlContainer: "fe-swal-text",
      input: "fe-swal-password-input",
      validationMessage: "fe-swal-validation",
      actions: "fe-swal-actions",
      confirmButton: toneConfig.confirmClass,
      cancelButton: "fe-swal-cancel",
    },
    preConfirm: (value) => {
      const password = typeof value === "string" ? value.trim() : "";
      if (!password) {
        Swal.showValidationMessage(passwordRequiredMessage);
        return false;
      }
      return password;
    },
  });

  if (!result.isConfirmed || typeof result.value !== "string" || !result.value) {
    return null;
  }

  return result.value;
}
