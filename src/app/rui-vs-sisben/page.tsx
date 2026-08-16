import type { Metadata } from 'next';
import { SiteShell } from '@/components/site-shell';
import {
  AvisoNoOficial,
  Breadcrumb,
  CtaConsulta,
  EnlacesRelacionados,
} from '@/components/site-blocks';
import { paginasRelacionadas } from '@/lib/site';

const slug = 'rui-vs-sisben';

export const metadata: Metadata = {
  title: 'RUI y Sisbén: qué cambió y qué pasa con los subsidios',
  description:
    'Diferencias entre el RUI y el Sisbén: cómo se calcula cada uno, por qué el RUI no da puntaje y qué ocurre con los subsidios durante la transición de 2026.',
  alternates: { canonical: `/${slug}` },
};

const COMPARACION = [
  {
    criterio: 'Cómo se recoge la información',
    sisben: 'Encuesta presencial en el hogar, solicitada por el ciudadano.',
    rui: 'Cruce automático de bases de datos oficiales, sin encuesta.',
  },
  {
    criterio: 'Resultado que entrega',
    sisben: 'Grupo y subgrupo (A1, B2…), y puntaje numérico hasta 2021.',
    rui: 'Código de grupo y subgrupo más la fecha de corte del cálculo.',
  },
  {
    criterio: 'Actualización',
    sisben: 'Requiere solicitar una nueva encuesta para actualizar los datos.',
    rui: 'Se recalcula de forma periódica con la información reportada.',
  },
  {
    criterio: 'Dónde se consulta',
    sisben: 'Portal del Sisbén del DNP.',
    rui: 'Plataforma Ventanilla Social del DNP.',
  },
];

export default function RuiVsSisben() {
  return (
    <SiteShell>
      <article className="w-full max-w-2xl mx-auto mt-6 sm:mt-10 space-y-12">
        <header>
          <Breadcrumb titulo="RUI y Sisbén" slug={slug} />
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[#e2e8f0] mb-4 leading-tight">
            RUI y Sisbén: qué cambió en 2026
          </h1>
          <p className="text-[#94a3b8] text-sm sm:text-base leading-relaxed">
            Desde el 1 de agosto de 2026, el Registro Universal de Ingresos
            reemplaza al Sisbén como instrumento principal para focalizar el
            gasto social en Colombia. El cambio no es solo de nombre: cambia la
            forma de calcular la clasificación.
          </p>
        </header>

        <section>
          <h2 className="text-xl sm:text-2xl font-bold text-[#e2e8f0] mb-4">
            Diferencias principales
          </h2>
          <div className="overflow-x-auto rounded-lg border border-[#1e293b]">
            <table className="w-full text-left border-collapse min-w-[520px]">
              <thead>
                <tr className="bg-[#111827]">
                  <th className="px-4 py-3 text-xs font-semibold text-[#94a3b8] uppercase tracking-wider">
                    Criterio
                  </th>
                  <th className="px-4 py-3 text-xs font-semibold text-[#94a3b8] uppercase tracking-wider">
                    Sisbén
                  </th>
                  <th className="px-4 py-3 text-xs font-semibold text-[#22d3ee] uppercase tracking-wider">
                    RUI
                  </th>
                </tr>
              </thead>
              <tbody>
                {COMPARACION.map((fila, i) => (
                  <tr
                    key={fila.criterio}
                    className={
                      i < COMPARACION.length - 1
                        ? 'border-b border-[#1e293b]'
                        : ''
                    }
                  >
                    <td className="px-4 py-3 text-xs font-medium text-[#e2e8f0] align-top">
                      {fila.criterio}
                    </td>
                    <td className="px-4 py-3 text-xs text-[#94a3b8] align-top leading-relaxed">
                      {fila.sisben}
                    </td>
                    <td className="px-4 py-3 text-xs text-[#cbd5e1] align-top leading-relaxed">
                      {fila.rui}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section>
          <h2 className="text-xl sm:text-2xl font-bold text-[#e2e8f0] mb-3">
            Por qué el RUI no tiene puntaje
          </h2>
          <p className="text-sm text-[#94a3b8] leading-relaxed">
            Mucha gente busca «el puntaje del RUI» por costumbre del Sisbén, pero
            el nuevo sistema no asigna una calificación numérica. Al estimar
            ingresos a partir de datos administrativos, el resultado se expresa
            directamente como una posición en la escala de grupos y subgrupos.
            Ese código cumple la misma función que cumplía el puntaje: ordenar a
            los hogares para priorizar el acceso a los programas.
          </p>
        </section>

        <section>
          <h2 className="text-xl sm:text-2xl font-bold text-[#e2e8f0] mb-3">
            Qué pasa con los subsidios durante la transición
          </h2>
          <p className="text-sm text-[#94a3b8] leading-relaxed mb-3">
            La transición hacia el RUI está vigente hasta el 31 de octubre de
            2026. Mientras avanza la implementación, el Sisbén sigue siendo una
            de las principales fuentes de información sobre las condiciones de
            los hogares dentro del nuevo esquema.
          </p>
          <p className="text-sm text-[#94a3b8] leading-relaxed">
            El cambio de instrumento no implica por sí mismo la pérdida de un
            beneficio ya asignado: cada programa social define sus propios
            requisitos y sus tiempos de actualización. Si dependes de un
            subsidio, lo pertinente es confirmar tu situación con la entidad que
            lo administra, no asumir un resultado a partir del grupo.
          </p>
        </section>

        <CtaConsulta />
        <EnlacesRelacionados enlaces={paginasRelacionadas(slug)} />
        <AvisoNoOficial />
      </article>
    </SiteShell>
  );
}
