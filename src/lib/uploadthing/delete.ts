import { UTApi } from "uploadthing/server";

const utapi = new UTApi();

/**
 * Extrae la key del archivo a partir de una URL de UploadThing y lo elimina del bucket.
 * Diseñado como helper seguro y resiliente con logs detallados.
 */
export async function deleteUploadThingFile(url: string | null | undefined): Promise<boolean> {
  if (!url || (!url.includes("uploadthing") && !url.includes("utfs.io"))) {
    return false;
  }

  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;
    const segments = pathname.split("/").filter(Boolean);

    if (segments.length === 0) return false;

    // La fileKey es el último segmento de la URL
    const fileKey = segments[segments.length - 1];

    const response = await utapi.deleteFiles(fileKey);
    return response.success;
  } catch (error) {
    console.error(`[UploadThing Delete Error] Failed to delete file at ${url}:`, error);
    return false;
  }
}
