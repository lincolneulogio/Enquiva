"use server";

import { requireSuperAdmin } from "@/lib/auth/guards";
import { getSystemSettings, saveSystemSettings } from "@/lib/settings";
import { deleteCloudinaryFile } from "@/lib/cloudinary/server";
import { revalidatePath } from "next/cache";
import { DEFAULT_CERTIFICATE_SEAL_URL } from "@/lib/certificates/constants";

/**
 * Obtiene la URL pública del sello oficial de certificados.
 * Accesible públicamente para renderizar certificados y badges de verificación.
 */
export async function getCertificateSealAction(): Promise<{
  success: boolean;
  sealUrl: string;
}> {
  try {
    const settings = await getSystemSettings();
    return {
      success: true,
      sealUrl: settings.certificateSealUrl || DEFAULT_CERTIFICATE_SEAL_URL,
    };
  } catch {
    return {
      success: true,
      sealUrl: DEFAULT_CERTIFICATE_SEAL_URL,
    };
  }
}

/**
 * Guarda una nueva URL para el sello oficial Enquiva Verified de certificados.
 * Solo SuperAdmin.
 */
export async function saveCertificateSealAction(newSealUrl: string): Promise<{
  success: boolean;
  sealUrl?: string;
  error?: string;
}> {
  try {
    const user = await requireSuperAdmin();
    const cleanUrl = newSealUrl?.trim() || DEFAULT_CERTIFICATE_SEAL_URL;

    const currentSettings = await getSystemSettings();
    const oldUrl = currentSettings.certificateSealUrl;

    // Si había una imagen personalizada anterior en Cloudinary y se está cambiando, limpiarla
    if (
      oldUrl &&
      oldUrl !== cleanUrl &&
      oldUrl !== DEFAULT_CERTIFICATE_SEAL_URL &&
      oldUrl.includes("res.cloudinary.com")
    ) {
      deleteCloudinaryFile(oldUrl).catch(() => {});
    }

    await saveSystemSettings(
      {
        certificateSealUrl: cleanUrl,
      },
      { id: user.id, name: user.name || "SuperAdmin" }
    );

    revalidatePath("/superadmin/settings");
    revalidatePath("/admin/settings");
    revalidatePath("/verify/[code]");
    revalidatePath("/member/certificates");

    return {
      success: true,
      sealUrl: cleanUrl,
    };
  } catch (error) {
    console.error("[saveCertificateSealAction] Error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error al guardar el sello oficial",
    };
  }
}

/**
 * Restablece el sello oficial de certificados a la imagen oficial predeterminada de Enquiva.
 */
export async function resetCertificateSealAction(): Promise<{
  success: boolean;
  sealUrl?: string;
  error?: string;
}> {
  return saveCertificateSealAction(DEFAULT_CERTIFICATE_SEAL_URL);
}
