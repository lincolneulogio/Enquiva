"use client";

import { Send } from "lucide-react";
import type { ChangeEvent, FormEvent } from "react";
import { getInputPlaceholder } from "@/lib/chat/role-scope";

interface ChatInputProps {
  input: string;
  isLoading: boolean;
  userRole?: string;
  onInputChange: (e: ChangeEvent<HTMLInputElement>) => void;
  onSubmit: (e: FormEvent<HTMLFormElement>) => void;
}

export function ChatInput({
  input,
  isLoading,
  userRole = "member",
  onInputChange,
  onSubmit,
}: ChatInputProps) {
  return (
    <form onSubmit={onSubmit} className="p-4 border-t border-border bg-card flex gap-2 items-center">
      <input
        type="text"
        value={input}
        onChange={onInputChange}
        disabled={isLoading}
        placeholder={getInputPlaceholder(userRole, isLoading)}
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
  );
}
