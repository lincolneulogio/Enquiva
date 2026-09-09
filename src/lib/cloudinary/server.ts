import "server-only";

import { createHash } from "crypto";
import { env } from "@/env";

/**
 * Firma SHA-1 de parámetros al estilo Cloudinary: params ordenados por key,
 * unidos como `k=v&k2=v2`, sin valores vacíos, + api secret al final.
 */
export function buildCloudinarySignature(
  params: Record<string, string>,
  apiSecret: string
): string {
  const canonical = Object.keys(params)
    .sort()
    .filter((key) => params[key] !== "")
    .map((key) => `${key}=${params[key]}`)
    .join("&");

  return createHash("sha1").update(`${canonical}${apiSecret}`, "utf8").digest("hex");
}

export interface CloudinaryConfig {
  cloudName: string;
  apiKey: string;
  apiSecret: string;
}

export function getCloudinaryConfig(): CloudinaryConfig {
  return {
    cloudName: env.CLOUDINARY_CLOUD_NAME,
    apiKey: env.CLOUDINARY_API_KEY,
    apiSecret: env.CLOUDINARY_API_SECRET,
  };
}

export interface CloudinaryUploadSign {
  cloudName: string;
  apiKey: string;
  timestamp: number;
  signature: string;
  publicId: string;
  resourceType: CloudinaryResourceType;
}

export type CloudinaryResourceType = "auto" | "image" | "raw";

/** Genera la firma para una subida directa del navegador a api.cloudinary.com. */
export function signCloudinaryUpload(
  folderPath: string,
  resourceType: CloudinaryResourceType
): CloudinaryUploadSign {
  const { cloudName, apiKey, apiSecret } = getCloudinaryConfig();
  const timestamp = Math.floor(Date.now() / 1000);
  const publicId = `enquiva/${folderPath}/${crypto.randomUUID()}`;

  const signature = buildCloudinarySignature(
    { public_id: publicId, timestamp: String(timestamp) },
    apiSecret
  );

  return {
    cloudName,
    apiKey,
    timestamp,
    signature,
    publicId,
    resourceType,
  };
}

interface ParsedCloudinaryAsset {
  resourceType: "image" | "raw" | "video";
  publicId: string;
}

/**
 * Extrae resourceType + publicId desde una URL de Cloudinary.
 * Soporta URLs propias (`.../<resource>/upload/v<ts>/enquiva/<folder>/<name>.<ext>`),
 * con o sin segmento de versión.
 */
export function parseCloudinaryUrl(url: string): ParsedCloudinaryAsset | null {
  try {
    const pathname = decodeURIComponent(new URL(url).pathname);

    const match = pathname.match(/\/(image|video|raw)\/upload\/(.*)$/);
    if (!match) return null;

    const [, resourceType, tail] = match;
    const segments = tail.split("/").filter(Boolean);

    // Descarta el segmento de versión (p. ej. v1712345678).
    while (segments.length > 0 && /^v\d+$/.test(segments[0])) {
      segments.shift();
    }

    if (segments.length === 0) return null;

    const publicId = segments.join("/").replace(/\.[^.]+$/, "");
    if (!publicId) return null;

    return { resourceType: resourceType as ParsedCloudinaryAsset["resourceType"], publicId };
  } catch {
    return null;
  }
}

/**
 * Elimina un asset de Cloudinary a partir de su URL pública.
 * Diseñado como helper seguro y resiliente (misma firma que deleteUploadThingFile).
 */
export async function deleteCloudinaryFile(
  url: string | null | undefined
): Promise<boolean> {
  if (!url || !url.includes("res.cloudinary.com")) {
    return false;
  }

  try {
    const parsed = parseCloudinaryUrl(url);
    if (!parsed) return false;

    const { cloudName, apiKey, apiSecret } = getCloudinaryConfig();
    const timestamp = Math.floor(Date.now() / 1000);
    const params = {
      public_id: parsed.publicId,
      timestamp: String(timestamp),
    };
    const signature = buildCloudinarySignature(params, apiSecret);

    const form = new URLSearchParams({
      ...params,
      api_key: apiKey,
      signature,
    });

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/${parsed.resourceType}/destroy`,
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: form.toString(),
      }
    );

    const data = (await response.json().catch(() => null)) as { result?: string } | null;
    return data?.result === "ok";
  } catch (error) {
    console.error(`[Cloudinary Delete Error] Failed to delete file at ${url}:`, error);
    return false;
  }
}