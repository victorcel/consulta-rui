export interface CamposConsolidados {
  nivelRui: string | null;
  municipio: string | null;
  departamento: string | null;
  nombre: string | null;
  sexo: string | null;
  edad: string | null;
}

interface CampoTexto {
  label: string;
  value: string;
}

const normalizarEtiqueta = (label: string) =>
  label.trim().toLowerCase().replace(/\s+/g, ' ');

function extraerPares(responseText: string): CampoTexto[] {
  const fields: CampoTexto[] = [];

  try {
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const data = JSON.parse(jsonMatch[0]);
      for (const [key, value] of Object.entries(data)) {
        if (value && String(value).trim()) {
          fields.push({ label: key, value: String(value) });
        }
      }
      if (fields.length > 0) return fields;
    }
  } catch {
    // No es JSON, seguimos con el parseo de filas de tabla.
  }

  const rowRegex = /<tr[^>]*>\s*<t[dh][^>]*>([\s\S]*?)<\/t[dh]>\s*<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi;
  const stripTags = (value: string) => value.replace(/<[^>]*>/g, '').trim();

  let match: RegExpExecArray | null;
  while ((match = rowRegex.exec(responseText)) !== null) {
    const label = stripTags(match[1]);
    const value = stripTags(match[2]);
    if (label && value) {
      fields.push({ label, value });
    }
  }

  return fields;
}

function buscarCampo(fields: CampoTexto[], patron: RegExp): string | null {
  const campo = fields.find((field) => patron.test(normalizarEtiqueta(field.label)));
  return campo ? campo.value : null;
}

// El DNP devuelve varios campos que matchean el patrón amplio: "grupoIngresos"
// (grupo de ingresos del hogar) y "grupRui" (solo la letra, ej. "B") aparecen
// antes que "nivelRui" (el código completo, ej. "B06"), que es el que
// queremos. Probamos primero el nombre exacto del campo para no confundirlos.
export const CAMPO_NIVEL_RUI_EXACTO = /^nivel\s*rui$/i;
export const CAMPO_NIVEL_RUI_AMPLIO = /grupo|nivel|clasificaci|sisb|rui/i;

export function extraerCamposConsolidados(responseText: string): CamposConsolidados {
  const fields = extraerPares(responseText);

  return {
    nivelRui:
      buscarCampo(fields, CAMPO_NIVEL_RUI_EXACTO) ??
      buscarCampo(fields, CAMPO_NIVEL_RUI_AMPLIO),
    municipio: buscarCampo(fields, /municipio/i),
    departamento: buscarCampo(fields, /departamento/i),
    nombre: buscarCampo(fields, /nombre/i),
    sexo: buscarCampo(fields, /sexo|g.nero/i),
    edad: buscarCampo(fields, /edad/i),
  };
}
