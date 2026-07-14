/**
 * Los modelos free (Qwen, GLM, DeepSeek, etc.) a veces filtran tokens de plantilla
 * al texto visible, p. ej. `<|message|>`, `<|end|>` o basura al inicio.
 */

const SPECIAL_TOKEN_RE = /<[|｜][^|｜]*[|｜]>/g;

const SPANISH_START_RE =
  /(?:En la plataforma|En Evora|En tu |La plataforma|El evento|Hay |Actualmente |Según |He consultado |Puedo |Como |Tu |Tus |El módulo|Los eventos|Las inscripciones|Usuario|Admin|Organizador|Miembro|Total|Eventos totales|No encontr|No hay|Sí\.|Si deseas)/i;

export function stripModelControlTokens(text: string): string {
  if (!text) return text;
  return text.replace(SPECIAL_TOKEN_RE, "");
}

/**
 * Quita el prefijo corrupto típico antes del texto real en español.
 */
export function stripLeakedPreface(text: string): string {
  if (!text) return text;
  let cleaned = stripModelControlTokens(text).replace(/^\uFEFF/, "");

  const match = SPANISH_START_RE.exec(cleaned);
  if (match && match.index > 0 && match.index < 320) {
    return cleaned.slice(match.index).trimStart();
  }

  // Si aún hay tokens rotos residuales
  cleaned = stripModelControlTokens(cleaned).trimStart();
  return cleaned;
}

function looksLikeLeakedPreface(text: string): boolean {
  if (SPECIAL_TOKEN_RE.test(text) || /<[|｜]/.test(text)) return true;
  if (/^[\u0400-\u04FF\u0370-\u03FF]/.test(text)) return true;
  if (/bell/i.test(text.slice(0, 40)) && SPANISH_START_RE.test(text)) return true;
  if (/^We need to/i.test(text.trim())) return true;
  return false;
}

/**
 * Buffer para sanitizar en streaming (tokens cortados entre chunks).
 */
export function createResponseSanitizer() {
  let buffer = "";
  let prefaceStripped = false;
  const HOLD_TAIL = 32;
  const PREFACE_WAIT_CHARS = 48;

  const flushSafe = (final: boolean): string => {
    if (!prefaceStripped) {
      const hasSpanish = SPANISH_START_RE.test(buffer);
      const suspicious = looksLikeLeakedPreface(buffer);

      if (!final && suspicious && !hasSpanish && buffer.length < 280) {
        // Seguir acumulando hasta ver el texto útil
        return "";
      }

      if (hasSpanish || final || (!suspicious && buffer.length >= PREFACE_WAIT_CHARS)) {
        buffer = stripLeakedPreface(buffer);
        prefaceStripped = true;
      } else {
        return "";
      }
    } else {
      buffer = stripModelControlTokens(buffer);
    }

    if (final) {
      const out = buffer;
      buffer = "";
      return out;
    }

    if (buffer.length <= HOLD_TAIL) {
      return "";
    }
    const emit = buffer.slice(0, -HOLD_TAIL);
    buffer = buffer.slice(-HOLD_TAIL);
    return emit;
  };

  return {
    push(chunk: string): string {
      buffer += chunk;
      return flushSafe(false);
    },
    end(): string {
      return flushSafe(true);
    },
  };
}
