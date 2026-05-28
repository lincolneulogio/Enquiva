"use client";

import { useEffect, useRef, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { useSession } from "@/lib/auth/client";
import { ROLE_BADGE_STYLES, normalizeRole } from "@/lib/auth/rbac";
import { getRoleLabel } from "@/lib/i18n/core";
import { useLocale } from "@/components/providers/LocaleProvider";
import {
  Sparkles,
  Send,
  X,
  Bot,
  User,
  Loader2,
  Calendar,
  Shield,
  Ticket,
  BarChart3,
  RefreshCw,
  Crown,
  ShieldCheck,
  Briefcase,
  UserRound,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface AICopilotInnerProps {
  session: NonNullable<ReturnType<typeof useSession>["data"]>;
}

export function AICopilot() {
  const { data: session } = useSession();
  if (!session) return null;
  return <AICopilotInner session={session} />;
}

function AICopilotInner({ session }: AICopilotInnerProps) {
  const { locale } = useLocale();
  const [isOpen, setIsOpen] = useState(false);
  const [hasUnread, setHasUnread] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const userRole = normalizeRole(session.user.role ?? "member");
  const userName = session.user.name ?? "Miembro";

  const RoleIcon =
    userRole === "super_admin"
      ? Crown
      : userRole === "admin"
        ? ShieldCheck
        : userRole === "organizer"
          ? Briefcase
          : UserRound;

  // Inicializar Vercel AI SDK useChat hook
  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    isLoading,
    append,
    setMessages,
  } = useChat({
    api: "/api/chat",
    initialMessages: [
      {
        id: "welcome",
        role: "assistant",
        content: `¡Hola ${userName}! ✦ Soy FeBot, tu Copiloto de Inteligencia Artificial para EncuentroDeFe.

Como ${getRoleLabel(userRole, locale)}, puedo ayudarte de manera personalizada:
${
  userRole === "super_admin" || userRole === "admin"
    ? "• Consultar métricas de la plataforma en tiempo real.\n• Analizar los últimos registros de auditoría de seguridad.\n• Buscar eventos de forma semántica y rápida."
    : userRole === "organizer"
    ? "• Consultar estadísticas de asistencia de tus eventos.\n• Redactar borradores para comunicados masivos.\n• Gestionar y coordinar la logística de tus eventos."
    : "• Buscar retiros, misas o eventos de oración.\n• Verificar tus entradas y tickets activos.\n• Coordinar traslados y transporte."
}

¿En qué puedo asistirte hoy?`,
      },
    ],
  });

  // Auto-scroll al final del chat cuando llegan mensajes
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
    if (!isOpen && messages.length > 1) {
      setHasUnread(true);
    }
  }, [messages, isOpen]);

  const handleToggle = () => {
    setIsOpen((prev) => !prev);
    setHasUnread(false);
  };

  const handleQuickPrompt = (promptText: string) => {
    append({
      role: "user",
      content: promptText,
    });
  };

  const handleResetChat = () => {
    setMessages([
      {
        id: "welcome",
        role: "assistant",
        content: `Chat reiniciado. ¿En qué más te puedo ayudar hoy, ${userName}?`,
      },
    ]);
  };

  // Prompts rápidos dinámicos según el Rol del usuario
  const quickPrompts =
    userRole === "super_admin" || userRole === "admin"
      ? [
          { text: "Ver estadísticas globales", icon: BarChart3, prompt: "Muestra las estadísticas generales de la plataforma EncuentroDeFe." },
          { text: "Ver auditoría de seguridad", icon: Shield, prompt: "Muéstrame los últimos logs de auditoría de seguridad del sistema." },
          { text: "Buscar retiros", icon: Calendar, prompt: "Busca eventos que pertenezcan a la categoría de retiros o retiros activos." },
        ]
      : userRole === "organizer"
      ? [
          { text: "Estadísticas de asistencia", icon: BarChart3, prompt: "Muestra las métricas generales de eventos." },
          { text: "Plantilla de comunicado", icon: Sparkles, prompt: "Ayúdame a redactar un comunicado corto para avisar de un retraso de 15 minutos en el bus de mañana." },
          { text: "Buscar mis eventos", icon: Calendar, prompt: "Muestra la lista de eventos creados." },
        ]
      : [
          { text: "Buscar retiros activos", icon: Calendar, prompt: "Busca retiros espirituales disponibles en la plataforma." },
          { text: "Ver mis tickets", icon: Ticket, prompt: "Muestra mis tickets y entradas registradas." },
          { text: "Servicios de transporte", icon: Sparkles, prompt: "¿Cómo funciona el servicio de transporte en la plataforma?" },
        ];

  return (
    <>
      {/* Fondo oscurecido (Backdrop Overlay) con desenfoque de cristal premium */}
      {isOpen && (
        <div
          onClick={handleToggle}
          className="fixed inset-0 w-screen h-screen z-40 bg-black/40 backdrop-blur-[1.5px] transition-all duration-300 cursor-pointer animate-fade-in"
        />
      )}

      {/* Contenedor del Chat */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      
      {/* Ventana de Chat */}
      {isOpen && (
        <div className="mb-4 w-96 max-w-[calc(100vw-2rem)] h-[540px] max-h-[80vh] flex flex-col rounded-3xl border border-border bg-card/95 backdrop-blur-xl shadow-2xl overflow-hidden animate-fade-in transition-all duration-300">
          
          {/* Header */}
          <div className="flex items-center justify-between p-4.5 border-b border-border bg-muted/40">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center border border-primary/20 animate-pulse">
                <Sparkles className="h-4 w-4" />
              </div>
              <div className="text-left">
                <h3 className="font-semibold text-foreground text-sm flex items-center gap-1.5 leading-none">
                  FeBot
                  <span className="text-[9px] px-1.5 py-0.5 rounded-full font-bold bg-primary/10 text-primary border border-primary/20 uppercase tracking-wide">
                    IA
                  </span>
                </h3>
                <span
                  className={cn(
                    "inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2 py-0.5 text-[10px] font-semibold tracking-normal shadow-sm mt-1",
                    ROLE_BADGE_STYLES[userRole]
                  )}
                >
                  <RoleIcon className="h-2.5 w-2.5" />
                  {getRoleLabel(userRole, locale)}
                </span>
              </div>
            </div>
            
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handleResetChat}
                title="Reiniciar chat"
                className="h-8 w-8 rounded-full border border-border/80 hover:bg-muted text-muted-foreground hover:text-foreground flex items-center justify-center transition-colors"
              >
                <RefreshCw className="h-3.5 w-3.5" />
              </button>
              <button 
                type="button"
                onClick={handleToggle}
                className="h-8 w-8 rounded-full border border-border/80 hover:bg-muted text-muted-foreground hover:text-foreground flex items-center justify-center transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Área de Mensajes */}
          <div className="flex-1 p-4 overflow-y-auto space-y-4 text-xs scrollbar-thin">
            {messages.map((message) => {
              const isAssistant = message.role === "assistant";
              return (
                <div
                  key={message.id}
                  className={cn(
                    "flex gap-2.5 items-start max-w-[85%]",
                    isAssistant ? "mr-auto text-left" : "ml-auto flex-row-reverse text-right"
                  )}
                >
                  <div
                    className={cn(
                      "h-7 w-7 rounded-lg flex items-center justify-center shrink-0 border overflow-hidden",
                      isAssistant
                        ? "bg-primary/5 text-primary border-primary/20"
                        : "bg-secondary text-foreground border-border"
                    )}
                  >
                    {isAssistant ? (
                      <Bot className="h-3.5 w-3.5" />
                    ) : session.user.image ? (
                      <img
                        src={session.user.image}
                        alt={session.user.name ?? "Usuario"}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span className="text-[10px] font-bold uppercase text-foreground/80 select-none">
                        {session.user.name?.[0]}
                      </span>
                    )}
                  </div>
                  
                  <div
                    className={cn(
                      "rounded-2xl px-3.5 py-2.5 leading-relaxed break-words border text-[11px] whitespace-pre-wrap shadow-sm",
                      isAssistant
                        ? "bg-card text-foreground border-border/70 rounded-tl-none"
                        : "bg-primary text-primary-foreground border-primary/20 rounded-tr-none"
                    )}
                  >
                    {message.content}
                  </div>
                </div>
              );
            })}
            
            {/* Animación de Carga */}
            {isLoading && (
              <div className="flex gap-2.5 items-start mr-auto text-left max-w-[85%]">
                <div className="h-7 w-7 rounded-lg bg-primary/5 text-primary border border-primary/20 flex items-center justify-center shrink-0">
                  <Bot className="h-3.5 w-3.5" />
                </div>
                <div className="rounded-2xl px-3.5 py-2.5 bg-card text-muted-foreground border border-border/70 rounded-tl-none flex items-center gap-1.5 shadow-sm font-semibold">
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
                  <span>Pensando...</span>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Sugerencias Rápidas / Quick Prompts */}
          <div className="px-4 py-2 border-t border-border/60 bg-muted/20 flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
            {quickPrompts.map((pill, idx) => {
              const Icon = pill.icon;
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleQuickPrompt(pill.prompt)}
                  disabled={isLoading}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-border bg-card hover:bg-muted text-[10px] font-semibold text-foreground transition-all duration-200 select-none disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Icon className="h-3 w-3 text-primary shrink-0" />
                  {pill.text}
                </button>
              );
            })}
          </div>

          {/* Formulario de Envío */}
          <form
            onSubmit={handleSubmit}
            className="p-4 border-t border-border bg-card flex gap-2 items-center"
          >
            <input
              type="text"
              value={input}
              onChange={handleInputChange}
              placeholder="Pregúntame algo..."
              disabled={isLoading}
              className="flex-1 px-4 py-2.5 text-xs bg-background border border-border rounded-xl focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary text-foreground disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="h-9 w-9 rounded-xl bg-primary text-primary-foreground hover:bg-primary/95 flex items-center justify-center shadow-md active:scale-95 transition-all shrink-0 disabled:opacity-55 disabled:cursor-not-allowed"
            >
              <Send className="h-3.5 w-3.5" />
            </button>
          </form>

        </div>
      )}

      {/* Botón Flotante */}
      {!isOpen && (
        <button
          type="button"
          onClick={handleToggle}
          className="relative h-14 w-14 rounded-full bg-gradient-to-tr from-primary to-accent text-primary-foreground flex items-center justify-center shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 active:scale-95 focus:outline-none cursor-pointer border border-white/10 select-none animate-bounce"
          style={{ animationDuration: "3s" }}
        >
          <Sparkles className="h-6 w-6" />
          {hasUnread && (
            <span className="absolute top-0 right-0 h-3.5 w-3.5 rounded-full bg-rose-500 border-2 border-card animate-pulse" />
          )}
        </button>
      )}

      </div>
    </>
  );
}
