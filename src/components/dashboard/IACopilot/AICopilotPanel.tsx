"use client";

import { Sparkles } from "lucide-react";
import { useChatCopilot, type AiUsage, type CopilotUser } from "./use-chat-copilot";
import { ChatHeader } from "./ChatHeader";
import { ChatMessages } from "./ChatMessages";
import { ChatInput } from "./ChatInput";

export function AICopilotPanel({
  user,
  initialAiUsage,
  isOpen,
  onToggle,
}: {
  user: CopilotUser;
  initialAiUsage?: AiUsage | null;
  isOpen: boolean;
  onToggle: () => void;
}) {
  const {
    userRole,
    hasUnread,
    messagesEndRef,
    messages,
    input,
    handleInputChange,
    handleSubmit,
    isLoading,
    errorMessage,
    handleResetChat,
    RoleIcon,
    ROLE_BADGE_STYLES,
    aiUsage,
    suggestions,
    sendSuggestion,
    citationsByMessage,
    feedbackByMessage,
    submitFeedback,
    statusHint,
  } = useChatCopilot(initialAiUsage, user, isOpen, onToggle);

  const showChips = messages.length <= 1 && !isLoading;

  return (
    <>
      {isOpen && (
        <div
          onClick={onToggle}
          className="fixed inset-0 w-screen h-screen z-40 bg-black/40 backdrop-blur-[1.5px] transition-all duration-300 cursor-pointer animate-fade-in"
        />
      )}

      <div className="flex flex-col items-end">
        {isOpen && (
          <div className="mb-4 w-96 max-w-[calc(100vw-2rem)] h-[540px] max-h-[80vh] flex flex-col rounded-3xl border border-border bg-card/95 backdrop-blur-xl shadow-2xl overflow-hidden animate-fade-in transition-all duration-300">
            <ChatHeader
              userRole={userRole}
              RoleIcon={RoleIcon}
              roleBadgeStyle={ROLE_BADGE_STYLES[userRole]}
              aiUsage={aiUsage}
              onReset={handleResetChat}
              onClose={onToggle}
            />
            <ChatMessages
              messages={messages}
              isLoading={isLoading}
              errorMessage={errorMessage}
              messagesEndRef={messagesEndRef}
              userImage={user.image}
              userName={user.name}
              statusHint={statusHint}
              citationsByMessage={citationsByMessage}
              feedbackByMessage={feedbackByMessage}
              onFeedback={submitFeedback}
            />

            {showChips && (
              <div className="px-3 pb-2 flex flex-wrap gap-1.5 border-t border-border/40 pt-2 bg-muted/20">
                {suggestions.map((s) => (
                  <button
                    key={s.label}
                    type="button"
                    onClick={() => sendSuggestion(s.prompt)}
                    className="text-[10px] px-2 py-1 rounded-full border border-border/80 bg-card hover:bg-muted text-foreground/90 transition-colors"
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            )}

            <ChatInput
              input={input}
              isLoading={isLoading}
              userRole={userRole}
              onInputChange={handleInputChange}
              onSubmit={handleSubmit}
            />
          </div>
        )}

        {!isOpen && (
          <button
            type="button"
            onClick={onToggle}
            className="relative h-14 w-14 rounded-full bg-gradient-to-tr from-primary to-accent text-primary-foreground flex items-center justify-center shadow-xl focus:outline-none cursor-pointer border border-white/10 select-none"
            aria-label="Abrir asistente"
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
