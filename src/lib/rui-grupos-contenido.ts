import type { GrupoRui } from './rui-niveles';

/**
 * Contenido propio de cada página de grupo. Complementa la información
 * compartida de `INFO_POR_GRUPO` con texto específico del grupo, para que cada
 * página aporte valor por sí misma y no sea una plantilla repetida.
 */
export interface ContenidoGrupo {
  subgrupos: number;
  /** Cómo se ubica el grupo frente al resto de la escala. */
  contexto: string;
  /** Qué implica en la práctica pertenecer a este grupo. */
  implicaciones: string;
  /** Duda frecuente y específica de este grupo. */
  duda: { pregunta: string; respuesta: string };
  /** Qué diferencia hay entre el primer y el último subgrupo del grupo. */
  extremos: { primero: string; ultimo: string };
}

export const CONTENIDO_POR_GRUPO: Record<GrupoRui, ContenidoGrupo> = {
  A: {
    subgrupos: 5,
    contexto:
      'El grupo A es el primero de la escala del RUI y agrupa a los hogares con los ingresos más bajos del país. Se divide en cinco subgrupos, de A1 a A5, donde A1 corresponde a la situación de mayor precariedad económica.',
    implicaciones:
      'Pertenecer al grupo A implica la mayor prioridad en la asignación de programas sociales. En la práctica, es el grupo que suele quedar cubierto primero cuando un programa tiene cupos limitados y, en varios programas, el que accede a los montos más altos.',
    duda: {
      pregunta: '¿El grupo A garantiza recibir todos los subsidios?',
      respuesta:
        'No. El grupo A da la máxima prioridad, pero cada programa mantiene requisitos propios además de la clasificación: edad, composición del hogar, municipio o disponibilidad de cupos. La clasificación abre la puerta; no adjudica el beneficio de forma automática.',
    },
    extremos: {
      primero:
        'A1 es el subgrupo de mayor prioridad de todo el RUI: concentra a los hogares con la situación económica más precaria del país.',
      ultimo:
        'A5, aunque sigue siendo pobreza extrema, corresponde a hogares con una situación algo menos crítica que la de A1 dentro del mismo grupo.',
    },
  },
  B: {
    subgrupos: 7,
    contexto:
      'El grupo B corresponde a hogares en condición de pobreza, con ingresos algo superiores a los del grupo A. Se divide en siete subgrupos, de B1 a B7, y se ubica en la escala entre la pobreza extrema (grupo A) y la vulnerabilidad (grupo C).',
    implicaciones:
      'Los hogares del grupo B mantienen acceso prioritario a la mayoría de programas sociales. Frente al grupo A, la diferencia suele estar en la prioridad de asignación más que en la elegibilidad: se accede a los mismos programas principales, y solo algunos gradúan el monto según el subgrupo.',
    duda: {
      pregunta: '¿Cuál es la diferencia real entre el grupo A y el B?',
      respuesta:
        'Ambos son grupos de pobreza y conservan acceso a los principales programas sociales. La diferencia está en el nivel estimado de ingresos y, por tanto, en el orden de prioridad: cuando un programa asigna cupos o gradúa el monto del subsidio, el grupo A se atiende primero.',
    },
    extremos: {
      primero:
        'B1 se ubica justo debajo del grupo A: hogares en pobreza con ingresos apenas superiores a los del subgrupo A5.',
      ultimo:
        'B7 es el último tramo de pobreza antes de entrar a la vulnerabilidad del grupo C, con condiciones algo más holgadas que el resto del grupo B.',
    },
  },
  C: {
    subgrupos: 18,
    contexto:
      'El grupo C reúne a los hogares que no están en situación de pobreza pero podrían caer en ella ante un choque económico. Es el grupo más extenso de la escala: se divide en dieciocho subgrupos, de C1 a C18.',
    implicaciones:
      'En este grupo el subgrupo específico pesa mucho más que en los demás. Los subgrupos cercanos a C1 mantienen condiciones parecidas a las del grupo B, mientras que los cercanos a C18 se acercan al grupo D. Por eso el acceso a un mismo programa puede variar de forma notable dentro del grupo C.',
    duda: {
      pregunta: '¿Por qué el grupo C tiene tantos subgrupos?',
      respuesta:
        'Porque abarca el tramo más amplio de la escala de ingresos: desde hogares apenas por encima de la línea de pobreza hasta hogares con una situación considerablemente más holgada. Los dieciocho subgrupos permiten diferenciar situaciones muy distintas que, agrupadas, quedarían mal representadas.',
    },
    extremos: {
      primero:
        'C1 conserva condiciones parecidas a las del grupo B: suele mantener acceso a Colombia Mayor y a copagos reducidos en salud.',
      ultimo:
        'C18 es el último subgrupo del grupo C: se acerca a las condiciones del grupo D y su acceso a subsidios directos es limitado, aunque puede mantener prioridad en programas educativos y de vivienda según la entidad.',
    },
  },
  D: {
    subgrupos: 21,
    contexto:
      'El grupo D es el último tramo de la escala del RUI y corresponde a los hogares cuyos ingresos les permiten cubrir sus necesidades básicas sin apoyo estatal. Se divide en veintiún subgrupos, de D1 a D21.',
    implicaciones:
      'Es el grupo con menor prioridad para subsidios directos. Esto no significa quedar fuera del sistema: se mantiene el acceso a la salud mediante aporte solidario con copago, y ciertos beneficios educativos no dependen del nivel de pobreza sino de criterios propios de cada institución.',
    duda: {
      pregunta: '¿Quedar en grupo D significa perder la salud subsidiada?',
      respuesta:
        'No implica quedar sin cobertura en salud, pero sí cambia la forma de acceso: los hogares del grupo D pueden vincularse mediante aporte solidario con copago, en lugar de la afiliación sin costo que aplica a los grupos A y B. La entidad responsable define la transición.',
    },
    extremos: {
      primero:
        'D1 conserva algo de cercanía con la vulnerabilidad del grupo C, por lo que puede acceder a algunos beneficios que no dependen del nivel de pobreza, como ciertos apoyos educativos, según la entidad.',
      ultimo:
        'D21 es el subgrupo con menor prioridad de todo el RUI: corresponde a los hogares con mayor capacidad económica dentro de la escala del sistema.',
    },
  },
};
