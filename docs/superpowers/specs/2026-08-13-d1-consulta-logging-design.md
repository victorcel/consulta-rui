# Registro de consultas RUI en Cloudflare D1

**Fecha**: 2026-08-13
**Estado**: Aprobado

## Contexto

El endpoint `POST /api/consultar-rui` (`src/app/api/consultar-rui/route.ts`) recibe `pNumDoc` y `pTipDoc`, valida un token de Turnstile y hace de proxy hacia el servicio del DNP (`https://ventanillasocial.dnp.gov.co/Home/ObtenerDatosRUI`). Hoy esa consulta no se persiste en ningún lado.

Se quiere contar cuántas veces se ha consultado cada número de identificación, y cuándo fue la última vez, guardando esa información en una base de datos SQLite de Cloudflare D1.

La app corre self-hosted como proceso Node standalone (`bun .next/standalone/server.js` detrás de Caddy) — no como Cloudflare Worker/Pages Function — por lo que no tiene acceso al binding nativo de D1. Se usará la API REST de Cloudflare D1 (`POST /accounts/{account_id}/d1/database/{database_id}/query`) desde el propio servidor Next.js. Este mismo mecanismo seguirá funcionando si más adelante se migra el hosting a Cloudflare Workers/Pages (fuera de alcance de este spec).

El proyecto no tiene pipeline de despliegue basado en dashboard (no hay `git remote`, ni `.vercel/`, ni `wrangler.toml`; los scripts en `.zscripts/` están vacíos). Las variables de entorno viven en un único archivo `.env` local que ya contiene `DATABASE_URL`, `TURNSTILE_SECRET_KEY`, etc. Las nuevas variables de Cloudflare se agregan ahí mismo, siguiendo el mismo patrón.

## Alcance

**Incluido:**
- Crear la base de datos D1 (vía `wrangler d1 create`, ya autenticado con la cuenta `col.zero.dev@gmail.com`).
- Tabla `consultas` con conteo agregado por documento (no un log de cada consulta individual).
- Helper para ejecutar queries contra D1 vía API REST.
- Registrar/incrementar el conteo cuando el proxy a DNP responde exitosamente (status 2xx).

**Fuera de alcance:**
- Migrar el hosting a Cloudflare Workers/Pages o usar el binding nativo de D1.
- Guardar el contenido de cada respuesta del RUI (solo se guarda el conteo agregado).
- UI para consultar estos datos (se consultan directamente con `wrangler d1 execute`).

## Modelo de datos

Base de datos D1: `consulta-rui`.

```sql
CREATE TABLE IF NOT EXISTS consultas (
  tipo_documento TEXT NOT NULL,
  numero_identificacion TEXT NOT NULL,
  conteo INTEGER NOT NULL DEFAULT 1,
  fecha_ultima_consulta TEXT NOT NULL,
  PRIMARY KEY (tipo_documento, numero_identificacion)
);
```

- `tipo_documento`: valor de `pTipDoc` tal como lo envía el frontend (p. ej. "CC").
- `numero_identificacion`: valor de `pNumDoc`.
- `conteo`: número total de consultas exitosas para ese par (tipo, número).
- `fecha_ultima_consulta`: timestamp ISO8601 (UTC) de la última consulta exitosa.

El esquema vive en `d1/schema.sql` y se aplica con:
```
wrangler d1 execute consulta-rui --remote --file=./d1/schema.sql
```

## Componentes

### `src/lib/d1.ts` (nuevo)

- `d1Query(sql: string, params: unknown[])`: hace `fetch` a la API REST de Cloudflare D1 usando `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_D1_DATABASE_ID` y `CLOUDFLARE_API_TOKEN` (headers `Authorization: Bearer <token>`). Lanza error si la respuesta no es exitosa.
- `logConsulta(tipoDocumento: string, numeroIdentificacion: string)`: ejecuta el upsert:
  ```sql
  INSERT INTO consultas (tipo_documento, numero_identificacion, conteo, fecha_ultima_consulta)
  VALUES (?, ?, 1, ?)
  ON CONFLICT(tipo_documento, numero_identificacion)
  DO UPDATE SET conteo = conteo + 1, fecha_ultima_consulta = excluded.fecha_ultima_consulta;
  ```
  con la fecha actual en ISO8601.

### `src/app/api/consultar-rui/route.ts` (modificado)

Después del `fetch` a DNP, si `response.ok` es `true`, se llama a `logConsulta(pTipDoc, pNumDoc)` dentro de un `try/catch`. Un fallo al escribir en D1 se loguea con `console.error` pero nunca cambia la respuesta HTTP devuelta al cliente — la disponibilidad de la consulta RUI no depende de D1.

### Configuración

Nuevas variables en `.env` (agregadas directamente, sin dashboard):
- `CLOUDFLARE_ACCOUNT_ID`
- `CLOUDFLARE_D1_DATABASE_ID`
- `CLOUDFLARE_API_TOKEN` (token con permiso D1 Edit sobre la cuenta)

## Manejo de errores

- Si Turnstile falla o el proxy a DNP falla (status no-2xx), no se escribe en D1.
- Si D1 responde con error o la petición de red falla, se captura, se loguea, y la respuesta al usuario continúa normalmente (el registro es "best effort", no bloqueante).

## Pruebas

No hay suite de tests en el repo. Verificación manual:
1. Levantar el dev server y hacer una consulta real (o simulada) al endpoint.
2. Confirmar el upsert con `wrangler d1 execute consulta-rui --remote --command "select * from consultas"`.
3. Repetir la misma consulta y verificar que `conteo` sube a 2 y `fecha_ultima_consulta` se actualiza.
