import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Enquiva — Plataforma de gestión de eventos",
    short_name: "Enquiva",
    description:
      "Crea, gestiona y descubre eventos de todo tipo. Inscripciones, tickets QR, pagos y transporte en un solo lugar.",
    start_url: "/",
    display: "standalone",
    background_color: "#f2ece0",
    theme_color: "#cc4400",
    icons: [
      {
        src: "/images/app-icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/images/app-icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
      {
        src: "/images/apple-touch-icon.png",
        sizes: "180x180",
        type: "image/png",
      },
    ],
  };
}