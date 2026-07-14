export type CopilotSuggestion = { label: string; prompt: string };

/**
 * Chips de arranque estrictamente por rol activo.
 * No mezclar sugerencias de otros roles.
 */
export function getCopilotSuggestions(role: string): CopilotSuggestion[] {
  switch (role) {
    case "super_admin":
      return [
        {
          label: "Métricas globales",
          prompt: "¿Cuántos eventos, usuarios e inscripciones hay en toda la plataforma?",
        },
        {
          label: "Auditoría",
          prompt: "Muéstrame los últimos registros de auditoría de seguridad de la plataforma.",
        },
        {
          label: "Check-in global",
          prompt: "Resumen de check-in de los eventos más recientes a nivel plataforma.",
        },
        {
          label: "Módulos Evora",
          prompt: "Como superadministrador, ¿qué módulos de Evora debo operar desde el panel de plataforma?",
        },
      ];
    case "admin":
      return [
        {
          label: "Mi organización",
          prompt: "¿Cuántos eventos e inscritos hay en mi organización?",
        },
        {
          label: "Check-in entidad",
          prompt: "¿Cómo va el check-in en los eventos de mi entidad?",
        },
        {
          label: "Usuarios de mi org",
          prompt: "Lista usuarios relevantes de mi organización.",
        },
        {
          label: "Borrador aviso",
          prompt: "Redáctame un borrador de comunicado para mi organización.",
        },
      ];
    case "organizer":
      return [
        {
          label: "Mis estadísticas",
          prompt: "¿Cuántos eventos e inscritos tengo como organizador?",
        },
        {
          label: "Check-in",
          prompt: "¿Cuántos asistentes ya hicieron check-in en mis eventos?",
        },
        {
          label: "Estado de pago",
          prompt: "¿Cómo consulto el estado de un pago de un inscrito a mis eventos?",
        },
        {
          label: "Cobros Culqi",
          prompt: "Explícame el checkout Culqi aplicado a mis eventos.",
        },
      ];
    default:
      return [
        {
          label: "Mis tickets",
          prompt: "¿Cuáles son mis entradas o tickets activos?",
        },
        {
          label: "Próximo evento",
          prompt: "¿Cuál es mi próximo evento?",
        },
        {
          label: "Mi pago",
          prompt: "¿Cuál es el estado de mi último pago?",
        },
        {
          label: "Inscribirme",
          prompt: "¿Cómo me inscribo a un evento y pago como asistente?",
        },
      ];
  }
}
