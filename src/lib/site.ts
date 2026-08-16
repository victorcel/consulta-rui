export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? 'https://consultarui.col0.com';

/**
 * Registro de las páginas de contenido del sitio. Es la fuente única para el
 * sitemap y para los bloques de enlaces relacionados, de modo que añadir una
 * página nueva aquí la incorpora automáticamente a ambos.
 */
export interface PaginaSitio {
  slug: string;
  titulo: string;
  descripcion: string;
}

export const PAGINAS: PaginaSitio[] = [
  {
    slug: 'que-es-el-rui',
    titulo: 'Qué es el RUI',
    descripcion:
      'Qué es el Registro Universal de Ingresos, cómo funciona y para qué se usa.',
  },
  {
    slug: 'clasificacion-rui',
    titulo: 'Grupos y clasificación',
    descripcion:
      'Qué significan los grupos A, B, C y D del RUI y cómo se calculan.',
  },
  {
    slug: 'certificado-rui',
    titulo: 'Certificado del RUI',
    descripcion:
      'Cómo descargar el certificado del RUI en PDF y para qué sirve.',
  },
  {
    slug: 'rui-vs-sisben',
    titulo: 'RUI y Sisbén',
    descripcion:
      'Qué cambió frente al Sisbén y qué pasa con los subsidios durante la transición.',
  },
  {
    slug: 'grupo-a-rui',
    titulo: 'Grupo A del RUI',
    descripcion: 'Pobreza extrema: qué significa y a qué programas da acceso.',
  },
  {
    slug: 'grupo-b-rui',
    titulo: 'Grupo B del RUI',
    descripcion: 'Pobreza moderada: qué significa y a qué programas da acceso.',
  },
  {
    slug: 'grupo-c-rui',
    titulo: 'Grupo C del RUI',
    descripcion: 'Vulnerabilidad: qué significa y a qué programas da acceso.',
  },
  {
    slug: 'grupo-d-rui',
    titulo: 'Grupo D del RUI',
    descripcion:
      'Ni pobre ni vulnerable: qué significa y a qué programas da acceso.',
  },
];

/** Devuelve hasta `limite` páginas distintas de la actual, para enlaces internos. */
export function paginasRelacionadas(slugActual: string, limite = 4) {
  return PAGINAS.filter((p) => p.slug !== slugActual)
    .slice(0, limite)
    .map((p) => ({
      href: `/${p.slug}`,
      titulo: p.titulo,
      descripcion: p.descripcion,
    }));
}
