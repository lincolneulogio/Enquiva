import { toast } from "sonner";

export async function downloadQr(url: string, filename: string) {
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    const blobUrl = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = blobUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(blobUrl);
    toast.success("Código QR guardado en tu galería");
  } catch {
    window.open(url, "_blank");
    toast.info("Mantén presionada la imagen para guardarla en tu galería.");
  }
}
