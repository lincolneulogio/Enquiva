/**
 * Abre el diálogo de impresión del sistema con un PDF (mismo archivo que se descarga).
 * Usa un iframe oculto para evitar pop-up blockers y no salir del panel.
 */
export async function printPdfBlob(blob: Blob): Promise<void> {
  const url = URL.createObjectURL(blob);

  await new Promise<void>((resolve, reject) => {
    const iframe = document.createElement("iframe");
    iframe.setAttribute("title", "print-pdf");
    iframe.style.cssText =
      "position:fixed;right:0;bottom:0;width:0;height:0;border:0;opacity:0;pointer-events:none;";
    iframe.src = url;

    let settled = false;
    const finish = (error?: unknown) => {
      if (settled) return;
      settled = true;
      window.setTimeout(() => {
        URL.revokeObjectURL(url);
        iframe.remove();
      }, 60_000);
      if (error) reject(error instanceof Error ? error : new Error(String(error)));
      else resolve();
    };

    iframe.onload = () => {
      window.setTimeout(() => {
        try {
          const win = iframe.contentWindow;
          if (!win) {
            finish(new Error("No se pudo abrir la vista de impresión"));
            return;
          }
          win.focus();
          win.print();
          finish();
        } catch (error) {
          finish(error);
        }
      }, 300);
    };

    iframe.onerror = () => finish(new Error("No se pudo cargar el PDF para imprimir"));
    document.body.appendChild(iframe);
  });
}

/** Imprime un documento jsPDF sin descargarlo. */
export async function printJsPdf(doc: {
  output: (type: "blob") => Blob;
}): Promise<void> {
  await printPdfBlob(doc.output("blob"));
}
