"use client";

import { useEffect, useRef, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { ROLE_BADGE_STYLES, normalizeRole } from "@/lib/auth/rbac";
import { getRoleLabel, type Locale } from "@/lib/i18n/core";
import { useLocale } from "@/components/providers/LocaleProvider";
import { useSession } from "@/lib/auth/client";
import { Crown, ShieldCheck, Briefcase, UserRound } from "lucide-react";
import type { LucideIcon } from "lucide-react";

function buildWelcomeMessage(
  userName: string,
  userRole: string,
  locale: Locale,
) {
  const capabilityText =
    userRole === "super_admin" || userRole === "admin"
      ? "• Consultar métricas de la plataforma en tiempo real.\n• Analizar los últimos registros de auditoría de seguridad.\n• Buscar eventos de forma semántica y rápida."
      : userRole === "organizer"
        ? "• Consultar estadísticas de asistencia de tus eventos.\n• Redactar borradores para comunicados masivos.\n• Gestionar y coordinar la logística de tus eventos."
        : "• Buscar retiros, misas o eventos de oración.\n• Verificar tus entradas y tickets activos.\n• Coordinar traslados y transporte.";

  return `¡Hola ${userName}! ✦ Soy FeBot, tu Copiloto de Inteligencia Artificial para EncuentroDeFe.\n\nComo ${getRoleLabel(userRole as any, locale)}, puedo ayudarte de manera personalizada:\n${capabilityText}\n\n¿En qué puedo asistirte hoy?`;
}

const ROLE_ICON: Record<string, LucideIcon> = {
  super_admin: Crown,
  admin: ShieldCheck,
  organizer: Briefcase,
  member: UserRound,
};

export function useChatCopilot() {
  const { data: session } = useSession();
  const { locale } = useLocale();
  const [isOpen, setIsOpen] = useState(false);
  const [hasUnread, setHasUnread] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const userRole = normalizeRole(session?.user.role ?? "member");
  const userName = session?.user.name ?? "Miembro";

  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    isLoading,
    setMessages,
    append,
  } = useChat({
    api: "/api/chat",
    streamProtocol: "text",
    initialMessages: [
      {
        id: "welcome",
        role: "assistant",
        content: buildWelcomeMessage(userName, userRole, locale),
      },
    ],
  });


  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    if (!isOpen && messages.length > 1) setHasUnread(true);
  }, [messages, isOpen]);

  const handleToggle = () => {
    setIsOpen((p) => !p);
    setHasUnread(false);
  };
  const handleResetChat = () =>
    setMessages([
      {
        id: "welcome",
        role: "assistant",
        content: `Chat reiniciado. ¿En qué más te puedo ayudar hoy, ${userName}?`,
      },
    ]);

  return {
    session,
    userRole,
    userName,
    locale,
    isOpen,
    hasUnread,
    messagesEndRef,
    messages,
    input,
    handleInputChange,
    handleSubmit,
    isLoading,
    handleToggle,
    handleResetChat,
    RoleIcon: ROLE_ICON[userRole] ?? UserRound,
    ROLE_BADGE_STYLES,
  };
}
