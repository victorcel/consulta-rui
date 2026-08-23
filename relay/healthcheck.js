// Healthcheck del relay: confirma que una consulta real obtiene respuesta
// dentro del tiempo límite. Si falla o expira, sale con código != 0 y
// Docker marca el contenedor "unhealthy" (el sidecar autoheal lo reinicia).

const PORT = process.env.PORT || 3001;
const TIMEOUT_MS = 20000;

const controller = new AbortController();
const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

try {
  const res = await fetch(`http://127.0.0.1:${PORT}/Home/ObtenerDatosRUI`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ pNumDoc: '0', pTipDoc: '0' }).toString(),
    signal: controller.signal,
  });
  await res.text();
  clearTimeout(timer);
  process.exit(0);
} catch (error) {
  clearTimeout(timer);
  console.error('healthcheck falló:', error.message);
  process.exit(1);
}
