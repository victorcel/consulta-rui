import type { Metadata } from 'next';
import Link from 'next/link';
import { SiteShell } from '@/components/site-shell';
import {
  AvisoNoOficial,
  Breadcrumb,
  CtaConsulta,
  EnlacesRelacionados,
  FechaActualizacion,
} from '@/components/site-blocks';
import { fechaActualizacion, paginasRelacionadas } from '@/lib/site';

const slug = 'que-paso-con-mi-puntaje-sisben';

export const metadata: Metadata = {
  title: 'Qué pasó con mi puntaje del Sisbén: por qué ya no aparece',
  description:
    'Por qué el puntaje del Sisbén ya no aparece al consultar tu documento, qué lo reemplazó desde agosto de 2026 y cómo saber tu clasificación actual.',
  alternates: { canonical: `/${slug}` },
};

export default function QuePasoConMiPuntajeSisben() {
  return (
    <SiteShell>
      <article className="w-full max-w-2xl mx-auto mt-6 sm:mt-10 space-y-12">
        <header>
          <Breadcrumb titulo="Qué pasó con mi puntaje del Sisbén" slug={slug} />
          <FechaActualizacion fecha={fechaActualizacion(slug)} slug={slug} />
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[#e2e8f0] mb-4 leading-tight">
            ¿Qué pasó con mi puntaje del Sisbén?
          </h1>
          <p className="text-[#94a3b8] text-sm sm:text-base leading-relaxed">
            Si consultaste tu documento y ya no aparece el puntaje numérico que
            conocías del Sisbén, no es un error. Desde el 1 de agosto de 2026 el
            Registro Universal de Ingresos (RUI) reemplazó ese mecanismo, y su
            resultado se muestra distinto.
          </p>
        </header>

        <section>
          <h2 className="text-xl sm:text-2xl font-bold text-[#e2e8f0] mb-3">
            El puntaje numérico ya no existe
          </h2>
          <p className="text-sm text-[#94a3b8] leading-relaxed">
            El Sisbén IV asignaba un puntaje de 0 a 100 que determinaba el
            grupo de un hogar. El RUI eliminó ese número: ahora la consulta
            devuelve directamente un{' '}
            <strong className="text-[#cbd5e1]">
              código de grupo y subgrupo
            </strong>{' '}
            —por ejemplo B03 o C12— junto con la fecha de corte del cálculo. Si
            buscas «mi puntaje del Sisbén» y no lo encuentras, es porque el
            sistema que lo calculaba ya no está en operación como mecanismo
            principal.
          </p>
        </section>

        <section>
          <h2 className="text-xl sm:text-2xl font-bold text-[#e2e8f0] mb-3">
            Por qué cambió
          </h2>
          <p className="text-sm text-[#94a3b8] leading-relaxed">
            El DNP reemplazó la encuesta presencial del Sisbén por un cálculo
            automático que cruza bases de datos oficiales —DIAN, servicios
            públicos, fondos de pensiones, entidades financieras— para estimar
            los ingresos reales de cada hogar sin depender de una visita ni de
            la información que la persona reporte por su cuenta.
          </p>
        </section>

        <section>
          <h2 className="text-xl sm:text-2xl font-bold text-[#e2e8f0] mb-3">
            ¿Mi grupo anterior del Sisbén sigue siendo válido?
          </h2>
          <p className="text-sm text-[#94a3b8] leading-relaxed">
            Durante la transición, vigente hasta el 31 de octubre de 2026, el
            Sisbén sigue siendo una de las fuentes que alimenta el cálculo del
            RUI, pero el resultado que debes usar para trámites y consultas es
            el que entrega el RUI, no el histórico del Sisbén. Es normal que el
            grupo cambie: el RUI no recalcula el mismo puntaje con otro nombre,
            usa una metodología distinta.
          </p>
        </section>

        <section>
          <h2 className="text-xl sm:text-2xl font-bold text-[#e2e8f0] mb-3">
            Cómo saber tu situación actual
          </h2>
          <p className="text-sm text-[#94a3b8] leading-relaxed mb-4">
            La única forma confiable es consultar el RUI con tu número de
            documento en la Ventanilla Social del DNP. Ahí verás tu grupo,
            subgrupo y la fecha de corte del cálculo, y podrás descargar el
            certificado si lo necesitas para algún trámite.
          </p>
          <ul className="space-y-2">
            {[
              'Consulta tu grupo y subgrupo del RUI con tu documento.',
              'Revisa qué significa ese código en la clasificación por grupos.',
              'Si el resultado no corresponde a tu situación, solicita la revisión de datos.',
            ].map((paso) => (
              <li
                key={paso}
                className="flex items-start gap-2.5 text-sm text-[#94a3b8] leading-relaxed"
              >
                <span className="mt-1.5 w-1 h-1 rounded-full bg-[#06b6d4] shrink-0" />
                {paso}
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h2 className="text-xl sm:text-2xl font-bold text-[#e2e8f0] mb-3">
            Diferencias clave frente al Sisbén
          </h2>
          <p className="text-sm text-[#94a3b8] leading-relaxed">
            Más allá del puntaje, cambió la forma de recolectar la información,
            la frecuencia de actualización y la plataforma de consulta. Puedes
            ver el detalle completo en{' '}
            <Link
              href="/rui-vs-sisben"
              className="text-[#06b6d4] hover:text-[#22d3ee] transition-colors font-medium"
            >
              RUI y Sisbén: qué cambió
            </Link>
            .
          </p>
        </section>

        <CtaConsulta />
        <EnlacesRelacionados enlaces={paginasRelacionadas(slug)} />
        <AvisoNoOficial />
      </article>
    </SiteShell>
  );
}
