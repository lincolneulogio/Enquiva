"use client";

import { Bot, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Message } from "@ai-sdk/react";
import type { RefObject } from "react";

/** Extrae el texto visible de un mensaje del AI SDK v4 (soporta parts y content string) */
function getVisibleText(message: Message): string | null {
  if (typeof message.content === "string" && message.content.trim() !== "") {
    return message.content;
  }
  if (message.parts && message.parts.length > 0) {
    const text = message.parts
      .filter((p) => p.type === "text")
      .map((p) => (p as any).text)
      .join("");
    return text.trim() || null;
  }
  return null;
}

interface ChatMessagesProps {
  messages: Message[];
  isLoading: boolean;
  messagesEndRef: RefObject<HTMLDivElement | null>;
  userImage?: string | null;
  userName?: string | null;
}

export function ChatMessages({ messages, isLoading, messagesEndRef, userImage, userName }: ChatMessagesProps) {
  return (
    <div className="flex-1 p-4 overflow-y-auto space-y-4 text-xs scrollbar-thin">
      {messages.map((message) => {
        const isAssistant = message.role === "assistant";
        const visibleText = getVisibleText(message);
        if (!visibleText) return null;

        return (
          <div key={message.id} className={cn("flex gap-2.5 items-start max-w-[85%]", isAssistant ? "mr-auto text-left" : "ml-auto flex-row-reverse text-right")}>
            <div className={cn("h-7 w-7 rounded-lg flex items-center justify-center shrink-0 border overflow-hidden", isAssistant ? "bg-primary/5 text-primary border-primary/20" : "bg-secondary text-foreground border-border")}>
              {isAssistant ? (
                <Bot className="h-3.5 w-3.5" />
              ) : userImage ? (
                <img src={userImage} alt={userName ?? "Usuario"} className="h-full w-full object-cover" />
              ) : (
                <span className="text-[10px] font-bold uppercase text-foreground/80 select-none">{userName?.[0]}</span>
              )}
            </div>
            <div className={cn("rounded-2xl px-3.5 py-2.5 leading-relaxed break-words border text-[11px] whitespace-pre-wrap shadow-sm", isAssistant ? "bg-card text-foreground border-border/70 rounded-tl-none" : "bg-primary text-primary-foreground border-primary/20 rounded-tr-none")}>
              {visibleText}
            </div>
          </div>
        );
      })}

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
  );
}
