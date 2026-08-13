# Migración a Cloudflare Workers + registro de consultas en D1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Desplegar la app en Cloudflare Workers vía `@opennextjs/cloudflare`, con una base D1 (`consulta-rui`) que registra/incrementa un contador por (tipo de documento, número de identificación) y guarda un snapshot consolidado (Nivel RUI, Municipio, Departamento, Nombre, Sexo, Edad) usando el binding nativo de D1, y retirar el self-host actual (Caddy + bun standalone) y el código muerto (Prisma, next-auth).

**Architecture:** Adaptador oficial `@opennextjs/cloudflare` convierte el build de Next.js a un Worker (`.open-next/worker.js` + assets estáticos). El binding D1 (`env.DB`) se declara en `wrangler.jsonc` y se accede desde el código vía `getCloudflareContext()`. El endpoint `src/app/api/consultar-rui/route.ts` extrae los campos consolidados del texto de respuesta (regex, sin DOM) y llama a `logConsulta()` tras cada respuesta exitosa del DNP.

**Tech Stack:** Next.js 16 App Router, `@opennextjs/cloudflare`, `wrangler`, Cloudflare D1.

> **Nota de amendment (post Task 1):** el alcance original de D1 era solo el contador (4 columnas). El usuario pidió, mientras Task 1 ya estaba en ejecución, agregar un snapshot consolidado de 6 campos más. Task 1 ya se ejecutó y quedó revisada con el esquema viejo (4 columnas) — se agregó una Task 2 nueva para ampliar el esquema (ALTER remoto + `schema.sql` completo), y se renumeraron las tareas siguientes. Ver detalle en `docs/superpowers/specs/2026-08-13-cloudflare-workers-migration-design.md`.

## Global Constraints

- Sin test runner en el repo (sin jest/vitest); verificación manual con `next dev`, `wrangler d1 execute`, y los comandos de preview/deploy de OpenNext.
- El registro en D1 solo ocurre cuando el fetch a DNP responde con status 2xx (`response.ok`); un fallo al escribir en D1 nunca cambia la respuesta HTTP al cliente.
- No tocar DNS de producción (`consultarui.col0.com`) en este plan — el corte final requiere confirmación explícita aparte, fuera de este trabajo.
- Worker name: `consulta-rui`. Base D1: `consulta-rui`.
- No se usan `CLOUDFLARE_ACCOUNT_ID`/`CLOUDFLARE_D1_DATABASE_ID`/`CLOUDFLARE_API_TOKEN` — el acceso a D1 es por binding nativo, no API REST.
- Los 6 campos consolidados (`nivel_rui`, `municipio`, `departamento`, `nombre`, `sexo`, `edad`) son nullable. El upsert nunca borra un valor previamente conocido con uno vacío: usa `COALESCE(excluded.col, consultas.col)`.
- La extracción de los campos consolidados corre en el servidor (`src/lib/rui-fields.ts`), es best-effort vía regex (sin `DOMParser`, que no existe en el runtime del servidor), y es independiente del parser del cliente en `src/app/page.tsx` (que no se toca en este plan).

---

## File Structure

- `d1/schema.sql` (nuevo en Task 1, ampliado en Task 2) — definición completa de la tabla `consultas` (10 columnas).
- `d1/migrations/0001_add_campos_consolidados.sql` (nuevo, Task 2) — `ALTER TABLE` para la base remota que Task 1 ya creó con el esquema viejo.
- `wrangler.jsonc` (nuevo, Task 3) — config del Worker + binding D1 + assets.
- `open-next.config.ts` (nuevo, Task 3) — config mínima de OpenNext.
- `next.config.ts` (modificado, Task 3) — agrega `initOpenNextCloudflareForDev()`, quita `output: "standalone"`.
- `package.json` (modificado, Task 3 y Task 6) — agrega deps/scripts de OpenNext; quita Prisma/next-auth y scripts de self-host.
- `cloudflare-env.d.ts` (generado, Task 3) — tipos de los bindings.
- `src/lib/rui-fields.ts` (nuevo, Task 4) — `extraerCamposConsolidados()`, extractor de texto sin DOM.
- `src/lib/d1.ts` (nuevo, Task 4) — `logConsulta()` vía binding nativo, recibe los campos consolidados.
- `src/app/api/consultar-rui/route.ts` (modificado, Task 4) — llama a `extraerCamposConsolidados()` y `logConsulta()`.
- Eliminados (Task 6): `prisma/`, `src/lib/db.ts`, `Caddyfile`, `DATABASE_URL` en `.env`.

---

### Task 1: Aprovisionar la base de datos D1 (remoto) — ✅ COMPLETA

