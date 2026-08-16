import type { Metadata } from 'next';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { SiteShell } from '@/components/site-shell';
import {
  AvisoNoOficial,
  Breadcrumb,
  CtaConsulta,
  EnlacesRelacionados,
} from '@/components/site-blocks';
import { paginasRelacionadas } from '@/lib/site';
import { INFO_POR_GRUPO, type GrupoRui } from '@/lib/rui-niveles';

const slug = 'clasificacion-rui';

export const metadata: Metadata = {
  title: 'Clasificación del RUI: grupos A, B, C y D y sus subgrupos',
  description:
    'Qué significan los grupos A, B, C y D del RUI, cuántos subgrupos tiene cada uno y cómo se interpreta un código como B03 o C12.',
  alternates: { canonical: `/${slug}` },
};

// Número de subgrupos por grupo, según los rangos que valida la consulta.
const SUBGRUPOS: Record<GrupoRui, number> = { A: 5, B: 7, C: 18, D: 21 };
const GRUPOS: GrupoRui[] = ['A', 'B', 'C', 'D'];

export default function ClasificacionRui() {
  return (
    <SiteShell>
      <article className="w-full max-w-2xl mx-auto mt-6 sm:mt-10 space-y-12">
        <header>
          <Breadcrumb titulo="Grupos y clasificación" slug={slug} />
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[#e2e8f0] mb-4 leading-tight">
            Clasificación del RUI: grupos A, B, C y D
          </h1>
          <p className="text-[#94a3b8] text-sm sm:text-base leading-relaxed">
            El RUI ordena a los hogares en cuatro grupos según su nivel estimado
            de ingresos. Cada grupo se divide además en subgrupos numerados, y la
            consulta devuelve el código completo junto con la fecha de corte.
          </p>
        </header>

        <section>
          <h2 className="text-xl sm:text-2xl font-bold text-[#e2e8f0] mb-3">
            Cómo leer un código del RUI
          </h2>
          <p className="text-sm text-[#94a3b8] leading-relaxed mb-4">
            Un resultado como <strong className="text-[#cbd5e1]">B03</strong> se
            interpreta en dos partes: la letra indica el grupo —el nivel general
            de ingresos del hogar— y el número indica el subgrupo dentro de ese
            grupo. Los subgrupos más bajos corresponden a menores ingresos, por
            lo que suelen tener acceso prioritario frente a los más altos del
            mismo grupo.
          </p>
          <div className="rounded-lg border border-[#1e293b] bg-[#0c1120]/60 p-4">
            <p className="text-xs text-[#94a3b8] leading-relaxed">
              <strong className="text-[#cbd5e1]">Importante:</strong> el RUI no
              asigna un puntaje numérico de 0 a 100 como lo hacía el Sisbén hasta
              2021. Si buscas tu «puntaje del RUI», lo que el sistema devuelve es
              este código de grupo y subgrupo.
            </p>
          </div>
        </section>

        <section>
          <h2 className="text-xl sm:text-2xl font-bold text-[#e2e8f0] mb-4">
            Los cuatro grupos del RUI
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
                    <span className="text-sm font-semibold">{info.titulo}</span>
                    <span className="text-xs text-[#94a3b8]">
                      · {grupo}1 a {grupo}
                      {SUBGRUPOS[grupo]}
                    </span>
                  </h3>
                  <p className="text-xs text-[#cbd5e1] leading-relaxed mb-3">
                    {info.descripcion}
                  </p>
                  <Link
                    href={`/grupo-${grupo.toLowerCase()}-rui`}
                    className="text-xs font-medium text-[#06b6d4] hover:text-[#22d3ee] transition-colors"
                  >
                    Ver detalle del grupo {grupo} →
                  </Link>
                </div>
              );
            })}
          </div>
        </section>

        <section>
          <h2 className="text-xl sm:text-2xl font-bold text-[#e2e8f0] mb-3">
            Cuándo la clasificación no coincide con tu realidad
          </h2>
          <p className="text-sm text-[#94a3b8] leading-relaxed">
            Como el cálculo se hace cruzando bases de datos, puede reflejar
            movimientos que no representan tu situación real: cuentas bancarias
            usadas por terceros, ingresos puntuales o información desactualizada
            de alguna entidad. Si tu clasificación no corresponde con tus
            condiciones, la ruta es solicitar la revisión ante el DNP a través de
            la Ventanilla Social o de la oficina de tu municipio.
          </p>
        </section>

        <CtaConsulta />
        <EnlacesRelacionados enlaces={paginasRelacionadas(slug)} />
        <AvisoNoOficial />
      </article>
    </SiteShell>
  );
}
