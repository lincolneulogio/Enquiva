"use client";

import Swal from "sweetalert2";

export type ConfirmTone = "danger" | "warning" | "info" | "success";

interface ConfirmDeleteOptions {
    title?: string;
    text: string;
    confirmText: string;
    cancelText: string;
    tone?: ConfirmTone;
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