Ya ejecutada y revisada (ledger: `Task 1: complete`, commit `225b26f`). Creó `d1/schema.sql` con el esquema original de 4 columnas y la base remota `consulta-rui` (database_id `a3270e73-b1cf-429c-ad7b-cfed966651fa`). No se re-ejecuta. Task 2 amplía lo que esta tarea dejó.

---

### Task 2: Ampliar el esquema D1 con campos consolidados de resultado

**Files:**
- Create: `d1/migrations/0001_add_campos_consolidados.sql`
- Modify: `d1/schema.sql`

**Interfaces:**
- Consumes: base remota `consulta-rui` ya creada por Task 1 (database_id `a3270e73-b1cf-429c-ad7b-cfed966651fa`), tabla `consultas` con 4 columnas.
- Produces: tabla remota `consultas` con 10 columnas, y `d1/schema.sql` completo (consumido por Task 3 al aplicar el esquema local por primera vez).

- [ ] **Step 1: Escribir la migración**

Crear `d1/migrations/0001_add_campos_consolidados.sql`:

```sql
ALTER TABLE consultas ADD COLUMN nivel_rui TEXT;
ALTER TABLE consultas ADD COLUMN municipio TEXT;
ALTER TABLE consultas ADD COLUMN departamento TEXT;
ALTER TABLE consultas ADD COLUMN nombre TEXT;
ALTER TABLE consultas ADD COLUMN sexo TEXT;
ALTER TABLE consultas ADD COLUMN edad TEXT;
```

- [ ] **Step 2: Aplicar la migración en remoto**

Run: `npx wrangler d1 execute consulta-rui --remote --file=./d1/migrations/0001_add_campos_consolidados.sql`

Expected: `🚣 Executed 6 commands` (o 6 líneas de éxito, una por `ALTER TABLE`) sin errores.

- [ ] **Step 3: Verificar las columnas en remoto**

Run: `npx wrangler d1 execute consulta-rui --remote --command "PRAGMA table_info(consultas)"`

Expected: la lista de columnas incluye las 10: `tipo_documento`, `numero_identificacion`, `conteo`, `fecha_ultima_consulta`, `nivel_rui`, `municipio`, `departamento`, `nombre`, `sexo`, `edad`.

- [ ] **Step 4: Actualizar `d1/schema.sql` al esquema completo**

Reemplazar el contenido completo de `d1/schema.sql` por:

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

Esto es lo que usará Task 3 para crear la base D1 **local** desde cero (con las 10 columnas ya incluidas, sin necesitar su propia migración).

- [ ] **Step 5: Commit**

```bash
git add d1/schema.sql d1/migrations/0001_add_campos_consolidados.sql
git commit -m "feat: add consolidated result fields to D1 schema"
```

---

### Task 3: Scaffold del adaptador de Cloudflare

**Files:**
- Create: `wrangler.jsonc`
- Create: `open-next.config.ts`
- Modify: `next.config.ts`
- Modify: `package.json`
- Generate: `cloudflare-env.d.ts`

**Interfaces:**
- Consumes: `database_id` = `a3270e73-b1cf-429c-ad7b-cfed966651fa` (Task 1), `d1/schema.sql` completo de 10 columnas (Task 2).
- Produces: binding `DB` (D1Database) accesible vía `getCloudflareContext().env.DB`, consumido por Task 4.

- [ ] **Step 1: Instalar dependencias**

Run:
```bash
bun add @opennextjs/cloudflare
bun add -d wrangler@latest
```

Expected: ambos paquetes aparecen en `package.json` (dependencies / devDependencies).

- [ ] **Step 2: Crear `wrangler.jsonc`**

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
      "database_id": "a3270e73-b1cf-429c-ad7b-cfed966651fa"
    }
  ]
}
```

- [ ] **Step 3: Crear `open-next.config.ts`**

```typescript
import { defineCloudflareConfig } from "@opennextjs/cloudflare";

export default defineCloudflareConfig();
```

- [ ] **Step 4: Modificar `next.config.ts`**

Reemplazar el contenido completo por:

```typescript
import type { NextConfig } from "next";
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
};

initOpenNextCloudflareForDev();

