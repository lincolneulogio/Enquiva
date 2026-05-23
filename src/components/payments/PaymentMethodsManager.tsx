"use client";

import { useState, useTransition, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createPaymentMethod, updatePaymentMethod, deletePaymentMethod } from "@/actions/payment-methods";
import { Loader2, Plus, Trash2, QrCode, Smartphone, Wallet, Upload, X } from "lucide-react";
import { useTranslations } from "@/components/providers/LocaleProvider";
import Image from "next/image";
import type { PaymentMethod } from "@/lib/db/schema";

const TYPE_ICONS = { yape: Smartphone, plin: QrCode, cash: Wallet };
const TYPE_LABELS = { yape: "Yape", plin: "Plin", cash: "Efectivo" };

function UploadQRDropzone({ value, onChange }: { value: string | null; onChange: (v: string | null) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const handleFile = (file: File) => {
    if (!file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = () => onChange(reader.result as string);
    reader.readAsDataURL(file);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  return (
    <div>
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        className={`relative flex cursor-pointer items-center justify-center rounded-xl border-2 border-dashed p-4 transition-colors ${
          dragging ? "border-primary bg-primary/5" : "border-border bg-background hover:border-primary/50"
        }`}
      >
        {value ? (
          <div className="relative">
            <Image src={value} alt="QR" width={120} height={120} className="rounded-lg border object-contain" />
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onChange(null); }}
              className="absolute -right-2 -top-2 rounded-full bg-destructive p-0.5 text-destructive-foreground shadow"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-1.5 text-sm text-muted-foreground">
            <Upload className="h-5 w-5" />
            <span>Arrastra o haz clic para subir el QR</span>
          </div>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
      />
    </div>
  );
}

interface Props {
  methods: PaymentMethod[];
}

export function PaymentMethodsManager({ methods }: Props) {
  const t = useTranslations();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form state
  const [type, setType] = useState<"yape" | "plin" | "cash">("yape");
  const [label, setLabel] = useState("");
  const [holderName, setHolderName] = useState("");
  const [phone, setPhone] = useState("");
  const [qrPreview, setQrPreview] = useState<string | null>(null);

  const resetForm = () => {
    setType("yape");
    setLabel("");
    setHolderName("");
    setPhone("");
    setQrPreview(null);
    setEditingId(null);
    setShowForm(false);
  };

  const edit = (m: PaymentMethod) => {
    setType(m.type);
    setLabel(m.label);
    setHolderName(m.holderName);
    setPhone(m.phone ?? "");
    setQrPreview(m.qrCodeUrl);
    setEditingId(m.id);
    setShowForm(true);
  };

  const submit = () => {
    if (!label.trim() || !holderName.trim()) {
      toast.error("Completa todos los campos obligatorios");
      return;
    }

    startTransition(async () => {
      try {
        const data = {
          type,
          label: label.trim(),
          holderName: holderName.trim(),
          phone: phone.trim() || null,
          qrCodeUrl: qrPreview,
        };

        if (editingId) {
          await updatePaymentMethod(editingId, data);
          toast.success("Medio de pago actualizado");
        } else {
          await createPaymentMethod(data);
          toast.success("Medio de pago creado");
        }

        resetForm();
        router.refresh();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Error");
      }
    });
  };

  const remove = (id: string) => {
    startTransition(async () => {
      try {
        await deletePaymentMethod(id);
        toast.success("Medio de pago eliminado");
        router.refresh();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Error");
      }
    });
  };

  return (
    <div className="space-y-6">
      {!showForm ? (
        <button
          onClick={() => setShowForm(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Nuevo medio de pago
        </button>
      ) : (
        <div className="max-w-2xl rounded-2xl border border-border bg-card p-6 space-y-5 shadow-sm">
          <h3 className="font-semibold text-foreground">
            {editingId ? "Editar medio de pago" : "Nuevo medio de pago"}
          </h3>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">Tipo</label>
            <div className="flex gap-2">
              {(["yape", "plin", "cash"] as const).map((t) => {
                const Icon = TYPE_ICONS[t];
                const isActive = type === t;
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => { setType(t); setQrPreview(null); }}
                    className={`flex items-center gap-1.5 rounded-xl border px-3 py-2 text-sm font-medium transition-colors ${
                      isActive ? "border-primary bg-primary/10 text-primary" : "border-border bg-background text-foreground hover:bg-muted"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {TYPE_LABELS[t]}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-foreground">
                Nombre del método *
              </label>
              <input type="text" value={label} onChange={(e) => setLabel(e.target.value)}
                placeholder={type === "yape" ? "Ej: Yape de Juan" : type === "plin" ? "Ej: Plin de María" : "Ej: Pago en efectivo"}
                className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-foreground">
                {type === "cash" ? "Responsable de cobrar" : "Titular"} *
              </label>
              <input type="text" value={holderName} onChange={(e) => setHolderName(e.target.value)}
                placeholder={type === "cash" ? "Nombre de quien recibe el pago" : "Nombre del dueño de la cuenta"}
                className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" />
            </div>
            {type !== "cash" && (
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-foreground">
                  Número {type === "yape" ? "Yape" : "Plin"}
                </label>
                <input type="text" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Celular asociado, ej: +51 999 999 999"
                  className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" />
              </div>
            )}
            {type !== "cash" && (
              <div className="sm:col-span-2">
                <label className="mb-1.5 block text-sm font-semibold text-foreground">
                  Imagen del código QR de {type === "yape" ? "Yape" : "Plin"}
                </label>
                <UploadQRDropzone value={qrPreview} onChange={setQrPreview} />
              </div>
            )}
          </div>

          <div className="flex gap-2">
            <button onClick={submit} disabled={isPending} className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50">
              {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              {editingId ? "Guardar cambios" : "Crear"}
            </button>
            <button onClick={resetForm} className="rounded-xl border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted transition-colors">
              Cancelar
            </button>
          </div>
        </div>
      )}

      <div className="max-w-2xl space-y-3">
        {methods.length === 0 && (
          <p className="text-sm text-muted-foreground">No hay medios de pago registrados.</p>
        )}
        {methods.map((m) => {
          const Icon = TYPE_ICONS[m.type];
          return (
            <div key={m.id} className="flex items-center gap-4 rounded-xl border border-border bg-card p-4">
              <div className="rounded-lg bg-primary/10 p-2.5">
                <Icon className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">{m.label}</p>
                <p className="text-xs text-muted-foreground">{TYPE_LABELS[m.type]} · {m.holderName}</p>
              </div>
              {m.qrCodeUrl && (
                <Image src={m.qrCodeUrl} alt="QR" width={48} height={48} className="rounded border shrink-0" />
              )}
              <div className="flex gap-1 shrink-0">
                <button onClick={() => edit(m)} className="rounded-lg border border-border px-3 py-1 text-xs font-medium text-foreground hover:bg-muted transition-colors">Editar</button>
                <button onClick={() => remove(m.id)} className="rounded-lg border border-destructive/30 px-3 py-1 text-xs font-medium text-destructive hover:bg-destructive/10 transition-colors">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
