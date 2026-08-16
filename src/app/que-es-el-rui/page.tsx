import type { Metadata } from 'next';
import { SiteShell } from '@/components/site-shell';
import {
  AvisoNoOficial,
  Breadcrumb,
  CtaConsulta,
  EnlacesRelacionados,
} from '@/components/site-blocks';
import { paginasRelacionadas } from '@/lib/site';

const slug = 'que-es-el-rui';

export const metadata: Metadata = {
  title: 'Qué es el RUI: Registro Universal de Ingresos en Colombia',
  description:
    'Qué es el RUI (Registro Universal de Ingresos), el instrumento del DNP que desde agosto de 2026 reemplaza al Sisbén: cómo funciona, qué datos usa y para qué sirve.',
  alternates: { canonical: `/${slug}` },
};

export default function QueEsElRui() {
  return (
    <SiteShell>
      <article className="w-full max-w-2xl mx-auto mt-6 sm:mt-10 space-y-12">
        <header>
          <Breadcrumb titulo="Qué es el RUI" slug={slug} />
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[#e2e8f0] mb-4 leading-tight">
            ¿Qué es el RUI, el Registro Universal de Ingresos?
          </h1>
          <p className="text-[#94a3b8] text-sm sm:text-base leading-relaxed">
            El RUI es el instrumento con el que el Estado colombiano estima los
            ingresos de cada hogar y decide quién accede a los programas
            sociales. Entró en operación el 1 de agosto de 2026 y reemplaza al
            Sisbén como mecanismo principal de focalización del gasto social.
          </p>
        </header>

        <section>
          <h2 className="text-xl sm:text-2xl font-bold text-[#e2e8f0] mb-3">
            Quién lo administra
          </h2>
          <p className="text-sm text-[#94a3b8] leading-relaxed">
            El RUI está a cargo del{' '}
            <strong className="text-[#cbd5e1]">
              Departamento Nacional de Planeación (DNP)
            </strong>
            , y se consulta a través de la plataforma Ventanilla Social. Su base
            es el Registro Social de Hogares (RSH), que articula información del
            Sisbén con la de otras fuentes oficiales para determinar la
            clasificación socioeconómica de cada hogar.
          </p>
        </section>

        <section>
          <h2 className="text-xl sm:text-2xl font-bold text-[#e2e8f0] mb-3">
            Cómo calcula los ingresos de un hogar
          </h2>
          <p className="text-sm text-[#94a3b8] leading-relaxed mb-4">
            A diferencia del Sisbén, el RUI no depende de encuestas presenciales.
            Funciona cruzando bases de datos oficiales para estimar la capacidad
            económica real del núcleo familiar. Entre las fuentes que el DNP ha
            mencionado están:
          </p>
          <ul className="space-y-2">
            {[
              'La DIAN, con declaraciones de renta e información tributaria.',
              'Empresas de servicios públicos domiciliarios.',
              'Fondos de pensiones y cesantías.',
              'Entidades bancarias y del sistema financiero.',
            ].map((fuente) => (
              <li
                key={fuente}
                className="flex items-start gap-2.5 text-sm text-[#94a3b8] leading-relaxed"
              >
                <span className="mt-1.5 w-1 h-1 rounded-full bg-[#06b6d4] shrink-0" />
                {fuente}
              </li>
            ))}
          </ul>
          <p className="text-sm text-[#94a3b8] leading-relaxed mt-4">
            Por eso la clasificación se actualiza de forma periódica sin que
            tengas que solicitar una visita ni llenar formularios: el cálculo se
            rehace a partir de la información que las entidades ya reportan.
          </p>
        </section>

        <section>
          <h2 className="text-xl sm:text-2xl font-bold text-[#e2e8f0] mb-3">
            Para qué sirve el RUI
          </h2>
          <p className="text-sm text-[#94a3b8] leading-relaxed">
            El RUI ordena a los hogares en grupos según su nivel de ingresos para
            que los programas sociales puedan priorizar a quienes más lo
            necesitan. Es importante entender su alcance:{' '}
            <strong className="text-[#cbd5e1]">
              el RUI no entrega subsidios
            </strong>
            . Clasifica hogares, y cada programa —salud, vivienda, transferencias
            monetarias, educación— define sus propios requisitos de acceso sobre
            esa clasificación. Estar en un grupo determinado no garantiza recibir
            un beneficio concreto.
          </p>
        </section>

        <section>
          <h2 className="text-xl sm:text-2xl font-bold text-[#e2e8f0] mb-3">
            Qué devuelve la consulta
          </h2>
          <p className="text-sm text-[#94a3b8] leading-relaxed">
            La consulta del RUI devuelve un código de grupo y subgrupo —por
            ejemplo B03 o C12— junto con la fecha de corte del cálculo. No
            entrega un puntaje numérico como el que asignaba el Sisbén hasta
            2021. Desde la misma plataforma puedes descargar el certificado en
            PDF.
          </p>
        </section>

        <CtaConsulta />
        <EnlacesRelacionados enlaces={paginasRelacionadas(slug)} />
        <AvisoNoOficial />
      </article>
    </SiteShell>
  );
}