export default nextConfig;
```

- [ ] **Step 5: Agregar scripts a `package.json`**

Agregar dentro de `"scripts"` (sin borrar `dev`/`lint` todavía — eso es Task 6):

```json
"preview": "opennextjs-cloudflare build && opennextjs-cloudflare preview",
"deploy": "opennextjs-cloudflare build && opennextjs-cloudflare deploy",
"cf-typegen": "wrangler types --env-interface CloudflareEnv cloudflare-env.d.ts"
```

- [ ] **Step 6: Generar tipos de los bindings**

Run: `bun run cf-typegen`

Expected: se crea `cloudflare-env.d.ts` con la interfaz `CloudflareEnv` que incluye `DB: D1Database`.

- [ ] **Step 7: Aplicar el esquema completo en la base D1 local (para `next dev`)**

Run: `npx wrangler d1 execute consulta-rui --local --file=./d1/schema.sql`

Expected: `🚣 Executed 1 command` sin errores. Esto crea el estado local en `.wrangler/state/v3/d1` con las 10 columnas (usa el `d1/schema.sql` completo que dejó la Task 2, no necesita aplicar la migración por separado).

- [ ] **Step 8: Verificar que `next dev` sigue arrancando**

Run: `bun run dev` (o el comando de dev existente), abrir `http://localhost:3000`.

Expected: la página carga igual que antes (sin cambios visibles todavía, `logConsulta` no existe hasta Task 4).

- [ ] **Step 9: Ignorar el output de OpenNext en git**

Agregar `.open-next` y `.wrangler` a `.gitignore` si no están.

- [ ] **Step 10: Commit**

```bash
git add wrangler.jsonc open-next.config.ts next.config.ts package.json bun.lock cloudflare-env.d.ts .gitignore
git commit -m "feat: scaffold @opennextjs/cloudflare adapter"
```

---

### Task 4: Extractor de campos + helper D1 + integración en el endpoint

**Files:**
- Create: `src/lib/rui-fields.ts`
- Create: `src/lib/d1.ts`
- Modify: `src/app/api/consultar-rui/route.ts:64-83`

**Interfaces:**
- Consumes: binding `env.DB` (Task 3), tipo `CloudflareEnv` de `cloudflare-env.d.ts` (Task 3).
- Produces: `extraerCamposConsolidados(responseText: string): CamposConsolidados` y `logConsulta(tipoDocumento: string, numeroIdentificacion: string, campos: CamposConsolidados): Promise<void>`.

- [ ] **Step 1: Escribir `src/lib/rui-fields.ts`**

```typescript
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

export function extraerCamposConsolidados(responseText: string): CamposConsolidados {
  const fields = extraerPares(responseText);

  return {
    nivelRui: buscarCampo(fields, /grupo|nivel|clasificaci|sisb|rui/i),
    municipio: buscarCampo(fields, /municipio/i),
    departamento: buscarCampo(fields, /departamento/i),
    nombre: buscarCampo(fields, /nombre/i),
    sexo: buscarCampo(fields, /sexo|g.nero/i),
    edad: buscarCampo(fields, /edad/i),
  };
}
```

- [ ] **Step 2: Escribir `src/lib/d1.ts`**

```typescript
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

- [ ] **Step 3: Importar y llamar el extractor + `logConsulta` en el endpoint**

En `src/app/api/consultar-rui/route.ts`, agregar al inicio del archivo:

```typescript
import { logConsulta } from '@/lib/d1';
import { extraerCamposConsolidados } from '@/lib/rui-fields';
```

Reemplazar:

```typescript
    const responseText = await response.text();

    return new NextResponse(responseText, {
      status: response.status,
      headers: {
        'Content-Type': response.headers.get('Content-Type') || 'text/html',
      },
    });
```

por:

```typescript
    const responseText = await response.text();

    if (response.ok) {
      try {
        const campos = extraerCamposConsolidados(responseText);
        await logConsulta(pTipDoc, pNumDoc, campos);
      } catch (logError) {
        console.error('Error registrando consulta en D1:', logError);
      }
    }

    return new NextResponse(responseText, {
      status: response.status,
      headers: {
        'Content-Type': response.headers.get('Content-Type') || 'text/html',
      },
    });
