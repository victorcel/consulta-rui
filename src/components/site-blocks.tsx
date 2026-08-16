import Link from 'next/link';
import { AlertCircle, ChevronRight, Search } from 'lucide-react';
import { SITE_URL } from '@/lib/site';

/** Miga de pan visible + schema BreadcrumbList para que Google la muestre en el resultado. */
export function Breadcrumb({ titulo, slug }: { titulo: string; slug: string }) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Consultar RUI',
        item: SITE_URL,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: titulo,
        item: `${SITE_URL}/${slug}`,
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <nav
        aria-label="Ruta de navegación"
        className="flex items-center gap-1.5 text-xs text-[#94a3b8] mb-6"
      >
        <Link href="/" className="hover:text-[#22d3ee] transition-colors">
          Consultar RUI
        </Link>
        <ChevronRight className="w-3.5 h-3.5 text-[#475569]" />
        <span className="text-[#cbd5e1]">{titulo}</span>
      </nav>
    </>
  );
}

/** Llamada a la acción que devuelve al formulario de la portada. */
export function CtaConsulta() {
  return (
    <section className="rounded-lg border border-[#06b6d4]/20 bg-[#06b6d4]/5 p-5 text-center">
      <h2 className="text-base font-semibold text-[#e2e8f0] mb-1.5">
        Consulta tu clasificación en el RUI
      </h2>
      <p className="text-sm text-[#94a3b8] leading-relaxed mb-4">
        Ingresa tu número de documento y conoce tu grupo en menos de tres minutos.
        La consulta es gratuita.
      </p>
      <Link
        href="/"
        className="inline-flex items-center justify-center h-11 px-6 rounded-md text-sm font-semibold text-white bg-gradient-to-r from-[#06b6d4] to-[#0891b2] hover:from-[#22d3ee] hover:to-[#06b6d4] shadow-lg shadow-[#06b6d4]/20 hover:shadow-[#06b6d4]/30 transition-all duration-300"
      >
        <Search className="w-4 h-4 mr-2" />
        Consultar RUI
      </Link>
    </section>
  );
}

/** Aviso de sitio no oficial. Obligatorio en todas las páginas por E-E-A-T. */
export function AvisoNoOficial() {
  return (
    <section className="rounded-lg border border-[#1e293b] bg-[#111827]/60 p-4">
      <h2 className="flex items-center gap-2 text-sm font-semibold text-[#e2e8f0] mb-2">
        <AlertCircle className="w-4 h-4 text-[#94a3b8]" />
        Aviso importante
      </h2>
      <p className="text-xs text-[#94a3b8] leading-relaxed">
        Este es un sitio informativo independiente, no es un portal oficial del
        Gobierno de Colombia ni está afiliado al DNP. La consulta del RUI y la
        descarga del certificado son{' '}
        <strong className="text-[#cbd5e1]">completamente gratuitas</strong> y no
        debes pagar a intermediarios. Puedes realizarlas directamente en el
        portal oficial de la Ventanilla Social del DNP:{' '}
        <a
          href="https://ventanillasocial.dnp.gov.co/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-[#06b6d4] hover:text-[#22d3ee] transition-colors font-medium"
        >
          ventanillasocial.dnp.gov.co
        </a>
        .
      </p>
    </section>
  );
}

/** Enlaces internos entre páginas hermanas: reparte autoridad y ayuda al rastreo. */
export function EnlacesRelacionados({
  enlaces,
}: {
  enlaces: { href: string; titulo: string; descripcion: string }[];
}) {
  return (
    <section>
      <h2 className="text-xl sm:text-2xl font-bold text-[#e2e8f0] mb-4">
        Consultas relacionadas
      </h2>
      <div className="grid gap-3 sm:grid-cols-2">
        {enlaces.map((enlace) => (
          <Link
            key={enlace.href}
            href={enlace.href}
            className="rounded-lg border border-[#1e293b] bg-[#0c1120]/60 p-4 hover:border-[#06b6d4]/30 hover:bg-[#0c1120] transition-colors group"
          >
            <span className="block text-sm font-semibold text-[#e2e8f0] mb-1 group-hover:text-[#22d3ee] transition-colors">
              {enlace.titulo}
            </span>
            <span className="block text-xs text-[#94a3b8] leading-relaxed">
              {enlace.descripcion}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
