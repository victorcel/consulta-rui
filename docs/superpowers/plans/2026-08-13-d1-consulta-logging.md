# Registro de consultas RUI en Cloudflare D1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Cada vez que `/api/consultar-rui` responda exitosamente, guardar/incrementar un contador por (tipo de documento, número de identificación) en una base Cloudflare D1, con la fecha de la última consulta.

**Architecture:** Base D1 remota `consulta-rui` con una sola tabla `consultas` (upsert por clave compuesta). El servidor Next.js (proceso Node standalone, no Cloudflare Worker) habla con D1 vía la API REST de Cloudflare (`fetch` + API Token), a través de un helper en `src/lib/d1.ts`. El endpoint existente `src/app/api/consultar-rui/route.ts` llama a ese helper después de un fetch exitoso al DNP, sin bloquear ni romper la respuesta al usuario si D1 falla.

**Tech Stack:** Next.js (App Router) API routes, Cloudflare D1 (REST API), Wrangler CLI (ya autenticado con `col.zero.dev@gmail.com`).

## Global Constraints

- El proyecto no tiene test runner instalado (sin jest/vitest en `package.json`); la verificación es manual (wrangler + curl/dev server), no se agrega infraestructura de testing nueva.
- Las variables de entorno se agregan directamente a `.env` local (sin dashboard de despliegue), siguiendo el patrón existente (`DATABASE_URL`, `TURNSTILE_SECRET_KEY`).
- No modificar el hosting actual (standalone Node + Caddy). El binding nativo de D1 queda fuera de alcance.
- El registro en D1 solo ocurre cuando el fetch a DNP responde con status 2xx (`response.ok`).
- Un fallo al escribir en D1 nunca debe cambiar la respuesta HTTP devuelta al cliente.

---

## File Structure

- `d1/schema.sql` (nuevo) — definición de la tabla `consultas`.
- `.env` (modificado) — nuevas variables `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_D1_DATABASE_ID`, `CLOUDFLARE_API_TOKEN`.
- `src/lib/d1.ts` (nuevo) — `d1Query()` (llamada REST genérica) y `logConsulta()` (upsert del contador).
- `src/app/api/consultar-rui/route.ts` (modificado) — llama a `logConsulta()` tras una respuesta exitosa del DNP.

---

### Task 1: Aprovisionar la base de datos D1

**Files:**
- Create: `d1/schema.sql`
- Modify: `.env`

**Interfaces:**
- Produces: tabla D1 `consultas(tipo_documento TEXT, numero_identificacion TEXT, conteo INTEGER, fecha_ultima_consulta TEXT, PRIMARY KEY(tipo_documento, numero_identificacion))`, y las env vars `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_D1_DATABASE_ID`, `CLOUDFLARE_API_TOKEN` que consume Task 2.

- [ ] **Step 1: Crear la base de datos D1**

Run: `npx wrangler d1 create consulta-rui`

Expected: output con un bloque TOML que incluye `database_id = "<uuid>"`. Copiar ese `database_id`.

- [ ] **Step 2: Escribir el esquema**

Crear `d1/schema.sql`:

```sql
CREATE TABLE IF NOT EXISTS consultas (
  tipo_documento TEXT NOT NULL,
  numero_identificacion TEXT NOT NULL,
  conteo INTEGER NOT NULL DEFAULT 1,
  fecha_ultima_consulta TEXT NOT NULL,
  PRIMARY KEY (tipo_documento, numero_identificacion)
);
```

- [ ] **Step 3: Aplicar el esquema a la base remota**

Run: `npx wrangler d1 execute consulta-rui --remote --file=./d1/schema.sql`

Expected: `🚣 Executed 1 command` sin errores.

- [ ] **Step 4: Verificar que la tabla existe**

Run: `npx wrangler d1 execute consulta-rui --remote --command "SELECT name FROM sqlite_master WHERE type='table'"`

Expected: la fila `consultas` aparece en el resultado.

- [ ] **Step 5: Crear el API Token de Cloudflare (acción manual)**

Este paso no se puede hacer por CLI: ir a https://dash.cloudflare.com/profile/api-tokens → "Create Token" → usar el template "Edit Cloudflare Workers" o uno custom con permiso **Account → D1 → Edit** sobre la cuenta `col.zero.dev@gmail.com` (Account ID `d4776e961c889efcab9b37924bf3f157`). Copiar el token generado (solo se muestra una vez).

- [ ] **Step 6: Agregar las variables a `.env`**

Agregar al final de `.env` (usando el `database_id` del Step 1 y el token del Step 5):

```
CLOUDFLARE_ACCOUNT_ID=d4776e961c889efcab9b37924bf3f157
CLOUDFLARE_D1_DATABASE_ID=<database_id del Step 1>
CLOUDFLARE_API_TOKEN=<token del Step 5>
```

No commitear `.env` (ya está en `.gitignore`).

