import { getCloudflareContext } from "@opennextjs/cloudflare";
import type { CamposConsolidados } from "@/lib/rui-fields";

export async function logConsulta(
  tipoDocumento: string,
  numeroIdentificacion: string,
  campos: CamposConsolidados
): Promise<void> {
  const { env } = getCloudflareContext();
  const fechaUltimaConsulta = new Date().toISOString();

  await env.DB.prepare(
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
       edad = COALESCE(excluded.edad, consultas.edad);`
  )
    .bind(
      tipoDocumento,
      numeroIdentificacion,
      fechaUltimaConsulta,
      campos.nivelRui,
      campos.municipio,
      campos.departamento,
      campos.nombre,
      campos.sexo,
      campos.edad
    )
    .run();
}
