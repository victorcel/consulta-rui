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
  /** Última revisión editorial del contenido, en formato ISO (YYYY-MM-DD). */
  actualizado: string;
}

export const PAGINAS: PaginaSitio[] = [
  {
    slug: 'que-es-el-rui',
    titulo: 'Qué es el RUI',
    descripcion:
      'Qué es el Registro Universal de Ingresos, cómo funciona y para qué se usa.',
    actualizado: '2026-09-09',
  },
  {
    slug: 'clasificacion-rui',
    titulo: 'Grupos y clasificación',
    descripcion:
      'Qué significan los grupos A, B, C y D del RUI y cómo se calculan.',
    actualizado: '2026-09-09',
  },
  {
    slug: 'certificado-rui',
    titulo: 'Certificado del RUI',
    descripcion:
      'Cómo descargar el certificado del RUI en PDF y para qué sirve.',
    actualizado: '2026-09-09',
  },
  {
    slug: 'rui-vs-sisben',
    titulo: 'RUI y Sisbén',
    descripcion:
      'Qué cambió frente al Sisbén y qué pasa con los subsidios durante la transición.',
    actualizado: '2026-09-09',
  },
  {
    slug: 'subsidios-rui',
    titulo: 'Subsidios según tu grupo',
    descripcion:
      'Qué subsidios y programas sociales corresponden a cada grupo y subgrupo del RUI.',
    actualizado: '2026-09-09',
  },
  {
    slug: 'que-paso-con-mi-puntaje-sisben',
    titulo: 'Qué pasó con mi puntaje del Sisbén',
    descripcion:
      'Por qué el puntaje del Sisbén desapareció, qué lo reemplaza y cómo saber tu situación actual.',
    actualizado: '2026-09-09',
  },
  {
    slug: 'corregir-datos-rui',
    titulo: 'Corregir datos del RUI',
    descripcion:
      'Qué hacer si tu grupo en el RUI no corresponde a tu situación real y cómo solicitar la revisión.',
    actualizado: '2026-09-09',
  },
  {
    slug: 'grupo-a-rui',
    titulo: 'Grupo A del RUI',
    descripcion: 'Pobreza extrema: qué significa y a qué programas da acceso.',
    actualizado: '2026-09-09',
  },
  {
    slug: 'grupo-b-rui',
    titulo: 'Grupo B del RUI',
    descripcion: 'Pobreza moderada: qué significa y a qué programas da acceso.',
    actualizado: '2026-09-09',
  },
  {
    slug: 'grupo-c-rui',
    titulo: 'Grupo C del RUI',
    descripcion: 'Vulnerabilidad: qué significa y a qué programas da acceso.',
    actualizado: '2026-09-09',
  },
  {
    slug: 'grupo-d-rui',
    titulo: 'Grupo D del RUI',
    descripcion:
      'Ni pobre ni vulnerable: qué significa y a qué programas da acceso.',
    actualizado: '2026-09-09',
  },
];

/** Busca la fecha de última actualización registrada para un slug. */
export function fechaActualizacion(slug: string): string {
  return PAGINAS.find((p) => p.slug === slug)?.actualizado ?? '2026-09-09';
}

/** Siguiente mejor paso por página; lo que no esté aquí usa el orden de PAGINAS. */
const SIGUIENTES: Record<string, string[]> = {
  'que-es-el-rui': ['clasificacion-rui', 'rui-vs-sisben', 'subsidios-rui', 'certificado-rui'],
  'clasificacion-rui': ['subsidios-rui', 'corregir-datos-rui', 'certificado-rui', 'rui-vs-sisben'],
  'certificado-rui': ['clasificacion-rui', 'subsidios-rui', 'corregir-datos-rui', 'que-es-el-rui'],
  'rui-vs-sisben': ['que-paso-con-mi-puntaje-sisben', 'clasificacion-rui', 'subsidios-rui', 'corregir-datos-rui'],
  'subsidios-rui': ['clasificacion-rui', 'certificado-rui', 'corregir-datos-rui', 'rui-vs-sisben'],
  'que-paso-con-mi-puntaje-sisben': ['clasificacion-rui', 'subsidios-rui', 'corregir-datos-rui', 'certificado-rui'],
  'corregir-datos-rui': ['clasificacion-rui', 'certificado-rui', 'subsidios-rui', 'que-paso-con-mi-puntaje-sisben'],
  'grupo-a-rui': ['subsidios-rui', 'clasificacion-rui', 'certificado-rui', 'corregir-datos-rui'],
  'grupo-b-rui': ['subsidios-rui', 'clasificacion-rui', 'certificado-rui', 'corregir-datos-rui'],
  'grupo-c-rui': ['subsidios-rui', 'clasificacion-rui', 'corregir-datos-rui', 'certificado-rui'],
  'grupo-d-rui': ['subsidios-rui', 'clasificacion-rui', 'corregir-datos-rui', 'certificado-rui'],
};

/** Devuelve hasta `limite` páginas distintas de la actual, para enlaces internos. */
export function paginasRelacionadas(slugActual: string, limite = 4) {
  const orden = SIGUIENTES[slugActual];
  const candidatas = orden
    ? orden.map((s) => PAGINAS.find((p) => p.slug === s)!)
    : PAGINAS.filter((p) => p.slug !== slugActual);
  return candidatas
    .slice(0, limite)
    .map((p) => ({
      href: `/${p.slug}`,
      titulo: p.titulo,
      descripcion: p.descripcion,
    }));
}
