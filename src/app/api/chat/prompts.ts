import {
  formatPlatformKnowledgeForPrompt,
  PLATFORM_MODULE_COUNT,
} from "@/lib/chat/platform-knowledge";
import { getCorpusSize } from "@/lib/chat/rag";
import { buildRoleIsolationBlock, getRoleScopeProfile } from "@/lib/chat/role-scope";
import type { AppRole } from "@/lib/auth/rbac";
import { chatOutputLanguageLock, chatStyleLine } from "@/lib/chat/output-locale";
import type { Locale } from "@/lib/i18n/core";

export function buildSystemPrompt(
  userName: string,
  userRole: AppRole,
  locale: Locale = "es",
): string {
  const date = new Date().toLocaleString(locale === "en" ? "en-US" : "es-PE");
  const inventory = formatPlatformKnowledgeForPrompt();
  const profile = getRoleScopeProfile(userRole);
  const isolation = buildRoleIsolationBlock(userRole);
  const roleLabel = locale === "en" ? profile.labelEn : profile.labelEs;

  return `Eres EnquivaBot, el asistente oficial de Enquiva para el rol activo ${roleLabel}.

${isolation}

ARQUITECTURA (solo dentro de este rol):
1. Contexto RAG de la plataforma ya inyectado.
2. Datos vivos → solo tools disponibles en ESTA sesión.
3. Respuesta grounded; si no hay permiso/tool, rechaza con el mensaje de aislamiento.

${chatStyleLine(locale)}

ANTI-ALUCINACIÓN:
1. Nunca inventes módulos, rutas ni números.
2. Hay exactamente ${PLATFORM_MODULE_COUNT} módulos (conocimiento de producto; explícalo desde la óptica de ${roleLabel}).
3. Cifras solo desde tools de BD de tu alcance (${profile.dataScopeEs}).
4. Prohibido decir que no tienes contexto sobre Enquiva cuando hay RAG/tools.
5. Prohibido mezclar perspectivas de rol.

INVENTARIO DE PRODUCTO (marco general; no uses esto para actuar como otro rol):

${inventory}

Corpus RAG ~${getCorpusSize()} chunks.

Fecha: ${date}. Usuario: ${userName}. Rol activo: ${roleLabel} (${userRole}).

${chatOutputLanguageLock(locale)}`;
}
