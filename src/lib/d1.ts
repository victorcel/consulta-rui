import type { CamposConsolidados } from "@/lib/rui-fields";

const D1_API_BASE = 'https://api.cloudflare.com/client/v4';

interface D1QueryResult {
  success: boolean;
  errors?: { message: string }[];
}

export async function d1Query(sql: string, params: unknown[] = []): Promise<void> {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const databaseId = process.env.CLOUDFLARE_D1_DATABASE_ID;
  const apiToken = process.env.CLOUDFLARE_API_TOKEN;

  if (!accountId || !databaseId || !apiToken) {
    throw new Error('Faltan variables de entorno de Cloudflare D1 (CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_D1_DATABASE_ID, CLOUDFLARE_API_TOKEN)');
  }

  const response = await fetch(
    `${D1_API_BASE}/accounts/${accountId}/d1/database/${databaseId}/query`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ sql, params }),
    }
  );

  const data = (await response.json()) as {
    result?: D1QueryResult[];
    errors?: { message: string }[];
  };

  if (!response.ok || data.errors?.length) {
    const message = data.errors?.map((e) => e.message).join('; ') || `HTTP ${response.status}`;
    throw new Error(`Error consultando D1: ${message}`);
  }
}

export async function logConsulta(
  tipoDocumento: string,
  numeroIdentificacion: string,
  campos: CamposConsolidados
): Promise<void> {
  const fechaUltimaConsulta = new Date().toISOString();

  await d1Query(
    `INSERT INTO consultas (
       tipo_documento, numero_identificacion, conteo, fecha_ultima_consulta,
       nivel_rui, municipio, departamento, nombre, sexo, edad
     )
     VALUES (?, ?, 1, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(tipo_documento, numero_identificacion)
     DO UPDATE SET
       conteo = conteo + 1,
       fecha_ultima_consulta = excluded.fecha_ultima_consulta,
       nivel_rui = COALESCE(excluded.nivel_rui, consultas.nivel_rui),
       municipio = COALESCE(excluded.municipio, consultas.municipio),
       departamento = COALESCE(excluded.departamento, consultas.departamento),
       nombre = COALESCE(excluded.nombre, consultas.nombre),
       sexo = COALESCE(excluded.sexo, consultas.sexo),
       edad = COALESCE(excluded.edad, consultas.edad);`,
    [
      tipoDocumento,
      numeroIdentificacion,
      fechaUltimaConsulta,
      campos.nivelRui,
      campos.municipio,
      campos.departamento,
      campos.nombre,
      campos.sexo,
      campos.edad,
    ]
  );
}
