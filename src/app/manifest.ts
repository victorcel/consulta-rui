import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Consulta RUI - Registro Único de Ingreso",
    short_name: "Consulta RUI",
    description:
      "Consulta gratis y en línea tu información en el Registro Único de Ingreso (RUI) de Colombia.",
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
