import { Smartphone } from "lucide-react";

export function MobilePaymentInstructions() {
  return (
    <div className="mt-3 rounded-2xl bg-amber-500/5 dark:bg-amber-500/10 border border-amber-500/20 p-3.5 text-left text-xs text-amber-800 dark:text-amber-300">
      <div className="flex gap-2.5 items-start">
        <Smartphone className="h-4.5 w-4.5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-bold">¿Pagando desde tu celular?</p>
          <ul className="list-disc pl-4 space-y-1 text-muted-foreground">
            <li>
              <strong>Copia el número</strong> de teléfono de arriba e ingresa a Yape/Plin
              para realizar el pago de forma rápida.
            </li>
            <li>
              O <strong>descarga el código QR</strong>, abre Yape/Plin, ve a la opción
              &quot;Escanear&quot; y selecciona &quot;Imagen de galería&quot; para pagar
              al instante.
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
