# Migración a Cloudflare Workers + registro de consultas en D1

**Fecha**: 2026-08-13
**Estado**: Aprobado
**Reemplaza a**: `2026-08-13-d1-consulta-logging-design.md`

## Contexto

El pedido original era guardar cada consulta RUI en Cloudflare D1 con un contador por documento. Durante el diseño, se decidió ampliar el alcance: la app se va a desplegar en Cloudflare, así que en vez de hablar con D1 vía API REST desde un servidor Node self-hosted, se migra el hosting completo a Cloudflare Workers (usando el adaptador oficial `@opennextjs/cloudflare`) y se usa el **binding nativo de D1**.

### Auditoría de compatibilidad

Se revisó el uso real de dependencias potencialmente incompatibles con el runtime de Workers:

- `src/lib/db.ts` (Prisma + SQLite local): **no se importa desde ningún otro archivo de `src/`**. Es código muerto.
- `next-auth`: está en `package.json` pero no hay ningún archivo de auth ni uso en `src/`. Código muerto.
- `next/image` / `sharp`: no hay uso directo de `next/image` en `src/`. `opengraph-image.tsx` usa `next/og` (`ImageResponse`), que es compatible con el runtime de Workers.
- No hay `middleware.ts`.
- No hay imports directos de `fs`, `node:fs`, `node:crypto`, etc. en `src/`.

Conclusión: no hay bloqueadores técnicos de compatibilidad para migrar a Workers.

## Alcance

**Incluido:**
- Scaffolding de `@opennextjs/cloudflare` (`wrangler.jsonc`, `open-next.config.ts`, cambios en `next.config.ts` y `package.json`).
- Base de datos D1 `consulta-rui` (creada por CLI) con la tabla `consultas`, conectada vía **binding nativo** (no REST API).
- Registrar/incrementar el contador de consultas en `src/app/api/consultar-rui/route.ts` cuando el fetch al DNP responde 2xx.
- Eliminar código muerto: `prisma/`, `src/lib/db.ts`, dependencias `@prisma/client`, `prisma`, `next-auth`, y `DATABASE_URL` de `.env`.
- Retirar el setup de self-host una vez verificado el deploy en Cloudflare: `Caddyfile`, `.zscripts/`, `output: "standalone"` en `next.config.ts`, y los scripts `build`/`start` de `package.json` orientados a ese modo.
- Deploy de verificación en el subdominio `*.workers.dev` (preview), sin tocar DNS de producción.

**Fuera de alcance (requiere confirmación explícita aparte, no se hace en este trabajo):**
- Apuntar el DNS de `consultarui.col0.com` al Worker de Cloudflare. Es un cambio de producción/tráfico real — se hace solo después de que el usuario verifique el deploy de preview y dé el visto bueno explícito para el corte.

## Diseño

### Infraestructura Cloudflare

- Worker: `consulta-rui`.
- Base D1: `consulta-rui` (se crea con `wrangler d1 create consulta-rui`, igual que en el diseño anterior).
- `wrangler.jsonc`:
  ```jsonc
  {
    "$schema": "node_modules/wrangler/config-schema.json",
    "name": "consulta-rui",
    "main": ".open-next/worker.js",
    "compatibility_date": "2026-08-13",
    "compatibility_flags": ["nodejs_compat", "global_fetch_strictly_public"],
    "assets": {
      "directory": ".open-next/assets",
      "binding": "ASSETS"
    },
    "d1_databases": [
      {
        "binding": "DB",
        "database_name": "consulta-rui",
        "database_id": "<database_id de wrangler d1 create>"
      }
    ]
  }
  ```
- `open-next.config.ts`:
  ```typescript
  import { defineCloudflareConfig } from "@opennextjs/cloudflare";

  export default defineCloudflareConfig();
  ```
- `next.config.ts`: se agrega `initOpenNextCloudflareForDev()` (necesario para que `next dev` tenga acceso al binding D1 vía Miniflare) y se **quita** `output: "standalone"` (es específico del build self-hosted actual; el adaptador de Cloudflare usa el build estándar de `next build`).
- `package.json`: se agregan scripts `preview` y `deploy` de `opennextjs-cloudflare`; se retiran `build`/`start` orientados a Caddy/bun una vez verificado el nuevo flujo (ver sección de limpieza).

### Modelo de datos D1

La tabla guarda, además del contador, un snapshot consolidado de los últimos datos conocidos de la persona (tomados de la respuesta del RUI), pedido explícitamente por el usuario: Nivel RUI, Municipio, Departamento, Nombre, Sexo, Edad.

```sql
CREATE TABLE IF NOT EXISTS consultas (
  tipo_documento TEXT NOT NULL,
  numero_identificacion TEXT NOT NULL,
  conteo INTEGER NOT NULL DEFAULT 1,
  fecha_ultima_consulta TEXT NOT NULL,
  nivel_rui TEXT,
  municipio TEXT,
  departamento TEXT,
  nombre TEXT,
  sexo TEXT,
  edad TEXT,
  PRIMARY KEY (tipo_documento, numero_identificacion)
);
```

Los 6 campos consolidados son nullable: no siempre el RUI devuelve todos, y no todas las consultas encuentran resultado. Aplicado tanto en remoto (`wrangler d1 execute consulta-rui --remote --file=./d1/schema.sql`) como en local (`--local`, para que `next dev` con Miniflare tenga la tabla).

