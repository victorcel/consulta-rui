import type { Metadata } from 'next';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { SiteShell } from '@/components/site-shell';
import {
  AvisoNoOficial,
  Breadcrumb,
  CtaConsulta,
  EnlacesRelacionados,
  FechaActualizacion,
} from '@/components/site-blocks';
import { fechaActualizacion, paginasRelacionadas } from '@/lib/site';
import { INFO_POR_GRUPO, type GrupoRui } from '@/lib/rui-niveles';

const slug = 'subsidios-rui';
const GRUPOS: GrupoRui[] = ['A', 'B', 'C', 'D'];

export const metadata: Metadata = {
  title: 'Subsidios según tu grupo del RUI: A, B, C y D',
  description:
    'Qué subsidios y programas sociales corresponden a cada grupo del RUI (A, B, C y D) y cómo cambia el acceso entre subgrupos como C1 y C18.',
  alternates: { canonical: `/${slug}` },
};

const PROGRAMAS: {
  nombre: string;
  detalle: string;
  fuente?: { href: string; texto: string };
}[] = [
  {
    nombre: 'Régimen subsidiado de salud',
    detalle:
      'Los grupos A y B suelen acceder sin costo. En el grupo C el acceso normalmente implica copagos que aumentan a medida que sube el subgrupo. El grupo D se vincula mediante aporte solidario con copago.',
  },
  {
    nombre: 'Renta Ciudadana',
    detalle:
      'Prosperidad Social la dirige a hogares en pobreza extrema, pobreza y vulnerabilidad, con prioridad para los que tienen personas con discapacidad, niños pequeños o adolescentes. La asigna la entidad: puedes consultar si tu hogar es beneficiario en su portal.',
    fuente: { href: 'https://prosperidadsocial.gov.co/sgpp/transferencias/renta-ciudadana/', texto: 'Renta Ciudadana en Prosperidad Social' },
  },
  {
    nombre: 'Colombia Mayor',
    detalle:
      'Según Prosperidad Social atiende los grupos A y B y el grupo C solo hasta el subgrupo C1 (clasificación Sisbén IV). Además exige tener al menos 54 años las mujeres y 59 los hombres, y no recibir pensión. La inscripción se hace en la alcaldía con la cédula, y los cupos se asignan por orden de prioridad.',
    fuente: { href: 'https://prosperidadsocial.gov.co/colombia-mayor/', texto: 'Colombia Mayor en Prosperidad Social' },
  },
  {
    nombre: 'Subsidio de vivienda (Mi Casa Ya)',
    detalle:
      'Según Minvivienda, el subsidio a la cuota inicial cubre de A1 a D20: 30 SMMLV de A1 a C8 y 20 SMMLV de C9 a D20. Exige además un crédito hipotecario o leasing aprobado y no tener vivienda propia. Los cupos son limitados.',
    fuente: { href: 'https://www.minvivienda.gov.co/viceministerio-de-vivienda/mi-casa-ya/subsidio-familiar-de-vivienda-nueva-0', texto: 'Mi Casa Ya en Minvivienda' },
  },
  {
    nombre: 'Renta Joven y apoyos educativos (ICETEX, matrícula cero)',
    detalle:
      'Renta Joven exige estar en el Sisbén vigente, o en el instrumento de focalización que lo reemplace, con clasificación en pobreza extrema, pobreza o vulnerabilidad; los cortes exactos están en su manual operativo. Otros apoyos, como ciertas líneas de Generación E, no dependen solo del grupo sino también del puntaje académico.',
    fuente: { href: 'https://prosperidadsocial.gov.co/sgpp/transferencias/renta-joven/', texto: 'Renta Joven en Prosperidad Social' },
  },
  {
    nombre: 'Devolución del IVA',
    detalle:
      'Es un programa de Prosperidad Social con criterios propios de focalización: no depende solo del grupo del RUI. Confirma en su portal si tu hogar es beneficiario.',
    fuente: { href: 'https://prosperidadsocial.gov.co/', texto: 'Portal de Prosperidad Social' },
  },
];

