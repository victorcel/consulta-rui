import type { Metadata } from 'next';
import Link from 'next/link';
import { FileQuestion } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SiteShell } from '@/components/site-shell';

export const metadata: Metadata = {
  title: 'Página no encontrada',
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <SiteShell>
      <meta httpEquiv="refresh" content="5;url=/" />
      <div className="w-full max-w-md mx-auto mt-16 sm:mt-24 flex flex-col items-center text-center">
        <div className="flex items-center justify-center w-14 h-14 rounded-xl bg-[#06b6d4]/10 border border-[#06b6d4]/20 mb-5">
          <FileQuestion className="w-7 h-7 text-[#06b6d4]" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-[#e2e8f0] mb-3">
          Página no encontrada
        </h1>
        <p className="text-sm sm:text-base text-[#94a3b8] leading-relaxed mb-8">
          La página que buscas no existe o fue movida. Te llevaremos al
          inicio automáticamente.
        </p>
        <Button asChild size="lg">
          <Link href="/">Volver al inicio</Link>
        </Button>
      </div>
    </SiteShell>
  );
}
