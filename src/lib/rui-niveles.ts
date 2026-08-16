// Información general sobre los grupos de clasificación del RUI (Registro Universal
// de Ingresos), el instrumento del DNP que desde agosto de 2026 reemplaza al Sisbén
// para focalizar el gasto social en Colombia.
//
// El RUI no entrega subsidios directamente: clasifica hogares, y cada programa social
// define sus propios requisitos de acceso sobre esa clasificación. Por eso los
// beneficios listados aquí son orientativos a nivel de grupo (A/B/C/D), no garantías,
// y no incluyen montos ni cortes exactos por subgrupo (esos varían por programa y
// cambian con frecuencia durante la transición hacia el RUI, vigente hasta el 31 de
// octubre de 2026).

export type GrupoRui = 'A' | 'B' | 'C' | 'D';

export interface NivelRuiInfo {
  grupo: GrupoRui;
  codigo: string;
  titulo: string;
  descripcion: string;
  beneficios: string[];
  colorClass: string;
}

export const INFO_POR_GRUPO: Record<GrupoRui, Omit<NivelRuiInfo, 'grupo' | 'codigo'>> = {
  A: {
    titulo: 'Pobreza extrema',
    descripcion:
      'Hogares con los menores ingresos del país. Es el grupo con mayor prioridad para la asignación de programas sociales del Estado.',
    beneficios: [
      'Régimen subsidiado de salud (afiliación sin costo)',
      'Colombia Mayor para adultos mayores que cumplan los demás requisitos',
      'Prioridad en Familias en Acción y Jóvenes en Acción',
      'Renta Joven y apoyos educativos como matrícula cero',
      'Mayor porcentaje de subsidio en programas de vivienda (Mi Casa Ya y similares)',
      'Devolución del IVA y otros programas de transferencias monetarias',
    ],
    colorClass: 'from-red-500/20 to-red-500/5 border-red-500/30 text-red-300',
  },
  B: {
    titulo: 'Pobreza moderada',
    descripcion:
      'Hogares en condición de pobreza, con ingresos algo superiores al grupo A. Mantienen acceso prioritario a la mayoría de programas sociales.',
    beneficios: [
      'Régimen subsidiado de salud (afiliación sin costo)',
      'Colombia Mayor para adultos mayores que cumplan los demás requisitos',
      'Familias en Acción y Jóvenes en Acción',
      'Renta Joven y apoyos educativos como matrícula cero',
      'Subsidio de vivienda, en un porcentaje algo menor que el grupo A',
    ],
    colorClass: 'from-orange-500/20 to-orange-500/5 border-orange-500/30 text-orange-300',
  },
  C: {
    titulo: 'Vulnerabilidad',
    descripcion:
      'Hogares que no están en pobreza pero podrían caer en ella ante un choque económico. El acceso a algunos programas depende del subgrupo específico (los primeros subgrupos, más cercanos a C1, suelen tener más beneficios que los últimos, cercanos a C18).',
    beneficios: [
      'Régimen subsidiado de salud, generalmente con copagos según el subgrupo',
      'Colombia Mayor, normalmente limitado a los primeros subgrupos de este grupo',
      'Renta Joven y algunos apoyos educativos, según la institución',
      'Subsidio de vivienda en un porcentaje reducido frente a los grupos A y B',
    ],
    colorClass: 'from-amber-500/20 to-amber-500/5 border-amber-500/30 text-amber-300',
  },
  D: {
    titulo: 'Ni pobre ni vulnerable',
    descripcion:
      'Hogares cuyos ingresos les permiten cubrir sus necesidades básicas. Es el grupo con menor prioridad para subsidios directos del Estado.',
    beneficios: [
      'Acceso al régimen subsidiado de salud mediante aporte solidario (con copago)',
      'Elegibilidad muy limitada o nula para la mayoría de programas de transferencias monetarias',
      'Puede aplicar a beneficios educativos que no dependan del nivel de pobreza (según la institución)',
    ],
    colorClass: 'from-emerald-500/20 to-emerald-500/5 border-emerald-500/30 text-emerald-300',
  },
};

const CODIGO_REGEX = /\b([ABCD])\s*-?\s*(\d{1,2})\b/i;

/**
 * Busca un código de nivel RUI (p. ej. "C7", "B 03", "A-1") dentro de un texto libre
 * y devuelve su información general de grupo, o null si no se encuentra un código
 * válido.
 */
export function detectarNivelRui(texto: string): NivelRuiInfo | null {
  const match = texto.match(CODIGO_REGEX);
  if (!match) return null;

  const grupo = match[1].toUpperCase() as GrupoRui;
  const numero = parseInt(match[2], 10);

  const rangos: Record<GrupoRui, number> = { A: 5, B: 7, C: 18, D: 21 };
  if (numero < 1 || numero > rangos[grupo]) return null;

  const codigo = `${grupo}${match[2].replace(/^0+(?=\d)/, '')}`;

  return {
    grupo,
    codigo,
    ...INFO_POR_GRUPO[grupo],
  };
}
