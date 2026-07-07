"use client";
 
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import Swal from "sweetalert2";
import { registerOfflineAttendeeAction } from "@/actions/registrations";
import { Plus, X, User, Phone, FileText, Loader2 } from "lucide-react";
import { usePersistedFormFields } from "@/hooks/useFormPersistence";
import { formStorageKey } from "@/lib/form-persistence";
 
interface ManualRegistrationDialogProps {
  events: Array<{ value: string; label: string }>;
}
 
export function ManualRegistrationDialog({ events = [] }: ManualRegistrationDialogProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
 
  const { values, setValue, clear } = usePersistedFormFields(formStorageKey("registration.manual"), {
    eventId: events[0]?.value ?? "",
    name: "",
    phone: "",
    notes: "",
  });
  const { eventId, name, phone, notes } = values;
 
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
 
    if (!eventId) {
      toast.error("Por favor, selecciona un evento.");
      return;
    }
 
    if (name.trim().length < 2) {
      toast.error("El nombre del asistente debe tener al menos 2 caracteres.");
      return;
    }
 
    if (phone) {
      const cleanPhone = phone.replace(/\D/g, "");
      if (cleanPhone.length !== 9 || !cleanPhone.startsWith("9")) {
        toast.error("El teléfono debe tener exactamente 9 dígitos y empezar con 9.");
        return;
      }
    }
 
    startTransition(async () => {
      try {
        const result = await registerOfflineAttendeeAction({
          eventId,
          name: name.trim(),
          phone: phone ? `+51${phone.replace(/\D/g, "")}` : null,
          notes: notes.trim() || null,
        });
 
        if (result.success) {
          setIsOpen(false);
          clear();
          
          toast.success("¡Asistente registrado con éxito!");
          router.refresh();
 
          // Premium SweetAlert2 ticket display
          await Swal.fire({
            title: "Inscripción Exitosa",
            html: `
              <div class="text-left space-y-2 mt-2">
                <p class="text-sm font-semibold text-foreground">Asistente: <span class="font-normal">${name}</span></p>
                <p class="text-sm font-semibold text-foreground">Código de Ticket: <span class="font-bold text-primary select-all">${result.ticketCode}</span></p>
                <p class="text-xs text-muted-foreground mt-2 border-t border-border pt-2 leading-relaxed">
                  * El pago en efectivo ha sido aprobado y el ticket se encuentra activo en el sistema. Puedes buscar al participante en la lista de asistencia y escanear su ticket para el ingreso.
                </p>
              </div>
            `,
            icon: "success",
            confirmButtonText: "Entendido",
            buttonsStyling: false,
            customClass: {
              popup: "fe-swal-popup",
              title: "fe-swal-title text-green-600 dark:text-green-400 font-bold",
              htmlContainer: "fe-swal-text",
              actions: "fe-swal-actions mt-4",
              confirmButton: "fe-swal-confirm bg-green-600 hover:bg-green-700",
            }
          });
        }
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Error al registrar al asistente manualmente.");
      }
    });
  };
 
  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition-all hover:bg-primary/95 active:scale-98 select-none"
      >
        <Plus className="h-4 w-4" />
        Registrar Asistente Manual
      </button>
 
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-opacity duration-300 animate-fadeIn">
          <div className="relative w-full max-w-md bg-card border border-border rounded-3xl shadow-2xl overflow-hidden animate-scaleUp">
            
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-border bg-muted/40">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                  <User className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground text-base">Registro Manual</h3>
                  <p className="text-xs text-muted-foreground">Registrar asistente offline (Pago Efectivo)</p>
                </div>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="h-8 w-8 rounded-full border border-border hover:bg-muted text-muted-foreground hover:text-foreground flex items-center justify-center transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
 
            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4 text-left">
              
              {/* Event Selection */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground uppercase tracking-wider block">
                  Seleccionar Evento *
                </label>
                <select
                  required
                  value={eventId}
                  onChange={(e) => setValue("eventId", e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-card border border-border rounded-xl focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary text-foreground font-medium"
                >
                  <option value="" disabled>Selecciona un evento</option>
                  {events.map((evt) => (
                    <option key={evt.value} value={evt.value}>
                      {evt.label}
                    </option>
                  ))}
                </select>
              </div>
 
              {/* Attendee Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground uppercase tracking-wider block">
                  Nombre del Asistente *
                </label>
                <div className="relative flex items-center">
                  <User className="absolute left-3.5 h-4 w-4 text-muted-foreground" />
                  <input
                    type="text"
                    required
                    placeholder="Nombre completo"
                    value={name}
                    onChange={(e) => setValue("name", e.target.value)}
                    className="w-full pl-10 pr-3 py-2.5 text-sm bg-card border border-border rounded-xl focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary text-foreground placeholder:text-muted-foreground/60 transition-all font-medium"
                  />
                </div>
              </div>
 
              {/* Attendee Phone */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground uppercase tracking-wider block">
                  Teléfono de Contacto (Opcional)
                </label>
                <div className="relative flex items-center">
                  <span className="absolute left-3.5 text-sm text-muted-foreground font-medium select-none pointer-events-none border-r border-border/80 pr-2.5">
                    +51
                  </span>
                  <input
                    type="tel"
                    maxLength={9}
                    placeholder="912345678"
                    value={phone}
                    onChange={(e) => {
                      const onlyDigits = e.target.value.replace(/\D/g, "");
                      if (onlyDigits.length <= 9) {
                        setValue("phone", onlyDigits);
                      }
                    }}
                    style={{ paddingLeft: "54px" }}
                    className={`w-full pr-3 py-2.5 text-sm bg-card border rounded-xl focus:outline-none focus:ring-2 transition-all duration-300 font-medium tracking-wide ${
                      phone.length === 0
                        ? "border-border focus:ring-primary/20 focus:border-primary"
                        : phone.length < 9
                        ? "border-amber-500/40 focus:ring-amber-500/20 focus:border-amber-500"
                        : !phone.startsWith("9")
                        ? "border-rose-500/40 focus:ring-rose-500/20 focus:border-rose-500"
                        : "border-green-500/40 focus:ring-green-500/20 focus:border-green-500"
                    }`}
                  />
                </div>
                {phone.length > 0 && (
                  <p className={`text-[10px] font-semibold transition-all duration-300 ${
                    phone.length < 9
                      ? "text-amber-500"
                      : !phone.startsWith("9")
                      ? "text-rose-500"
                      : "text-green-500"
                  }`}>
                    {phone.length < 9
                      ? `⚠️ Faltan ${9 - phone.length} dígitos para completar.`
                      : !phone.startsWith("9")
                      ? "❌ Debe iniciar con 9."
                      : "✅ ¡Número válido!"}
                  </p>
                )}
              </div>
 
              {/* Notes */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground uppercase tracking-wider block">
                  Notas de Inscripción (Opcional)
                </label>
                <div className="relative flex items-start">
                  <FileText className="absolute left-3.5 top-3 h-4 w-4 text-muted-foreground" />
                  <textarea
                    rows={2}
                    placeholder="Detalles del pago en efectivo u observaciones..."
                    value={notes}
                    onChange={(e) => setValue("notes", e.target.value)}
                    className="w-full pl-10 pr-3 py-2.5 text-sm bg-card border border-border rounded-xl focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary text-foreground placeholder:text-muted-foreground/60 transition-all font-medium resize-none"
                  />
                </div>
              </div>
 
              {/* Footer */}
              <div className="pt-4 border-t border-border flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="flex-1 py-2.5 px-4 rounded-xl border border-border hover:bg-muted text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                  disabled={isPending}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 text-sm font-semibold transition-colors flex items-center justify-center gap-2"
                >
                  {isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Registrar Pago"
                  )}
                </button>
              </div>
 
            </form>
          </div>
        </div>
      )}
    </>
  );
}