La base D1 remota ya existía con el esquema de 4 columnas (creada en la Task 1 original); se amplía con `ALTER TABLE` antes de que cualquier otra tarea dependa del esquema completo — ver plan.

### Extracción de los campos consolidados

El endpoint `consultar-rui` solo hace de proxy: nunca parsea la respuesta del DNP en el servidor (el parseo actual, en `src/app/page.tsx`, corre en el navegador con `DOMParser`, que no existe en el runtime del servidor). Para poblar los 6 campos en D1 hace falta un extractor liviano, basado en texto/regex (sin DOM), que corra en `route.ts` antes de llamar a `logConsulta`.

Nuevo módulo `src/lib/rui-fields.ts`:
- `extraerCamposConsolidados(responseText: string): CamposConsolidados` — replica, sin DOM, la misma estrategia de dos pasos que ya usa `parseHtmlResponse` en `page.tsx` (JSON primero, si no filas de tabla `<tr><td>...</td><td>...</td></tr>` vía regex), y de ese conjunto de pares label/value extrae los 6 campos por coincidencia de etiqueta normalizada (mismo criterio de "etiqueta normalizada" que ya usa `page.tsx` con `normalizarEtiqueta`):
  - `nivel_rui`: la primera etiqueta que matchea `/grupo|nivel|clasificaci|sisb|rui/i` (mismo regex que ya usa `page.tsx` para detectar el campo de nivel).
  - `municipio`: etiqueta que matchea `/municipio/i`.
  - `departamento`: etiqueta que matchea `/departamento/i`.
  - `nombre`: etiqueta que matchea `/nombre/i`.
  - `sexo`: etiqueta que matchea `/sexo|g.nero/i`.
  - `edad`: etiqueta que matchea `/edad/i`.
- Si un campo no se encuentra, su valor es `null` — no se inventa ni se fuerza un valor.
- Esta es una extracción best-effort para fines de registro agregado, independiente y no relacionada con el parser del cliente (que sigue mostrando todos los campos al usuario, sin cambios).

### Semántica de actualización (consolidado, no sobrescritura con vacío)

Como el objetivo es "consolidado de la información" — construir a lo largo del tiempo el mejor dato conocido por persona — el upsert conserva el valor anterior de cada campo cuando la consulta más reciente no lo encontró, en vez de borrarlo:

```sql
DO UPDATE SET
  conteo = conteo + 1,
  fecha_ultima_consulta = excluded.fecha_ultima_consulta,
  nivel_rui = COALESCE(excluded.nivel_rui, consultas.nivel_rui),
  municipio = COALESCE(excluded.municipio, consultas.municipio),
  departamento = COALESCE(excluded.departamento, consultas.departamento),
  nombre = COALESCE(excluded.nombre, consultas.nombre),
  sexo = COALESCE(excluded.sexo, consultas.sexo),
  edad = COALESCE(excluded.edad, consultas.edad)
```

### Acceso a D1 desde el código

Se reemplaza el helper REST (`fetch` + API token) por el binding nativo. `logConsulta` recibe ahora los 6 campos consolidados (cada uno nullable):

```typescript
// src/lib/d1.ts
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
```

No se necesitan `CLOUDFLARE_ACCOUNT_ID` / `CLOUDFLARE_D1_DATABASE_ID` / `CLOUDFLARE_API_TOKEN`: el binding se resuelve por configuración de `wrangler.jsonc`, no por variables de entorno en `.env`.

### Integración en el endpoint

En `src/app/api/consultar-rui/route.ts`: tras `response.ok` del fetch al DNP, se llama a `extraerCamposConsolidados(responseText)` y el resultado se pasa a `logConsulta(pTipDoc, pNumDoc, campos)`, dentro de un `try/catch` que solo loguea el error sin afectar la respuesta al cliente.

### Limpieza de código muerto

- Borrar `prisma/schema.prisma`, `src/lib/db.ts`.
- Quitar del `package.json`: dependencias `@prisma/client`, `prisma`, `next-auth`; scripts `db:push`, `db:generate`, `db:migrate`, `db:reset`.
- Quitar `DATABASE_URL` de `.env`.
- Retirar `Caddyfile`, `.zscripts/` (ya estaban vacíos/en proceso de borrado según el estado de git observado), `output: "standalone"` de `next.config.ts`, y los scripts `build`/`start` actuales de `package.json` (los reemplazan `preview`/`deploy` de OpenNext).

## Manejo de errores

Igual que el diseño original: un fallo al escribir en D1 (incluyendo el binding nativo) se captura y loguea, sin afectar la respuesta HTTP de la consulta RUI.

## Pruebas

No hay test runner en el repo. Verificación manual:
1. `next dev` local con `initOpenNextCloudflareForDev()` — probar el formulario end-to-end y confirmar el upsert en la D1 local (`wrangler d1 execute consulta-rui --local --command "select * from consultas"`).
2. `opennextjs-cloudflare build && opennextjs-cloudflare preview` — probar en el túnel/preview local de Wrangler.
3. `opennextjs-cloudflare deploy` — probar en la URL `*.workers.dev`, confirmar el upsert en D1 remoto (`--remote`).
4. Corte de DNS a producción: **solo con confirmación explícita del usuario**, fuera de este trabajo.
