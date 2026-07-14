"use client";

import { Bot, Loader2, AlertCircle, ThumbsUp, ThumbsDown } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Message } from "@ai-sdk/react";
import type { RefObject } from "react";

function getVisibleText(message: Message): string | null {
  if (typeof message.content === "string" && message.content.trim() !== "") {
    return message.content;
  }
  if (message.parts && message.parts.length > 0) {
    const text = message.parts
      .filter((p) => p.type === "text")
      .map((p) => ("text" in p ? p.text : ""))
      .join("");
    return text.trim() || null;
  }
  return null;
}

function formatCitationLabel(raw: string): string {
  // "module-5 (Módulo 5: Pagos)" → "Módulo 5: Pagos"
  const m = raw.match(/\((.+)\)\s*$/);
  return m?.[1] ?? raw;
}

interface ChatMessagesProps {
  messages: Message[];
  isLoading: boolean;
  errorMessage?: string | null;
  messagesEndRef: RefObject<HTMLDivElement | null>;
  userImage?: string | null;
  userName?: string | null;
  statusHint?: string;
  citationsByMessage?: Record<string, string[]>;
  feedbackByMessage?: Record<string, 1 | -1>;
  onFeedback?: (messageId: string, rating: 1 | -1) => void;
}

export function ChatMessages({
  messages,
  isLoading,
  errorMessage,
  messagesEndRef,
  userImage,
  userName,
  statusHint = "Consultando la plataforma…",
  citationsByMessage = {},
  feedbackByMessage = {},
  onFeedback,
}: ChatMessagesProps) {
  const lastMessage = messages[messages.length - 1];
  const lastHasText = lastMessage ? Boolean(getVisibleText(lastMessage)) : false;
  const showThinking =
    isLoading && !(lastMessage?.role === "assistant" && lastHasText);

  return (
    <div className="flex-1 p-4 overflow-y-auto space-y-4 text-xs scrollbar-thin">
      {messages.map((message) => {
        const isAssistant = message.role === "assistant";
        const visibleText = getVisibleText(message);
        if (!visibleText) return null;
        const citations = citationsByMessage[message.id] ?? [];
        const fb = feedbackByMessage[message.id];

        return (
          <div
            key={message.id}
            className={cn(
              "flex gap-2.5 items-start max-w-[90%]",
              isAssistant ? "mr-auto text-left" : "ml-auto flex-row-reverse text-right",
            )}
          >
            <div
              className={cn(
                "h-7 w-7 rounded-lg flex items-center justify-center shrink-0 border overflow-hidden",
                isAssistant
                  ? "bg-primary/5 text-primary border-primary/20"
                  : "bg-secondary text-foreground border-border",
              )}
            >
              {isAssistant ? (
                <Bot className="h-3.5 w-3.5" />
              ) : userImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={userImage}
                  alt={userName ?? "Usuario"}
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="text-[10px] font-bold uppercase text-foreground/80 select-none">
                  {userName?.[0]}
                </span>
              )}
            </div>
            <div className="flex flex-col gap-1.5 min-w-0">
              <div
                className={cn(
                  "rounded-2xl px-3.5 py-2.5 leading-relaxed break-words border text-[11px] whitespace-pre-wrap shadow-sm",
                  isAssistant
                    ? "bg-card text-foreground border-border/70 rounded-tl-none"
                    : "bg-primary text-primary-foreground border-primary/20 rounded-tr-none",
                )}
              >
                {visibleText}
              </div>

              {isAssistant && message.id !== "welcome" && citations.length > 0 && (
                <p className="text-[10px] text-muted-foreground px-1 leading-snug">
                  Según:{" "}
                  {citations
                    .slice(0, 3)
                    .map(formatCitationLabel)
                    .join(" · ")}
                </p>
              )}

              {isAssistant && message.id !== "welcome" && onFeedback && (
                <div className="flex items-center gap-1 px-0.5">
                  <button
                    type="button"
                    title="Útil"
                    disabled={fb != null}
                    onClick={() => onFeedback(message.id, 1)}
                    className={cn(
                      "h-6 w-6 rounded-md border border-border/60 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors",
                      fb === 1 && "text-emerald-600 border-emerald-500/40 bg-emerald-500/10",
                    )}
                  >
                    <ThumbsUp className="h-3 w-3" />
                  </button>
                  <button
                    type="button"
                    title="No útil"
                    disabled={fb != null}
                    onClick={() => onFeedback(message.id, -1)}
                    className={cn(
                      "h-6 w-6 rounded-md border border-border/60 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors",
                      fb === -1 && "text-rose-600 border-rose-500/40 bg-rose-500/10",
                    )}
                  >
                    <ThumbsDown className="h-3 w-3" />
                  </button>
                </div>
              )}
            </div>
          </div>
        );
      })}

      {showThinking && (
        <div className="flex gap-2.5 items-start mr-auto text-left max-w-[85%]">
          <div className="h-7 w-7 rounded-lg bg-primary/5 text-primary border border-primary/20 flex items-center justify-center shrink-0">
            <Bot className="h-3.5 w-3.5" />
          </div>
          <div className="rounded-2xl px-3.5 py-2.5 bg-card text-muted-foreground border border-border/70 rounded-tl-none flex flex-col gap-1 shadow-sm">
            <div className="flex items-center gap-1.5 font-semibold">
              <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
              <span>{statusHint}</span>
            </div>
            <p className="text-[10px] text-muted-foreground/80 font-normal">
              Hybrid RAG + datos en vivo
            </p>
          </div>
        </div>
      )}

      {errorMessage && !isLoading && (
        <div className="flex gap-2.5 items-start mr-auto text-left max-w-[90%]">
          <div className="h-7 w-7 rounded-lg bg-rose-500/10 text-rose-500 border border-rose-500/20 flex items-center justify-center shrink-0">
            <AlertCircle className="h-3.5 w-3.5" />
          </div>
          <div className="rounded-2xl px-3.5 py-2.5 bg-rose-500/5 text-rose-700 dark:text-rose-300 border border-rose-500/20 rounded-tl-none text-[11px] leading-relaxed">
            {errorMessage}
          </div>
        </div>
      )}

      <div ref={messagesEndRef} />
    </div>
  );
}
