/**
 * Registro central de endpoints de subida a Cloudinary.
 * Replica la config de los uploadRouters de UploadThing (endpoints, límites y roles),
 * ahora con firmas firmadas por nuestro servidor (same idea, nuevo alojamiento).
 */

export type CloudinaryEndpointName =
  | "eventCoverImage"
  | "profileAvatar"
  | "eventAttachment"
  | "paymentReceipt"
  | "testimonialAvatar"
  | "newsletterImage"
  | "landingImpactImage"
  | "certificateSealImage"
  | "teamMemberPhoto"
  | "paymentQr"
  | "signature";

export interface CloudinaryEndpointConfig {
  /** Subcarpeta dentro de enquiva/ en la cuenta Cloudinary. */
  folder: string;
  /** resource_type usado en la URL de subida (image | auto). */
  resourceType: "image" | "auto";
  maxSizeBytes: number;
  maxFileCount: number;
  /** Expansiones de mime; "image/*" cubre cualquier imagen. */
  allowedMimeTypes: string[];
}

const MB = 1024 * 1024;

export const CLOUDINARY_ENDPOINTS: Record<CloudinaryEndpointName, CloudinaryEndpointConfig> = {
  eventCoverImage: {
    folder: "event-covers",
    resourceType: "image",
    maxSizeBytes: 4 * MB,
    maxFileCount: 1,
    allowedMimeTypes: ["image/*"],
  },
  profileAvatar: {
    folder: "avatars",
    resourceType: "image",
    maxSizeBytes: 2 * MB,
    maxFileCount: 1,
    allowedMimeTypes: ["image/*"],
  },
  eventAttachment: {
    folder: "attachments",
    resourceType: "auto",
    maxSizeBytes: 16 * MB,
    maxFileCount: 5,
    allowedMimeTypes: [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ],
  },
  paymentReceipt: {
    folder: "receipts",
    resourceType: "auto",
    maxSizeBytes: 8 * MB,
    maxFileCount: 1,
    allowedMimeTypes: ["application/pdf", "image/*"],
  },
  testimonialAvatar: {
    folder: "testimonials",
    resourceType: "image",
    maxSizeBytes: 2 * MB,
    maxFileCount: 1,
    allowedMimeTypes: ["image/*"],
  },
  newsletterImage: {
    folder: "newsletter",
    resourceType: "image",
    maxSizeBytes: 4 * MB,
    maxFileCount: 1,
    allowedMimeTypes: ["image/*"],
  },
  landingImpactImage: {
    folder: "landing",
    resourceType: "image",
    maxSizeBytes: 4 * MB,
    maxFileCount: 1,
    allowedMimeTypes: ["image/*"],
  },
  certificateSealImage: {
    folder: "seal",
    resourceType: "image",
    maxSizeBytes: 4 * MB,
    maxFileCount: 1,
    allowedMimeTypes: ["image/*"],
  },
  teamMemberPhoto: {
    folder: "team",
    resourceType: "image",
    maxSizeBytes: 2 * MB,
    maxFileCount: 1,
    allowedMimeTypes: ["image/*"],
  },
  paymentQr: {
    folder: "payment-qrs",
    resourceType: "image",
    maxSizeBytes: 2 * MB,
    maxFileCount: 1,
    allowedMimeTypes: ["image/*"],
  },
  signature: {
    folder: "signatures",
    resourceType: "image",
    maxSizeBytes: 2 * MB,
    maxFileCount: 1,
    allowedMimeTypes: ["image/*"],
  },
};

export type CloudinaryUserRole = string;

/**
 * Autorización por endpoint (mismas reglas que los middlewares de UploadThing).
 */
const ORGANIZER_ROLES = new Set<CloudinaryUserRole>(["organizer", "super_admin", "admin"]);
const SUPERADMIN_ROLES = new Set<CloudinaryUserRole>(["super_admin"]);

const ENDPOINT_ALLOWED_ROLES: Record<CloudinaryEndpointName, (role: CloudinaryUserRole) => boolean> = {
  eventCoverImage: (role) => ORGANIZER_ROLES.has(role),
  eventAttachment: (role) => ORGANIZER_ROLES.has(role),
  profileAvatar: () => true,
  paymentReceipt: () => true,
  testimonialAvatar: (role) => SUPERADMIN_ROLES.has(role),
  newsletterImage: (role) => SUPERADMIN_ROLES.has(role),
  landingImpactImage: (role) => role === "super_admin" || role === "admin",
  certificateSealImage: (role) => SUPERADMIN_ROLES.has(role),
  teamMemberPhoto: (role) => SUPERADMIN_ROLES.has(role),
  paymentQr: (role) => ORGANIZER_ROLES.has(role),
  signature: (role) => ORGANIZER_ROLES.has(role),
};

export function isEndpointAllowed(
  endpoint: CloudinaryEndpointName,
  role: CloudinaryUserRole | undefined | null
): boolean {
  if (!role) return false;
  return ENDPOINT_ALLOWED_ROLES[endpoint](role);
}

/** Comprueba un MIME contra patrones ("image/*" cubre cualquier imagen). */
export function matchesAllowedMime(mime: string, patterns: string[]): boolean {
  return patterns.some((pattern) => {
    if (pattern === "image/*") return mime.startsWith("image/");
    return mime === pattern;
  });
}