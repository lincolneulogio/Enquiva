export type CopilotSuggestion = { label: string; prompt: string };

export function getCopilotSuggestions(role: string): CopilotSuggestion[] {
  switch (role) {
    case "super_admin":
      return [
        { label: "Estadísticas globales", prompt: "¿Cuántos eventos, usuarios e inscripciones hay en la plataforma?" },
        { label: "Módulos Evora", prompt: "¿Qué módulos tiene Evora y para qué sirve cada uno?" },
        { label: "Check-in de hoy", prompt: "Muéstrame el resumen de check-in de los eventos más recientes." },
        { label: "Límites del plan", prompt: "¿Cuál es mi plan y cuántos mensajes de IA me quedan?" },
      ];
    case "admin":
      return [
        { label: "Resumen de mi entidad", prompt: "¿Cuántos eventos e inscritos tengo en mi organización?" },
        { label: "Cómo hacer check-in", prompt: "¿Cómo funciona el check-in con QR?" },
        { label: "Asientos transporte", prompt: "¿Cuántos asientos de transporte hay disponibles?" },
        { label: "Borrador aviso", prompt: "Redáctame un borrador de comunicado de recordatorio para el próximo evento." },
      ];
    case "organizer":
      return [
        { label: "Mis estadísticas", prompt: "¿Cuántos eventos e inscritos tengo?" },
        { label: "Check-in", prompt: "¿Cuántos asistentes ya hicieron check-in en mis eventos?" },
        { label: "Estado de un pago", prompt: "¿Cómo consulto el estado de un pago de un inscrito?" },
        { label: "Cómo cobrar", prompt: "Explícame el flujo de checkout y Culqi." },
      ];
    default:
      return [
        { label: "Mis tickets", prompt: "¿Cuáles son mis entradas o tickets activos?" },
        { label: "Próximo evento", prompt: "¿Cuál es mi próximo evento?" },
        { label: "Estado de mi pago", prompt: "¿Cuál es el estado de mi último pago?" },
        { label: "Cómo inscribirme", prompt: "¿Cómo me inscribo a un evento y pago?" },
      ];
  }
}
