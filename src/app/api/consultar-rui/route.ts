import { NextRequest, NextResponse } from 'next/server';
import { logConsulta } from '@/lib/d1';
import { extraerCamposConsolidados } from '@/lib/rui-fields';

const DNP_URL = 'https://ventanillasocial.dnp.gov.co/Home/ObtenerDatosRUI';
const DIRECT_TIMEOUT_MS = 10000;
const RELAY_TIMEOUT_MS = 18000;

async function verifyTurnstileToken(
  token: string,
  remoteIp: string | null
): Promise<boolean> {
  const secretKey = process.env.TURNSTILE_SECRET_KEY;
  if (!secretKey) {
    console.error('TURNSTILE_SECRET_KEY no está configurada');
    return false;
  }

  const verifyForm = new FormData();
  verifyForm.append('secret', secretKey);
  verifyForm.append('response', token);
  if (remoteIp) verifyForm.append('remoteip', remoteIp);

  try {
    const verifyResponse = await fetch(
      'https://challenges.cloudflare.com/turnstile/v0/siteverify',
      { method: 'POST', body: verifyForm }
    );
    const verifyData = (await verifyResponse.json()) as { success?: boolean };
    return verifyData.success === true;
  } catch (error) {
    console.error('Error verificando token de Turnstile:', error);
    return false;
  }
}

function crearBodyUrlencoded(pNumDoc: string, pTipDoc: string): string {
  return new URLSearchParams({ pNumDoc, pTipDoc }).toString();
}

function consultarDNP(body: string): Promise<Response> {
  return fetch(DNP_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
    signal: AbortSignal.timeout(DIRECT_TIMEOUT_MS),
  });
}

async function consultarViaRelay(
  relayUrl: string,
  body: string
): Promise<Response> {
  return fetch(relayUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
    signal: AbortSignal.timeout(RELAY_TIMEOUT_MS),
  });
}

async function consultarConFallback(body: string): Promise<Response> {
  const relayUrl = process.env.RUI_RELAY_URL;
  let directError: unknown = null;

  try {
    return await consultarDNP(body);
  } catch (error) {
    directError = error;
    console.error('DNP directo falló:', error);
  }

  if (!relayUrl) {
    throw directError;
  }

  try {
    return await consultarViaRelay(relayUrl, body);
  } catch (error) {
    console.error('Relay falló:', error);
    throw error;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      pNumDoc?: string;
      pTipDoc?: string;
      turnstileToken?: string;
    };
    const { pNumDoc, pTipDoc, turnstileToken } = body;

    if (!pNumDoc || !pTipDoc) {
      return NextResponse.json(
        { error: 'Se requieren pNumDoc y pTipDoc' },
        { status: 400 }
      );
    }

    if (!turnstileToken) {
      return NextResponse.json(
        { error: 'Se requiere verificación de seguridad' },
        { status: 400 }
      );
    }

    const remoteIp = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || null;
    const isHuman = await verifyTurnstileToken(turnstileToken, remoteIp);

    if (!isHuman) {
      return NextResponse.json(
        { error: 'Verificación de seguridad fallida. Intenta de nuevo.' },
        { status: 400 }
      );
    }

    const queryBody = crearBodyUrlencoded(pNumDoc, pTipDoc);

    let response: Response;
    try {
      response = await consultarConFallback(queryBody);
    } catch (error) {
      console.error('Error consultando el DNP:', error);
      return NextResponse.json(
        {
          error:
            'El servicio del DNP no respondió. Este servicio solo está disponible desde IPs públicas de Colombia. Verifica tu conexión e intenta de nuevo.',
        },
        { status: 502 }
      );
    }

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
  } catch (error) {
    console.error('Error proxying RUI request:', error);
    return NextResponse.json(
      { error: 'Error al consultar el servicio RUI. Intente nuevamente.' },
      { status: 500 }
    );
  }
}