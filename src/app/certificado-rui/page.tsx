import type { Metadata } from 'next';
import { SiteShell } from '@/components/site-shell';
import {
  AvisoNoOficial,
  Breadcrumb,
  CtaConsulta,
  EnlacesRelacionados,
} from '@/components/site-blocks';
import { paginasRelacionadas } from '@/lib/site';

const slug = 'certificado-rui';

export const metadata: Metadata = {
  title: 'Certificado del RUI: cómo descargarlo en PDF gratis',
  description:
    'Cómo descargar el certificado del Registro Universal de Ingresos (RUI) en PDF, qué información incluye y para qué trámites sirve. Es gratuito.',
  alternates: { canonical: `/${slug}` },
};

const PASOS = [
  'Ingresa al portal oficial de la Ventanilla Social del DNP.',
  'Selecciona la opción «Consulta RUI» en el menú principal.',
  'Elige el tipo de documento y escribe el número de identificación.',
  'Completa la validación de seguridad que solicita la plataforma.',
  'Descarga el certificado en PDF desde el resultado de la consulta.',
];

export default function CertificadoRui() {
  return (
    <SiteShell>
      <article className="w-full max-w-2xl mx-auto mt-6 sm:mt-10 space-y-12">
        <header>
          <Breadcrumb titulo="Certificado del RUI" slug={slug} />
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[#e2e8f0] mb-4 leading-tight">
            Certificado del RUI: cómo descargarlo en PDF
          </h1>
          <p className="text-[#94a3b8] text-sm sm:text-base leading-relaxed">
            El certificado del Registro Universal de Ingresos es el documento que
            acredita la clasificación de tu hogar. Se descarga en PDF desde la
            Ventanilla Social del DNP y{' '}
            <strong className="text-[#cbd5e1]">no tiene ningún costo</strong>.
          </p>
        </header>

        <section>
          <h2 className="text-xl sm:text-2xl font-bold text-[#e2e8f0] mb-3">
            Pasos para descargar el certificado
          </h2>
          <ol className="space-y-3">
            {PASOS.map((paso, i) => (
              <li
                key={paso}
                className="flex gap-3 text-sm text-[#94a3b8] leading-relaxed"
              >
                <span className="flex items-center justify-center w-6 h-6 shrink-0 rounded-full bg-[#06b6d4]/10 border border-[#06b6d4]/20 text-[#22d3ee] text-xs font-semibold">
                  {i + 1}
                </span>
                <span className="pt-0.5">{paso}</span>
              </li>
            ))}
          </ol>
        </section>

        <section>
          <h2 className="text-xl sm:text-2xl font-bold text-[#e2e8f0] mb-3">
            Qué información incluye
          </h2>
          <p className="text-sm text-[#94a3b8] leading-relaxed mb-4">
            El certificado recoge los datos de identificación de la persona
            consultada junto con el resultado de la clasificación:
          </p>
          <ul className="space-y-2">
            {[
              'Tipo y número de documento de identidad.',
              'Grupo y subgrupo asignado (por ejemplo B03 o C12).',
              'Fecha de corte del cálculo de la clasificación.',
            ].map((dato) => (
              <li
                key={dato}
                className="flex items-start gap-2.5 text-sm text-[#94a3b8] leading-relaxed"
              >
                <span className="mt-1.5 w-1 h-1 rounded-full bg-[#06b6d4] shrink-0" />
                {dato}
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h2 className="text-xl sm:text-2xl font-bold text-[#e2e8f0] mb-3">
            Para qué sirve
          </h2>
          <p className="text-sm text-[#94a3b8] leading-relaxed">
            Las entidades que administran programas sociales pueden pedir el
            certificado como soporte de la clasificación del hogar en trámites de
            salud, vivienda, educación o transferencias monetarias. Cada entidad
            define si lo exige y con qué vigencia, así que conviene confirmar el
            requisito directamente con el programa al que estés aplicando.
          </p>
        </section>

        <section>
          <h2 className="text-xl sm:text-2xl font-bold text-[#e2e8f0] mb-3">
            Si el portal no carga
          </h2>
          <p className="text-sm text-[#94a3b8] leading-relaxed">
            La Ventanilla Social puede presentar lentitud e intermitencias por el
            alto volumen de consultas. La recomendación oficial es intentar en
            horas de baja demanda —temprano en la mañana o en la noche— antes de
            concluir que hay un problema con tus datos.
          </p>
        </section>

        <CtaConsulta />
        <EnlacesRelacionados enlaces={paginasRelacionadas(slug)} />
        <AvisoNoOficial />
      </article>
    </SiteShell>
  );
}