export default function SubsidiosRui() {
  return (
    <SiteShell>
      <article className="w-full max-w-2xl mx-auto mt-6 sm:mt-10 space-y-12">
        <header>
          <Breadcrumb titulo="Subsidios según tu grupo" slug={slug} />
          <FechaActualizacion fecha={fechaActualizacion(slug)} slug={slug} />
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[#e2e8f0] mb-4 leading-tight">
            Subsidios según tu grupo del RUI
          </h1>
          <p className="text-[#94a3b8] text-sm sm:text-base leading-relaxed">
            El RUI no entrega subsidios: clasifica hogares, y cada programa
            social define sus propios requisitos de acceso sobre esa
            clasificación. Aquí tienes una guía orientativa de qué programas
            suelen priorizar cada grupo y cómo cambia el acceso entre
            subgrupos.
          </p>
        </header>

        <CtaConsulta
          titulo="Primero, conoce tu grupo"
          texto="Los subsidios dependen de tu grupo y subgrupo. Consúltalos en un momento y luego revisa qué programas te corresponden."
          boton="Consultar mi grupo"
        />

        <section>
          <div className="rounded-lg border border-[#1e293b] bg-[#111827]/60 p-4">
            <p className="text-xs text-[#94a3b8] leading-relaxed">
              <strong className="text-[#cbd5e1]">Importante:</strong> estar en
              un grupo determinado no garantiza recibir un beneficio concreto.
              Cada entidad revisa además edad, composición del hogar, municipio
              y disponibilidad presupuestal. Los cortes por subgrupo pueden
              cambiar de un periodo a otro. Los cortes oficiales publicados hoy
              siguen referidos al Sisbén IV y las entidades pueden ajustarlos
              durante la transición al RUI; confirma siempre en la entidad
              responsable del programa.
            </p>
          </div>
        </section>

        <section>
          <h2 className="text-xl sm:text-2xl font-bold text-[#e2e8f0] mb-4">
            Principales programas y qué grupos suelen priorizar
          </h2>
          <div className="space-y-4">
            {PROGRAMAS.map((programa) => (
              <div
                key={programa.nombre}
                className="rounded-lg border border-[#1e293b] bg-[#0c1120]/60 p-4"
              >
                <h3 className="text-sm font-semibold text-[#e2e8f0] mb-1.5">
                  {programa.nombre}
                </h3>
                <p className="text-xs text-[#94a3b8] leading-relaxed">
                  {programa.detalle}
                </p>
                {programa.fuente && (
                  <a
                    href={programa.fuente.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block mt-2 text-xs font-medium text-[#06b6d4] hover:text-[#22d3ee] transition-colors"
                  >
                    {programa.fuente.texto} →
                  </a>
                )}
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-xl sm:text-2xl font-bold text-[#e2e8f0] mb-4">
            Resumen por grupo
          </h2>
          <div className="space-y-4">
            {GRUPOS.map((grupo) => {
              const info = INFO_POR_GRUPO[grupo];
              return (
                <div
                  key={grupo}
                  className={`rounded-lg border bg-gradient-to-br p-4 ${info.colorClass}`}
                >
                  <h3 className="flex items-center gap-2 flex-wrap mb-2">
                    <Badge
                      variant="outline"
                      className="border-current text-current text-sm px-2.5 py-1"
                    >
                      Grupo {grupo}
                    </Badge>
                    <span className="text-sm font-semibold">
                      {info.titulo}
                    </span>
                  </h3>
                  <ul className="space-y-1.5 mb-3">
                    {info.beneficios.slice(0, 3).map((beneficio) => (
                      <li
                        key={beneficio}
                        className="flex items-start gap-2 text-xs text-[#cbd5e1] leading-relaxed"
                      >
                        <span className="mt-1 w-1 h-1 rounded-full bg-current shrink-0" />
                        {beneficio}
                      </li>
                    ))}
                  </ul>
                  <Link
                    href={`/grupo-${grupo.toLowerCase()}-rui`}
                    className="text-xs font-medium text-[#06b6d4] hover:text-[#22d3ee] transition-colors"
                  >
                    Ver todos los beneficios del grupo {grupo} →
                  </Link>
                </div>
              );
            })}
          </div>
        </section>

        <section>
          <h2 className="text-xl sm:text-2xl font-bold text-[#e2e8f0] mb-3">
            Por qué el subgrupo importa tanto como el grupo
          </h2>
          <p className="text-sm text-[#94a3b8] leading-relaxed">
            Dentro de un mismo grupo, el acceso a un programa puede variar de
            forma notable según el subgrupo. Es el caso más visible en el
            grupo C: alguien en C1 suele conservar buena parte de los
            beneficios del grupo B, mientras que alguien en C18 tiene un
            acceso mucho más limitado, cercano al del grupo D. Si tienes dudas
            sobre qué significa tu código completo, revisa la{' '}
            <Link
              href="/clasificacion-rui"
              className="text-[#06b6d4] hover:text-[#22d3ee] transition-colors font-medium"
            >
              clasificación del RUI por grupos y subgrupos
            </Link>
            .
          </p>
        </section>

        <EnlacesRelacionados enlaces={paginasRelacionadas(slug)} />
        <AvisoNoOficial />
      </article>
    </SiteShell>
  );
}