```

- [ ] **Step 4: Verificar que compila**

Run: `npx tsc --noEmit`

Expected: sin errores nuevos en `route.ts`, `d1.ts` o `rui-fields.ts`.

- [ ] **Step 5: Prueba end-to-end en local (`next dev` + binding local)**

Run: `bun run dev`, abrir la app en el navegador, completar el formulario con un documento real y resolver el Turnstile.

Expected: la consulta responde normalmente (sin cambios visibles para el usuario).

- [ ] **Step 6: Confirmar el registro en la D1 local**

Run: `npx wrangler d1 execute consulta-rui --local --command "SELECT * FROM consultas ORDER BY fecha_ultima_consulta DESC LIMIT 5"`

Expected: aparece una fila con el tipo/número de documento usados en el Step 5, `conteo=1`, y al menos algunos de los 6 campos consolidados poblados (según lo que haya devuelto la respuesta real del DNP — no todos necesariamente, es best-effort).

- [ ] **Step 7: Confirmar que el upsert incrementa y conserva los campos**

Repetir el Step 5 con el mismo documento, luego repetir el Step 6.

Expected: la misma fila ahora tiene `conteo=2`, `fecha_ultima_consulta` actualizada, y ningún campo consolidado que antes tenía valor pasó a NULL (verifica la semántica `COALESCE`).

- [ ] **Step 8: Commit**

```bash
git add src/lib/rui-fields.ts src/lib/d1.ts src/app/api/consultar-rui/route.ts
git commit -m "feat: log RUI queries with consolidated fields to D1"
```

---

### Task 5: Build y deploy de verificación en Cloudflare (preview)

**Files:**
- (ninguno nuevo; usa el scaffold de Task 3)

**Interfaces:**
- Consumes: scripts `preview`/`deploy` (Task 3), binding `DB` (Task 3), `logConsulta`/`extraerCamposConsolidados` (Task 4).

- [ ] **Step 1: Build + preview local del Worker**

Run: `bun run preview`

Expected: build de OpenNext termina sin errores y levanta un preview local (Miniflare) en una URL tipo `http://localhost:8787`.

- [ ] **Step 2: Probar el flujo completo en el preview**

Abrir la URL del preview, completar el formulario con un documento real, resolver el Turnstile, confirmar que la respuesta del RUI se muestra igual que en `next dev`.

- [ ] **Step 3: Deploy real a Cloudflare (subdominio `*.workers.dev`, sin tocar DNS de producción)**

Run: `bun run deploy`

Expected: termina con una URL del tipo `https://consulta-rui.<subdomain>.workers.dev`.

- [ ] **Step 4: Probar el flujo completo en la URL de Cloudflare**

Repetir la prueba del Step 2 contra la URL `*.workers.dev`.

- [ ] **Step 5: Confirmar el registro en la D1 remota, con campos consolidados**

Run: `npx wrangler d1 execute consulta-rui --remote --command "SELECT * FROM consultas ORDER BY fecha_ultima_consulta DESC LIMIT 5"`

Expected: aparece la fila correspondiente a la prueba del Step 4, con los campos consolidados que se hayan podido extraer.

- [ ] **Step 6: Reportar al usuario y pedir confirmación explícita para el corte de DNS**

No ejecutar ningún cambio de DNS. Informar la URL `*.workers.dev` verificada y esperar instrucción explícita del usuario para apuntar `consultarui.col0.com` a Cloudflare — eso queda fuera de este plan.

---

### Task 6: Retirar el self-host actual y el código muerto

**Files:**
- Delete: `prisma/schema.prisma`, `src/lib/db.ts`, `Caddyfile`
- Modify: `package.json`, `.env`

**Interfaces:**
- (ninguna — tarea de limpieza, no afecta contratos usados por otras tareas)

- [ ] **Step 1: Confirmar que no quedan referencias antes de borrar**

Run: `grep -rl "@/lib/db\|PrismaClient\|next-auth" src/ 2>/dev/null`

Expected: sin resultados (ya se confirmó en la auditoría del spec, esto es una verificación de seguridad antes de borrar).

- [ ] **Step 2: Borrar Prisma y el cliente de DB**

```bash
git rm -r prisma/
git rm src/lib/db.ts
```

- [ ] **Step 3: Borrar el Caddyfile**

```bash
git rm Caddyfile
```

- [ ] **Step 4: Limpiar `package.json`**

Quitar de `dependencies`: `@prisma/client`, `next-auth`.
Quitar de `devDependencies`/`dependencies` según corresponda: `prisma`.
Quitar de `scripts`: `db:push`, `db:generate`, `db:migrate`, `db:reset`, y los scripts `build`/`start` orientados al self-host (`"build": "next build && cp -r .next/static .next/standalone/.next/ && cp -r public .next/standalone/"` y `"start": "NODE_ENV=production bun .next/standalone/server.js ..."`).

Run: `bun install` después de editar, para regenerar `bun.lock` sin esas dependencias.

- [ ] **Step 5: Quitar `DATABASE_URL` de `.env`**

Eliminar la línea `DATABASE_URL=file:/home/z/my-project/db/custom.db` de `.env`.

- [ ] **Step 6: Verificar que el build de Cloudflare sigue funcionando**

Run: `bun run deploy`

Expected: mismo resultado que en Task 5 (deploy exitoso a `*.workers.dev`), confirmando que quitar Prisma/next-auth/Caddy no rompió nada.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "chore: remove dead Prisma/next-auth deps and retire self-host setup"
```
