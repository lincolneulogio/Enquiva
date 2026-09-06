import { createPortal } from "react-dom";
import { Loader2 } from "lucide-react";

interface DeleteConfirmModalProps {
  portalTarget: HTMLElement | null;
  deleteConfirmId: string | null;
  isPending: boolean;
  onClose: () => void;
  onConfirmDelete: (id: string) => void;
}

export function DeleteConfirmModal({
  portalTarget,
  deleteConfirmId,
  isPending,
  onClose,
  onConfirmDelete,
}: DeleteConfirmModalProps) {
  if (!portalTarget || !deleteConfirmId) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-6 shadow-xl">
        <h4 className="font-semibold text-foreground">¿Eliminar este testimonio?</h4>
        <p className="mt-2 text-xs text-muted-foreground">
          Esta acción retirará permanentemente la historia de éxito de la plataforma y de la página principal.
        </p>
        <div className="mt-5 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-border px-3.5 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={() => onConfirmDelete(deleteConfirmId)}
            disabled={isPending}
            className="inline-flex items-center gap-1.5 rounded-xl bg-red-600 px-4 py-1.5 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-50"
          >
            {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            Eliminar
          </button>
        </div>
      </div>
    </div>,
    portalTarget
  );
}
