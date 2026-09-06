import { slugify } from "@/lib/utils";

/**
 * Slug canónico desde el nombre: minúsculas, sin acentos, guiones.
 * Si el nombre queda vacío, el slug también.
 */
export function planSlugFromName(name: string) {
  const normalized = name
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ñ/g, "n");
  return slugify(normalized);
}
