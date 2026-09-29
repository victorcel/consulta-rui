import type { Metadata } from 'next';
import Link from 'next/link';
import { SiteShell } from '@/components/site-shell';
import {
  AvisoNoOficial,
  Breadcrumb,
  BotonVentanilla,
  CtaConsulta,
  EnlacesRelacionados,
  FechaActualizacion,
} from '@/components/site-blocks';
import { fechaActualizacion, paginasRelacionadas } from '@/lib/site';

const slug = 'corregir-datos-rui';

export const metadata: Metadata = {
  title: 'Corregir datos del RUI: qué hacer si tu grupo está mal',
  description:
    'Qué hacer si tu grupo o subgrupo en el RUI no corresponde a tu situación real: causas frecuentes del error y cómo solicitar la revisión ante el DNP.',
  alternates: { canonical: `/${slug}` },
};

const CAUSAS = [
  {
    titulo: 'Movimientos bancarios que no son tuyos',
    detalle:
      'Cuentas usadas por terceros para recibir o transferir dinero pueden inflar el ingreso estimado de tu hogar, aunque ese dinero no sea realmente tuyo.',
  },
  {
    titulo: 'Ingresos puntuales o extraordinarios',
    detalle:
      'Una venta, una liquidación laboral o un pago único registrado en el periodo de corte puede elevar temporalmente tu clasificación aunque no refleje tu ingreso habitual.',
  },
  {
    titulo: 'Información desactualizada de alguna entidad',
    detalle:
      'Si cambiaste de empleo, dejaste de recibir un ingreso o tu composición familiar cambió y esa información aún no se refleja en las bases de datos que cruza el RUI.',
  },
  {
    titulo: 'Errores en el documento de identidad o datos personales',
    detalle:
      'Un número de documento mal registrado en alguna entidad puede mezclar tu información con la de otra persona.',
  },
];

const PASOS = [
  'Ingresa a la Ventanilla Social del DNP y consulta tu RUI para confirmar el grupo y subgrupo actuales.',
  'Identifica qué información específica crees que está mal: un ingreso, una cuenta, un dato de tu hogar.',
  'Ubica la opción de solicitud de revisión o actualización de datos dentro de la plataforma, o acude a la oficina del Sisbén/RUI de tu municipio.',
  'Aporta los soportes que respalden tu situación real: certificados laborales, extractos, o los documentos que la entidad solicite.',
  'Haz seguimiento a la solicitud; el recálculo no es inmediato y depende de la actualización de las bases de datos consultadas.',
];

export default function CorregirDatosRui() {
  return (
    <SiteShell>
      <article className="w-full max-w-2xl mx-auto mt-6 sm:mt-10 space-y-12">
        <header>
          <Breadcrumb titulo="Corregir datos del RUI" slug={slug} />
          <FechaActualizacion fecha={fechaActualizacion(slug)} slug={slug} />
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[#e2e8f0] mb-4 leading-tight">
            Corregir datos del RUI: qué hacer si tu grupo no coincide
          </h1>
          <p className="text-[#94a3b8] text-sm sm:text-base leading-relaxed">
            El RUI calcula tu clasificación cruzando bases de datos oficiales,
            no con una encuesta nueva que puedas corregir en el momento. Cuando
            el resultado no representa tu situación real, existe una ruta para
            solicitar la revisión.
          </p>
        </header>

        <section>
          <h2 className="text-xl sm:text-2xl font-bold text-[#e2e8f0] mb-4">
            Causas más frecuentes de un dato incorrecto
          </h2>
          <div className="space-y-4">
            {CAUSAS.map((causa) => (
              <div
                key={causa.titulo}
                className="rounded-lg border border-[#1e293b] bg-[#0c1120]/60 p-4"
              >
                <h3 className="text-sm font-semibold text-[#e2e8f0] mb-1.5">
                  {causa.titulo}
                </h3>
                <p className="text-xs text-[#94a3b8] leading-relaxed">
                  {causa.detalle}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-xl sm:text-2xl font-bold text-[#e2e8f0] mb-4">
            Cómo solicitar la revisión
          </h2>
          <ol className="space-y-3">
            {PASOS.map((paso, index) => (
              <li key={paso} className="flex items-start gap-3 text-sm text-[#94a3b8] leading-relaxed">
                <span className="flex items-center justify-center w-5 h-5 rounded-full bg-[#06b6d4]/10 border border-[#06b6d4]/30 text-[#22d3ee] text-xs font-semibold shrink-0 mt-0.5">
                  {index + 1}
                </span>
                {paso}
              </li>
            ))}
          </ol>
          <BotonVentanilla texto="Solicitar la revisión en la Ventanilla Social" />
        </section>

        <section>
          <h2 className="text-xl sm:text-2xl font-bold text-[#e2e8f0] mb-3">
            Cuánto tarda el recálculo
          </h2>
          <p className="text-sm text-[#94a3b8] leading-relaxed">
            El RUI se actualiza de forma periódica a partir de la información
            que las entidades reportan, no en tiempo real. Por eso una
            corrección puede tardar en reflejarse hasta el siguiente ciclo de
            cálculo. Si el trámite es urgente, consulta directamente en la
            oficina del Sisbén o la Ventanilla Social de tu municipio para
            conocer el tiempo estimado en tu caso.
          </p>
        </section>

        <section>
          <h2 className="text-xl sm:text-2xl font-bold text-[#e2e8f0] mb-3">
            No pagues por este trámite
          </h2>
          <p className="text-sm text-[#94a3b8] leading-relaxed">
            Solicitar la revisión de tus datos en el RUI es gratuito. Desconfía
            de terceros que ofrezcan «acelerar» o «garantizar» un cambio de
            grupo a cambio de dinero: esa gestión no existe en el proceso
            oficial. Revisa también qué significa tu código actual en la{' '}
            <Link
              href="/clasificacion-rui"
              className="text-[#06b6d4] hover:text-[#22d3ee] transition-colors font-medium"
            >
              clasificación del RUI por grupos y subgrupos
            </Link>
            .
          </p>
        </section>

        <CtaConsulta
          titulo="Confirma tu grupo actual antes de pedir la revisión"
          texto="Consulta tu grupo y subgrupo hoy: así sabrás exactamente qué dato quieres corregir y qué código tienes que reclamar."
          boton="Ver mi grupo actual"
        />
        <EnlacesRelacionados enlaces={paginasRelacionadas(slug)} />
        <AvisoNoOficial />
      </article>
    </SiteShell>
  );
}
