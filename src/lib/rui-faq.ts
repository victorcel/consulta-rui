// Preguntas frecuentes sobre el RUI. Se consumen desde dos lugares:
// el JSON-LD de tipo FAQPage en `layout.tsx` (para rich snippets) y el bloque
// visible en `page.tsx`. Google exige que el contenido declarado en el schema
// sea visible para el usuario, así que ambos deben leer de esta misma fuente.

export interface PreguntaFrecuente {
  pregunta: string;
  respuesta: string;
  /** Página con el detalle; se muestra como enlace bajo la respuesta (no entra al schema). */
  enlace?: { href: string; texto: string };
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
      "Selecciona tu tipo de documento, escribe el número de cédula, completa la validación de seguridad y presiona Consultar RUI. La consulta toma solo un momento y no requiere crear una cuenta.",
    enlace: { href: '/#consulta', texto: 'Ir al formulario de consulta' },
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
      "El RUI reemplaza al Sisbén como instrumento principal de focalización del gasto social. Durante la transición, vigente hasta el 31 de octubre de 2026, el Sisbén sigue siendo una de las fuentes de información sobre las condiciones de los hogares. Según el DNP, el Sisbén no desaparece: evoluciona y sigue aportando la base.",
  },
  {
    pregunta: "¿Tengo que hacer una encuesta nueva para aparecer en el RUI?",
    respuesta:
      "No. El RUI parte de la base del Sisbén y calcula la clasificación cruzando bases de datos oficiales como las de la DIAN, servicios públicos, fondos de pensiones y entidades bancarias.",
    enlace: { href: '/que-es-el-rui', texto: 'Cómo funciona el RUI' },
  },
  {
    pregunta: "¿Por qué mi consulta dice que no hay resultados?",
    respuesta:
      "Verifica que elegiste el tipo de documento correcto y que el número no tiene errores. Si todo está bien, puede que tu clasificación aún no se haya calculado, porque el RUI se actualiza de forma periódica. En ese caso, consulta en la Ventanilla Social o en la oficina del Sisbén de tu municipio.",
    enlace: { href: '/corregir-datos-rui', texto: 'Qué hacer si tus datos no aparecen o están mal' },
  },
  {
    pregunta: "¿Cómo descargo el certificado del RUI?",
    respuesta:
      "El certificado se descarga en PDF desde la Ventanilla Social del DNP, sin ningún costo. Sirve como soporte de tu clasificación en trámites de salud, vivienda, educación o transferencias, según lo que exija cada entidad.",
    enlace: { href: '/certificado-rui', texto: 'Paso a paso para descargar el certificado' },
  },
  {
    pregunta: "¿Qué hago si mi grupo no corresponde a mi situación?",
    respuesta:
      "Puedes solicitar la revisión de tus datos ante el DNP. Antes, identifica qué información está mal (un ingreso, una cuenta, un dato del hogar) y reúne los soportes que respalden tu situación real. El trámite no tiene costo.",
    enlace: { href: '/corregir-datos-rui', texto: 'Cómo solicitar la revisión' },
  },
  {
    pregunta: "¿Qué subsidios me corresponden según mi grupo?",
    respuesta:
      "Depende de tu grupo y subgrupo, pero estar clasificado no garantiza un beneficio: cada programa define sus propios requisitos. Los grupos A y B suelen tener acceso prioritario a la mayoría de programas.",
    enlace: { href: '/subsidios-rui', texto: 'Ver subsidios según tu grupo' },
  },
];
