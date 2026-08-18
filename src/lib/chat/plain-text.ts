/**
 * El modelo a veces emite markdown (**negrita**, # títulos).
 * El chat muestra texto plano, así que hay que quitar los artefactos.
 */
export function stripMarkdownArtifacts(text: string): string {
  if (!text) return text;
  return text
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/__([^_]+)__/g, "$1")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/\*\*/g, "")
    .replace(/__/g, "");
}
