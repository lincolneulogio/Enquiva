"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import Swal from "@/lib/ui/swal-client";
import { registerOfflineAttendeeAction } from "@/actions/registrations";
import { Plus, X, User } from "lucide-react";
import { usePersistedFormFields } from "@/hooks/useFormPersistence";
import { formStorageKey } from "@/lib/form-persistence";
import { ManualRegistrationForm } from "./manual-registration";

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
            },
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
        className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition-all hover:bg-primary/95 active:scale-98 select-none cursor-pointer"
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
                className="h-8 w-8 rounded-full border border-border hover:bg-muted text-muted-foreground hover:text-foreground flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Form */}
            <ManualRegistrationForm
              events={events}
              eventId={eventId}
              name={name}
              phone={phone}
              notes={notes}
              isPending={isPending}
              onFieldChange={(field, val) => setValue(field, val)}
              onSubmit={handleSubmit}
              onCancel={() => setIsOpen(false)}
            />
          </div>
        </div>
      )}
    </>
  );
}
