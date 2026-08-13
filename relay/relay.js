// Relay colombiano para Consulta RUI
//
// El sitio del DNP (ventanillasocial.dnp.gov.co) solo responde a IPs
// públicas de Colombia. Este servidor mínimo reenvía la petición al DNP:
//   1. Directo (si el propio servidor tiene IP colombiana).
//   2. Si falla, a través de proxies HTTP públicos de Colombia
//      (lista refrescada desde proxyscrape), todos en paralelo y el
//      primero que responda gana.
//
// Uso:
//   1. Ejecutar en cualquier servidor siempre encendido:
//        node relay.js          # o: bun relay.js
//   2. Exponerlo en HTTPS (Caddy, Nginx, o cloudflared tunnel).
//   3. Configurar el secreto en Cloudflare:
//        wrangler secret put RUI_RELAY_URL
//        # valor: https://tu-dominio/Home/ObtenerDatosRUI
//   4. Desplegar la app: npm run deploy

import { createServer } from 'node:http';
import { connect as netConnect } from 'node:net';
import { connect as tlsConnect } from 'node:tls';

const DNP_HOST = 'ventanillasocial.dnp.gov.co';
const DNP_PORT = 443;
const DNP_PATH = '/Home/ObtenerDatosRUI';
const PORT = process.env.PORT || 3001;
const ATTEMPT_TIMEOUT_MS = 20000;
const PROXY_POOL_URL =
  'https://api.proxyscrape.com/v4/free-proxy-list/get?request=display_proxies&protocol=http&proxy_format=ipport&format=text&country=co&timeout=20000';

const PROXY_SEED = ['186.33.57.213:999', '200.10.28.13:999'];

let proxyPool = [];
let proxyPoolFetchedAt = 0;

async function refreshProxyPool() {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 10000);
  try {
    const res = await fetch(PROXY_POOL_URL, { signal: controller.signal });
    if (!res.ok) return;
    const text = await res.text();
    proxyPool = [
      ...PROXY_SEED,
      ...text
        .split('\n')
        .map((l) => l.trim())
        .filter((l) => /^\d{1,3}(\.\d{1,3}){3}:\d+$/.test(l)),
    ].filter((px, i, arr) => arr.indexOf(px) === i);
    proxyPoolFetchedAt = Date.now();
    console.log(`Pool de proxies colombianos: ${proxyPool.length} proxies`);
  } catch (error) {
    console.error('Error refrescando pool de proxies:', error.message);
  } finally {
    clearTimeout(timer);
  }
}

// Petición HTTPS al DNP a través de un proxy HTTP (CONNECT + TLS).
function requestViaProxy(proxyHost, proxyPort, body, contentType) {
  return new Promise((resolve, reject) => {
    const socket = netConnect({ host: proxyHost, port: Number(proxyPort) });
    let settled = false;

    const timer = setTimeout(() => {
      if (!settled) {
        settled = true;
        socket.destroy();
        reject(new Error('timeout'));
      }
    }, ATTEMPT_TIMEOUT_MS);

    socket.setTimeout(ATTEMPT_TIMEOUT_MS, () => {
      if (!settled) {
        settled = true;
        socket.destroy();
        reject(new Error('proxy timeout'));
      }
    });

    socket.on('error', (err) => {
      if (!settled) {
        settled = true;
        reject(err);
      }
    });

    socket.on('connect', () => {
      socket.write(
        `CONNECT ${DNP_HOST}:${DNP_PORT} HTTP/1.1\r\nHost: ${DNP_HOST}:${DNP_PORT}\r\n\r\n`
      );
    });

    let tlsSocket = null;
    let head = '';
    let inTls = false;

    socket.on('data', (chunk) => {
      if (inTls) return;
      head += chunk.toString('latin1');
      const idx = head.indexOf('\r\n\r\n');
      if (idx === -1) return;
      const statusLine = head.split('\r\n')[0];
      head = '';
      if (!/^HTTP\/1\.[01] 200/.test(statusLine)) {
        settled = true;
        clearTimeout(timer);
        socket.destroy();
        reject(new Error('proxy CONNECT rechazado: ' + statusLine));
        return;
      }
      inTls = true;
      tlsSocket = tlsConnect({
        socket,
        servername: DNP_HOST,
        rejectUnauthorized: true,
      });

      let tlsErr = null;
      const buf = [];
      tlsSocket.on('error', (err) => {
        tlsErr = err;
      });
      tlsSocket.on('data', (data) => {
        buf.push(data);
      });
      tlsSocket.on('end', () => {
        if (!settled) {
          settled = true;
          clearTimeout(timer);
          resolve(Buffer.concat(buf));
        }
      });
      tlsSocket.on('close', () => {
        if (!settled && tlsErr) {
          settled = true;
          clearTimeout(timer);
          reject(tlsErr);
        }
      });

      tlsSocket.on('secureConnect', () => {
        tlsSocket.write(
          `POST ${DNP_PATH} HTTP/1.1\r\n` +
            `Host: ${DNP_HOST}\r\n` +
            `Content-Type: ${contentType}\r\n` +
            `Content-Length: ${body.length}\r\n` +
            'Connection: close\r\n\r\n' +
            body
        );
      });
    });
  });
}

