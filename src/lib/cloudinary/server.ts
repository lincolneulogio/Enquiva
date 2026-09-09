import "server-only";

import { createHash, randomUUID } from "crypto";
import { mkdir, writeFile, unlink, access } from "node:fs/promises";
import path from "node:path";
import { env } from "@/env";

/**
 * Almacenamiento activo: "local" guarda en `public/uploads/<carpeta>/`
 * (dev sin tocar la cuenta de Cloudinary); "cloudinary" usa la cuenta real.
 * Por defecto: local en desarrollo/test, cloudinary en producción. Se puede
 * forzar con UPLOAD_STORAGE=local|cloudinary.
 */
export function isLocalStorageMode(): boolean {
  const explicit = process.env.UPLOAD_STORAGE;
  if (explicit === "local") return true;
  if (explicit === "cloudinary") return false;
  return process.env.NODE_ENV !== "production";
}

/** Raíz absoluta donde se guardan los archivos en modo local. */
export function uploadsRootDir(): string {
  return path.join(process.cwd(), "public", "uploads");
}

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
  const publicId = `enquiva/${folderPath}/${randomUUID()}`;

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
 * Elimina un asset a partir de su URL pública. Conoce el almacenamiento activo:
 * URLs locales `/uploads/...` se borran del disco; URLs de
 * `res.cloudinary.com` se destruyen vía la API de Cloudinary.
 */
export async function deleteCloudinaryFile(
  url: string | null | undefined
): Promise<boolean> {
  if (!url) return false;

  // Modo local: borrado directo del archivo en public/uploads.
  if (url.startsWith("/uploads/")) {
    return deleteLocalUploadFile(url);
  }

  if (!url.includes("res.cloudinary.com")) {
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

/**
 * Resuelve de forma segura una URL `/uploads/<carpeta>/<archivo>` a un path
 * dentro de `public/uploads` (evita path traversal con "..").
 */
function resolveLocalUploadPath(url: string): string | null {
  const decoded = decodeURIComponent(url);
  const root = uploadsRootDir();
  const relative = decoded.replace(/^\/uploads\//, "");
  const abs = path.resolve(root, relative);
  if (!abs.startsWith(path.resolve(root) + path.sep)) return null;
  return abs;
}

/** Borra un archivo local; devuelve true si ya no existe (idempotente). */
async function deleteLocalUploadFile(url: string): Promise<boolean> {
  try {
    const target = resolveLocalUploadPath(url);
    if (!target) return false;
    await access(target);
    await unlink(target);
    return true;
  } catch {
    // No existe: considerado eliminado.
    return true;
  }
}

/** Escribe bytes en public/uploads/<folder>/<uuid>.<ext>; devuelve la URL pública. */
export async function writeLocalUploadFile(
  folder: string,
  extension: string,
  data: Buffer
): Promise<string> {
  const root = uploadsRootDir();
  const dir = path.join(root, folder);
  await mkdir(dir, { recursive: true });
  const filename = `${randomUUID()}.${extension}`;
  await writeFile(path.join(dir, filename), data);
  return `/uploads/${folder}/${filename}`;
}