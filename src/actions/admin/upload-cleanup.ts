"use server";

import { deleteCloudinaryFile, parseCloudinaryUrl } from "@/lib/cloudinary/server";
import { requireSuperAdmin, requireAuth } from "@/lib/auth/guards";

/**
 * Server Action segura para eliminar un archivo huérfano subido (local o
 * Cloudinary). Solo accesible por SuperAdmin. Se llama cuando el usuario sube
 * una imagen pero cierra/cancela el formulario sin guardar.
 */
export async function deleteOrphanUploadAction(url: string): Promise<{ success: boolean }> {
  await requireSuperAdmin();

  if (!url?.trim()) return { success: false };

  const deleted = await deleteCloudinaryFile(url);
  return { success: deleted };
}

const ORGANIZER_MANAGED_FOLDERS = new Set(["signatures", "payment-qrs"]);

/**
 * Elimina un archivo huérfano perteneciente a carpetas del organizador
 * (firma de certificados / QR de métodos de pago), en local o Cloudinary.
 * Solo usuarios autenticados y solo esos prefijos de carpeta.
 */
export async function deleteOrganizerUploadAction(url: string): Promise<{ success: boolean }> {
  await requireAuth();

  if (!url?.trim()) return { success: false };

  if (url.startsWith("/uploads/")) {
    // URL local: /uploads/<folder>/<archivo>
    const folder = url.split("/")[2];
    if (!folder || !ORGANIZER_MANAGED_FOLDERS.has(folder)) return { success: false };
  } else {
    // URL Cloudinary: public_id bajo enquiva/signatures/ o enquiva/payment-qrs/
    if (!url.includes("res.cloudinary.com")) return { success: false };
    const parsed = parseCloudinaryUrl(url);
    const allowedPrefixes = ["enquiva/signatures/", "enquiva/payment-qrs/"];
    if (!parsed || !allowedPrefixes.some((prefix) => parsed.publicId.startsWith(prefix))) {
      return { success: false };
    }
  }

  const deleted = await deleteCloudinaryFile(url);
  return { success: deleted };
}