// Devuelve el texto de la respuesta del servidor.
function completarRespuesta(firstChunk) {
  return new Promise((resolve, reject) => {
    if (firstChunk && firstChunk.length > 0) {
      const raw = Buffer.from(firstChunk).toString('utf8');
      const split = raw.indexOf('\r\n\r\n');
      if (split === -1) {
        reject(new Error('respuesta sin cabeceras HTTP'));
        return;
      }
      const headerBlock = raw.slice(0, split);
      const status = Number(headerBlock.split(' ')[1] || 502);
      const contentType =
        headerBlock
          .split('\r\n')
          .find((l) => /^content-type:/i.test(l))
          ?.split(':')[1]
          ?.trim() || 'application/json; charset=utf-8';
      resolve({
        status,
        contentType,
        body: raw.slice(split + 4),
      });
    } else {
      reject(new Error('respuesta vacía'));
    }
  });
}

async function consultarDNP(body, contentType) {
  const skipDirect = process.env.RELAY_SKIP_DIRECT === '1';
  const directo = skipDirect
    ? Promise.reject(new Error('directo desactivado'))
    : fetch(`https://${DNP_HOST}${DNP_PATH}`, {
        method: 'POST',
        headers: { 'Content-Type': contentType },
        body,
        signal: AbortSignal.timeout(ATTEMPT_TIMEOUT_MS),
      })
        .then(async (r) => {
          const t = await r.text();
          return { ok: true, status: r.status, contentType: r.headers.get('content-type'), body: t };
        })
        .catch(() => null);

  if (Date.now() - proxyPoolFetchedAt > 5 * 60 * 1000 || proxyPool.length === 0) {
    await refreshProxyPool();
  }
  const pool = proxyPool.slice(0, 16);

  const viaProxy = pool.map((px) => {
    const [host, port] = px.split(':');
    return requestViaProxy(host, port, body, contentType)
      .then(completarRespuesta)
      .then((r) => ({ ok: true, ...r }))
      .catch(() => null);
  });

  const resultados = await Promise.any([directo, ...viaProxy]).catch(
    () => null
  );
  return (
    resultados || { ok: false, status: 502, contentType: 'application/json', body: '{"error":"Ningún proxy colombiano respondió"}' }
  );
}

const server = createServer(async (req, res) => {
  if (req.method !== 'POST' || req.url !== DNP_PATH) {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not found' }));
    return;
  }

  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const body = Buffer.concat(chunks);
  const contentType = req.headers['content-type'] || 'application/x-www-form-urlencoded';

  try {
    const r = await consultarDNP(body, contentType);
    res.writeHead(r.status, {
      'Content-Type': r.contentType || 'text/html',
      'Cache-Control': 'no-store',
    });
    res.end(r.body);
  } catch (error) {
    res.writeHead(502, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Error en relay: ' + error.message }));
  }
});

server.listen(PORT, () => {
  console.log(`Relay RUI escuchando en el puerto ${PORT}`);
  refreshProxyPool();
});