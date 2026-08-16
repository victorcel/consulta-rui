import type { Metadata } from 'next';
import { Badge } from '@/components/ui/badge';
import { SiteShell } from '@/components/site-shell';
import {
  AvisoNoOficial,
  Breadcrumb,
  CtaConsulta,
  EnlacesRelacionados,
} from '@/components/site-blocks';
import { paginasRelacionadas, SITE_URL } from '@/lib/site';
import { INFO_POR_GRUPO, type GrupoRui } from '@/lib/rui-niveles';
import { CONTENIDO_POR_GRUPO } from '@/lib/rui-grupos-contenido';

export const slugDeGrupo = (grupo: GrupoRui) =>
  `grupo-${grupo.toLowerCase()}-rui`;

/** Metadata de la página de un grupo. Cada ruta la reexporta con su letra. */
export function metadataDeGrupo(grupo: GrupoRui): Metadata {
  const info = INFO_POR_GRUPO[grupo];
  return {
    title: `Grupo ${grupo} del RUI: ${info.titulo} y beneficios`,
    description: `Qué significa quedar en el grupo ${grupo} del RUI (${info.titulo.toLowerCase()}), cuántos subgrupos tiene y a qué programas sociales da acceso.`,
    alternates: { canonical: `/${slugDeGrupo(grupo)}` },
  };
}

/**
 * Cuerpo compartido de las cuatro páginas de grupo. El texto que lee el usuario
 * proviene de `INFO_POR_GRUPO` y `CONTENIDO_POR_GRUPO`, distinto en cada grupo;
 * aquí sólo vive la disposición común.
 */
export function PaginaGrupo({ grupo }: { grupo: GrupoRui }) {
  const info = INFO_POR_GRUPO[grupo];
  const contenido = CONTENIDO_POR_GRUPO[grupo];
  const slug = slugDeGrupo(grupo);

  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    '@id': `${SITE_URL}/${slug}#faq`,
    mainEntity: [
      {
        '@type': 'Question',
        name: contenido.duda.pregunta,
        acceptedAnswer: {
          '@type': 'Answer',
          text: contenido.duda.respuesta,
        },
      },
    ],
  };

  return (
    <SiteShell>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <article className="w-full max-w-2xl mx-auto mt-6 sm:mt-10 space-y-12">
        <header>
          <Breadcrumb titulo={`Grupo ${grupo} del RUI`} slug={slug} />
          <div className="flex items-center gap-2 flex-wrap mb-4">
            <Badge
              variant="outline"
              className={`text-sm px-2.5 py-1 ${info.colorClass}`}
            >
              Grupo {grupo}
            </Badge>
            <span className="text-sm text-[#94a3b8]">
              {grupo}1 a {grupo}
              {contenido.subgrupos}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[#e2e8f0] mb-4 leading-tight">
            Grupo {grupo} del RUI: {info.titulo.toLowerCase()}
          </h1>
          <p className="text-[#94a3b8] text-sm sm:text-base leading-relaxed">
            {info.descripcion}
          </p>
        </header>

        <section>
          <h2 className="text-xl sm:text-2xl font-bold text-[#e2e8f0] mb-3">
            Dónde se ubica el grupo {grupo} en la escala
          </h2>
          <p className="text-sm text-[#94a3b8] leading-relaxed">
            {contenido.contexto}
          </p>
        </section>

        <section>
          <h2 className="text-xl sm:text-2xl font-bold text-[#e2e8f0] mb-3">
            Qué implica en la práctica
          </h2>
          <p className="text-sm text-[#94a3b8] leading-relaxed">
            {contenido.implicaciones}
          </p>
        </section>

        <section>
          <h2 className="text-xl sm:text-2xl font-bold text-[#e2e8f0] mb-3">
            Programas a los que suele dar acceso
          </h2>
          <ul className="space-y-2 mb-4">
            {info.beneficios.map((beneficio) => (
              <li
                key={beneficio}
                className="flex items-start gap-2.5 text-sm text-[#94a3b8] leading-relaxed"
              >
                <span className="mt-1.5 w-1 h-1 rounded-full bg-[#06b6d4] shrink-0" />
                {beneficio}
              </li>
            ))}
          </ul>
          <div className="rounded-lg border border-[#1e293b] bg-[#111827]/60 p-4">
            <p className="text-xs text-[#94a3b8] leading-relaxed">
              Información referencial. El RUI clasifica hogares; cada entidad y
              programa social define sus propios requisitos de acceso. Confirma
              tu elegibilidad en el DNP o en la entidad responsable del programa.
            </p>
          </div>
        </section>

        <section>
          <h2 className="text-xl sm:text-2xl font-bold text-[#e2e8f0] mb-4">
            Pregunta frecuente sobre el grupo {grupo}
          </h2>
          <div className="rounded-lg border border-[#1e293b] bg-[#0c1120]/60 p-4">
            <h3 className="text-sm font-semibold text-[#e2e8f0] mb-1.5">
              {contenido.duda.pregunta}
            </h3>
            <p className="text-sm text-[#94a3b8] leading-relaxed">
              {contenido.duda.respuesta}
            </p>
          </div>
        </section>

        <CtaConsulta />
        <EnlacesRelacionados enlaces={paginasRelacionadas(slug)} />
        <AvisoNoOficial />
      </article>
    </SiteShell>
  );
}
