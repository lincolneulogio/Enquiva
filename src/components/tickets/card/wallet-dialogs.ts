import Swal from "@/lib/ui/swal-client";

export function showWalletDialog(
  eventTitle: string,
  walletType: "apple" | "google",
  locale: string,
) {
  const isApple = walletType === "apple";
  Swal.fire({
    title: isApple ? "Apple Wallet" : "Google Wallet",
    html: `
      <div class="text-left space-y-3 mt-2 text-sm leading-relaxed font-sans text-foreground">
        <p>
          ¡Tus tickets oficiales del <strong>${eventTitle}</strong> son 100% compatibles con lectores digitales! Para agregarlos de forma rápida a tu billetera:
        </p>
        <ol class="list-decimal pl-5 space-y-2 text-xs text-muted-foreground">
          <li>Haz una captura de pantalla del código QR individual de tu entrada o de tus invitados.</li>
          <li>Abre la aplicación <strong>${isApple ? "Apple Wallet" : "Google Wallet"}</strong> en tu celular.</li>
          <li>Selecciona la opción <strong>"Agregar un pase"</strong> o <strong>"Escanear foto de pase"</strong> y escoge la captura en tu galería de fotos.</li>
        </ol>
        <div class="rounded-xl bg-primary/10 border border-primary/20 p-3 mt-3 text-xs text-center font-semibold text-primary flex items-center justify-center gap-1.5">
          <svg class="h-3.5 w-3.5 shrink-0 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
          <span>El código QR de ingreso contiene cifrado dinámico y es único por asistente.</span>
        </div>
      </div>
    `,
    icon: "info",
    confirmButtonText: locale === "en" ? "Got it" : "Entendido",
    buttonsStyling: false,
    customClass: {
      popup: "fe-swal-popup rounded-3xl border border-border bg-card text-foreground",
      title: "fe-swal-title text-primary font-bold text-lg",
      htmlContainer: "fe-swal-text",
      actions: "fe-swal-actions mt-4",
      confirmButton:
        "fe-swal-confirm w-full py-2.5 px-4 rounded-xl bg-primary hover:bg-primary/95 text-white font-semibold text-sm transition-colors cursor-pointer text-center",
    },
  });
}
