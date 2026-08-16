// Preguntas frecuentes sobre el RUI. Se consumen desde dos lugares:
// el JSON-LD de tipo FAQPage en `layout.tsx` (para rich snippets) y el bloque
// visible en `page.tsx`. Google exige que el contenido declarado en el schema
// sea visible para el usuario, así que ambos deben leer de esta misma fuente.

export interface PreguntaFrecuente {
  pregunta: string;
  respuesta: string;
}

export const FAQ_RUI: PreguntaFrecuente[] = [
  {
    pregunta: "¿Qué es el RUI?",
    respuesta:
      "El RUI (Registro Universal de Ingresos) es el instrumento del Departamento Nacional de Planeación (DNP) que desde agosto de 2026 clasifica a los hogares colombianos según sus ingresos para focalizar los programas sociales del Estado.",
  },
  {
    pregunta: "¿Cómo consultar el RUI por cédula?",
    respuesta:
      "Selecciona tu tipo de documento, escribe el número de cédula, completa la validación de seguridad y presiona Consultar RUI. La consulta toma menos de tres minutos y no requiere crear una cuenta.",
  },
  {
    pregunta: "¿La consulta del RUI es gratuita?",
    respuesta:
      "Sí. La consulta del RUI y la descarga del certificado son completamente gratuitas en el portal oficial del DNP. No debes pagar a intermediarios para conocer tu clasificación.",
  },
  {
    pregunta: "¿El RUI tiene puntaje como el Sisbén?",
    respuesta:
      "No. A diferencia del Sisbén, el RUI no asigna un puntaje numérico: devuelve un código de grupo y subgrupo (por ejemplo B03 o C12) junto con la fecha de corte del cálculo.",
  },
  {
    pregunta: "¿El RUI reemplaza al Sisbén?",
    respuesta:
      "El RUI reemplaza al Sisbén como instrumento principal de focalización del gasto social. Durante la transición, vigente hasta el 31 de octubre de 2026, el Sisbén sigue siendo una de las fuentes de información sobre las condiciones de los hogares.",
  },
  {
    pregunta: "¿Tengo que hacer una encuesta para aparecer en el RUI?",
    respuesta:
      "No. El RUI no se basa en encuestas: calcula la clasificación cruzando bases de datos oficiales como las de la DIAN, servicios públicos, fondos de pensiones y entidades bancarias.",
  },
];
