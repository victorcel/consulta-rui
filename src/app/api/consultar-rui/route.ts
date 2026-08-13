import { NextRequest, NextResponse } from 'next/server';
import { logConsulta } from '@/lib/d1';
import { extraerCamposConsolidados } from '@/lib/rui-fields';

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
    const verifyData = await verifyResponse.json();
    return verifyData.success === true;
  } catch (error) {
    console.error('Error verificando token de Turnstile:', error);
    return false;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
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

    const formData = new FormData();
    formData.append('pNumDoc', pNumDoc);
    formData.append('pTipDoc', pTipDoc);

    const response = await fetch(
      'https://ventanillasocial.dnp.gov.co/Home/ObtenerDatosRUI',
      {
        method: 'POST',
        headers: {
          Cookie:
            'KEMP_STICKY=3995726526.1.0.2193729874; __CsrfToken=3c01c891099d4759be9ff45940ee2d87',
        },
        body: formData,
      }
    );

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
