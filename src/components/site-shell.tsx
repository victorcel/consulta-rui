import Link from 'next/link';
import { Shield } from 'lucide-react';

/**
 * Marco visual compartido por las páginas de contenido (fondo, header y footer).
 * Reproduce el mismo tratamiento de la portada; la portada mantiene su propio
 * marcado porque necesita el formulario de consulta interactivo.
 */
export function SiteShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden">
      {/* Background gradient effects */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-[#060912]" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-[#06b6d4]/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-[#0891b2]/5 rounded-full blur-[100px]" />
        <div className="absolute top-1/2 left-0 w-[300px] h-[300px] bg-[#06b6d4]/3 rounded-full blur-[80px]" />
      </div>

      {/* Header */}
      <header className="w-full py-4 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto flex items-center justify-center gap-3">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-[#06b6d4]/10 border border-[#06b6d4]/20">
              <Shield className="w-5 h-5 text-[#06b6d4]" />
            </div>
            <div>
              <span className="block text-lg sm:text-xl font-bold text-[#e2e8f0] leading-tight group-hover:text-white transition-colors">
                Consulta RUI
              </span>
              <span className="block text-xs text-[#94a3b8] leading-tight">
                Registro Universal de Ingresos
              </span>
            </div>
          </Link>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center px-4 sm:px-6 pb-8">
        {children}
      </main>

      {/* Footer */}
      <footer className="mt-auto py-4 px-4 border-t border-[#1e293b]/50">
        <div className="max-w-3xl mx-auto flex items-center justify-center gap-1.5 text-xs text-[#475569]">
          <span>Desarrollado por</span>
          <a
            href="https://col0.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#06b6d4] hover:text-[#22d3ee] transition-colors font-medium"
          >
            www.col0.com
          </a>
        </div>
      </footer>
    </div>
  );
}
