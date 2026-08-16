import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Consultar RUI - Registro Universal de Ingresos",
    short_name: "Consulta RUI",
    description:
      "Consulta el RUI por cédula gratis y en línea: conoce tu grupo y clasificación en el Registro Universal de Ingresos (el nuevo Sisbén) del DNP en Colombia.",
    start_url: "/",
    display: "standalone",
    background_color: "#060912",
    theme_color: "#060912",
    lang: "es-CO",
    icons: [
      { src: "/favicon.svg", type: "image/svg+xml", sizes: "any" },
      { src: "/icon-192.png", type: "image/png", sizes: "192x192" },
      { src: "/icon-512.png", type: "image/png", sizes: "512x512" },
    ],
  };
}
