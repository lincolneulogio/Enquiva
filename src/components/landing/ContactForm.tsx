"use client";

import { useActionState } from "react";
import { Send, CheckCircle2, AlertCircle } from "lucide-react";
import { submitContactAction } from "@/actions/contact";

type ContactFormProps = {
  isEn: boolean;
};

export function ContactForm({ isEn }: ContactFormProps) {
  const [state, formAction, isPending] = useActionState(submitContactAction, null);

  const inputClass =
    "w-full rounded-xl border border-border/90 bg-background px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-colors";

  return (
    <form action={formAction} className="mt-6 space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-foreground">
            {isEn ? "Full name" : "Nombre completo"} *
          </label>
          <input
            type="text"
            name="name"
            required
            maxLength={120}
            placeholder={isEn ? "Your name" : "Tu nombre"}
            className={inputClass}
          />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-foreground">
            {isEn ? "Email" : "Correo electrónico"} *
          </label>
          <input
            type="email"
            name="email"
            required
            maxLength={200}
            placeholder="tu@correo.com"
            className={inputClass}
          />
        </div>
      </div>

      <div>
        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-foreground">
          {isEn ? "Subject" : "Asunto"} *
        </label>
        <input
          type="text"
          name="subject"
          required
          maxLength={160}
          placeholder={
            isEn
              ? "e.g. Help with my ticket"
              : "Ej. Ayuda con mi entrada"
          }
          className={inputClass}
        />
      </div>

      <div>
        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-foreground">
          {isEn ? "Message" : "Mensaje"} *
        </label>
        <textarea
          name="message"
          required
          rows={5}
          maxLength={4000}
          placeholder={
            isEn
              ? "Tell us how we can help you..."
              : "Cuéntanos en qué podemos ayudarte..."
          }
          className={`${inputClass} resize-none leading-relaxed`}
        />
      </div>

      {state && state.success && (
        <div className="flex items-center gap-2 rounded-xl border border-green-300/60 bg-green-50/50 p-3 text-xs font-semibold text-green-700 dark:border-green-900/40 dark:bg-green-950/20 dark:text-green-300 animate-in fade-in">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{state.message}</span>
        </div>
      )}

      {state && !state.success && (
        <div className="flex items-center gap-2 rounded-xl border border-rose-300/60 bg-rose-50/50 p-3 text-xs font-semibold text-rose-700 dark:border-rose-900/40 dark:bg-rose-950/20 dark:text-rose-300">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{state.message}</span>
        </div>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-bold text-primary-foreground shadow-md shadow-primary/25 transition-all duration-200 hover:bg-primary/95 hover:shadow-lg active:scale-[0.99] disabled:opacity-50 sm:w-auto sm:px-8"
      >
        {isPending ? (
          <>
            <Send className="h-4 w-4 animate-pulse" />
            {isEn ? "Sending..." : "Enviando..."}
          </>
        ) : (
          <>
            <Send className="h-4 w-4" />
            {isEn ? "Send message" : "Enviar mensaje"}
          </>
        )}
      </button>
    </form>
  );
}
