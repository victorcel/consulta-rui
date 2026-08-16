'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SiteShell } from '@/components/site-shell';

export default function Error({
  error,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();

  useEffect(() => {
    console.error(error);
    const timer = setTimeout(() => router.replace('/'), 5000);
    return () => clearTimeout(timer);
  }, [error, router]);

  return (
    <SiteShell>
      <div className="w-full max-w-md mx-auto mt-16 sm:mt-24 flex flex-col items-center text-center">
        <div className="flex items-center justify-center w-14 h-14 rounded-xl bg-[#06b6d4]/10 border border-[#06b6d4]/20 mb-5">
          <AlertTriangle className="w-7 h-7 text-[#06b6d4]" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-[#e2e8f0] mb-3">
          Ocurrió un error
        </h1>
        <p className="text-sm sm:text-base text-[#94a3b8] leading-relaxed mb-8">
          Algo salió mal al cargar esta página. Te llevaremos al inicio
          automáticamente.
        </p>
        <Button size="lg" onClick={() => router.replace('/')}>
          Volver al inicio
        </Button>
      </div>
    </SiteShell>
  );
}
