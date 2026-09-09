"use server";

import { deleteCloudinaryFile, parseCloudinaryUrl } from "@/lib/cloudinary/server";
import { requireSuperAdmin, requireAuth } from "@/lib/auth/guards";

/**
 * Server Action segura para eliminar un archivo huérfano de Cloudinary.
 * Solo accesible por SuperAdmin. Se llama cuando el usuario sube una imagen
 * pero cierra/cancela el formulario sin guardar.
 */
export async function deleteOrphanUploadAction(url: string): Promise<{ success: boolean }> {
  await requireSuperAdmin();

  if (!url?.trim()) return { success: false };

  const deleted = await deleteCloudinaryFile(url);
  return { success: deleted };
}

/**
 * Elimina un archivo huérfano de Cloudinary perteneciente a carpetas del
 * organizador (firma de certificados / QR de métodos de pago).
 * Solo usuarios autenticados y solo esos prefijos de carpeta.
 */
export async function deleteOrganizerUploadAction(url: string): Promise<{ success: boolean }> {
  await requireAuth();

  if (!url?.trim() || !url.includes("res.cloudinary.com")) return { success: false };

  const parsed = parseCloudinaryUrl(url);
  const allowedPrefixes = ["enquiva/signatures/", "enquiva/payment-qrs/"];
  if (
    !parsed ||
    !allowedPrefixes.some((prefix) => parsed.publicId.startsWith(prefix))
  ) {
    return { success: false };
  }

  const deleted = await deleteCloudinaryFile(url);
  return { success: deleted };
}
