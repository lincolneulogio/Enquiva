"use server";

import { deleteUploadThingFile } from "@/lib/uploadthing/delete";
import { requireSuperAdmin } from "@/lib/auth/guards";

/**
 * Server Action segura para eliminar un archivo huérfano de UploadThing.
 * Solo accesible por SuperAdmin. Se llama cuando el usuario sube una imagen
 * pero cierra/cancela el formulario sin guardar.
 */
export async function deleteOrphanUploadAction(url: string): Promise<{ success: boolean }> {
  await requireSuperAdmin();

  if (!url?.trim()) return { success: false };

  const deleted = await deleteUploadThingFile(url);
  return { success: deleted };
}