- [ ] **Step 7: Commit del esquema**

```bash
git add d1/schema.sql
git commit -m "feat: add D1 schema for consulta logging"
```

(No se agrega `.env` al commit — está gitignored.)

---

### Task 2: Helper de acceso a D1

**Files:**
- Create: `src/lib/d1.ts`

**Interfaces:**
- Consumes: env vars `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_D1_DATABASE_ID`, `CLOUDFLARE_API_TOKEN` (Task 1).
- Produces: `logConsulta(tipoDocumento: string, numeroIdentificacion: string): Promise<void>` — usado por Task 3.

- [ ] **Step 1: Escribir `src/lib/d1.ts`**

```typescript
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

  const data = (await response.json()) as { result?: D1QueryResult[]; errors?: { message: string }[] };

  if (!response.ok || data.errors?.length) {
    const message = data.errors?.map((e) => e.message).join('; ') || `HTTP ${response.status}`;
    throw new Error(`Error consultando D1: ${message}`);
  }
}

export async function logConsulta(tipoDocumento: string, numeroIdentificacion: string): Promise<void> {
  const fechaUltimaConsulta = new Date().toISOString();

  await d1Query(
    `INSERT INTO consultas (tipo_documento, numero_identificacion, conteo, fecha_ultima_consulta)
     VALUES (?, ?, 1, ?)
     ON CONFLICT(tipo_documento, numero_identificacion)
     DO UPDATE SET conteo = conteo + 1, fecha_ultima_consulta = excluded.fecha_ultima_consulta;`,
    [tipoDocumento, numeroIdentificacion, fechaUltimaConsulta]
  );
}
```

- [ ] **Step 2: Verificar manualmente con un script temporal**

Crear un archivo temporal `/tmp/test-d1.mjs` (no forma parte del repo):

```javascript
import { logConsulta } from '../../Users/victorelias/Documents/Node/consulta-rui/src/lib/d1.ts';
```

En vez de lidiar con imports TS desde un script suelto, verificar con `bun`:

Run:
```bash
cd /Users/victorelias/Documents/Node/consulta-rui
bun -e "
import { logConsulta } from './src/lib/d1.ts';
await logConsulta('TEST', '000000000');
console.log('ok');
"
```

Expected: imprime `ok` sin errores.

- [ ] **Step 3: Confirmar el registro en D1**

Run: `npx wrangler d1 execute consulta-rui --remote --command "SELECT * FROM consultas WHERE numero_identificacion='000000000'"`

Expected: una fila con `tipo_documento='TEST'`, `conteo=1`.

- [ ] **Step 4: Confirmar que el upsert incrementa**

Repetir el Step 2 (correr el mismo `bun -e` de nuevo), luego repetir el Step 3.

Expected: la misma fila ahora tiene `conteo=2` y `fecha_ultima_consulta` actualizada.

- [ ] **Step 5: Limpiar el dato de prueba**

Run: `npx wrangler d1 execute consulta-rui --remote --command "DELETE FROM consultas WHERE numero_identificacion='000000000'"`

- [ ] **Step 6: Commit**

```bash
git add src/lib/d1.ts
git commit -m "feat: add D1 client helper for consulta logging"
```

---

### Task 3: Integrar el logging en el endpoint de consulta

**Files:**
- Modify: `src/app/api/consultar-rui/route.ts:64-83`

**Interfaces:**
- Consumes: `logConsulta(tipoDocumento: string, numeroIdentificacion: string): Promise<void>` (Task 2).

- [ ] **Step 1: Importar `logConsulta`**

En `src/app/api/consultar-rui/route.ts`, agregar al inicio del archivo:

```typescript
import { logConsulta } from '@/lib/d1';
```

- [ ] **Step 2: Llamar a `logConsulta` tras una respuesta exitosa**

Reemplazar este bloque:

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
        await logConsulta(pTipDoc, pNumDoc);
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

- [ ] **Step 3: Verificar que compila**

Run: `npx tsc --noEmit`

Expected: sin errores nuevos relacionados a `route.ts` o `d1.ts`.

- [ ] **Step 4: Prueba end-to-end manual**

Run: `bun run dev` (o revisar si ya está corriendo en `dev.log`), abrir la app en el navegador, completar el formulario con un documento real y resolver el Turnstile.

Expected: la consulta responde normalmente (sin cambios visibles para el usuario).

- [ ] **Step 5: Confirmar el registro real en D1**

Run: `npx wrangler d1 execute consulta-rui --remote --command "SELECT * FROM consultas ORDER BY fecha_ultima_consulta DESC LIMIT 5"`

Expected: aparece una fila con el tipo/número de documento usados en el Step 4, `conteo=1`.

- [ ] **Step 6: Commit**

```bash
git add src/app/api/consultar-rui/route.ts
git commit -m "feat: log RUI queries to Cloudflare D1"
```
