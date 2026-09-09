import type { MetadataRoute } from "next";
import { PAGINAS, SITE_URL } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: SITE_URL,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
    ...PAGINAS.map((pagina) => ({
      url: `${SITE_URL}/${pagina.slug}`,
      // Refleja la fecha real de última revisión editorial de cada página,
      // en lugar de la fecha de build: es señal de frescura para Google.
      lastModified: new Date(pagina.actualizado),
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
  ];
}
