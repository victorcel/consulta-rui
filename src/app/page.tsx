'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import Script from 'next/script';
import Link from 'next/link';
import { Shield, Lock, Loader2, CheckCircle2, AlertCircle, Search, FileText, UserCheck } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { detectarNivelRui, type NivelRuiInfo } from '@/lib/rui-niveles';
import { track } from '@/lib/analytics';
import { CAMPO_NIVEL_RUI_EXACTO, CAMPO_NIVEL_RUI_AMPLIO } from '@/lib/rui-fields';
import { FAQ_RUI } from '@/lib/rui-faq';
import { PAGINAS } from '@/lib/site';
import { SiteFooter } from '@/components/site-shell';
import { homeJsonLd } from '@/lib/home-schema';

// Resumen de los cuatro grupos del RUI. Se muestra como contenido indexable:
// "grupo A RUI", "clasificación RUI" y similares son búsquedas frecuentes.
const GRUPOS_RUI = [
  {
    codigo: 'A',
    titulo: 'Pobreza extrema',
    resumen:
      'Hogares con los menores ingresos del país y la mayor prioridad en los programas sociales del Estado.',
    colorClass: 'border-red-500/30 text-red-300',
  },
  {
    codigo: 'B',
    titulo: 'Pobreza moderada',
    resumen:
      'Hogares en condición de pobreza que mantienen acceso prioritario a la mayoría de programas sociales.',
    colorClass: 'border-orange-500/30 text-orange-300',
  },
  {
    codigo: 'C',
    titulo: 'Vulnerabilidad',
    resumen:
      'Hogares que no están en pobreza pero podrían caer en ella. El acceso depende del subgrupo específico.',
    colorClass: 'border-amber-500/30 text-amber-300',
  },
  {
    codigo: 'D',
    titulo: 'Ni pobre ni vulnerable',
    resumen:
      'Hogares que cubren sus necesidades básicas. Menor prioridad para subsidios directos del Estado.',
    colorClass: 'border-emerald-500/30 text-emerald-300',
  },
];

const DOCUMENT_TYPES = [
  { value: '3', label: 'Cédula de ciudadanía' },
  { value: '2', label: 'Tarjeta de identidad' },
  { value: '1', label: 'Registro civil' },
  { value: '4', label: 'Cédula de extranjería' },
  { value: '5', label: 'Documento del país de origen (DNI)' },
  { value: '6', label: 'Pasaporte' },
  { value: '7', label: 'Salvoconducto de refugiado' },
  { value: '8', label: 'PEP – Permiso Especial de Permanencia' },
  { value: '9', label: 'PPT – Permiso por Protección Temporal' },
];

interface RUIField {
  label: string;
  value: string;
}

// Campos técnicos que devuelve el servicio del RUI pero que no aportan valor
// al usuario final en el modal de resultado (código de estado interno, el
// grupo crudo ya se muestra en la tarjeta de nivel, código de municipio).
const CAMPOS_OCULTOS = new Set(['ok', 'grup rui', 'cod mpio']);

const normalizarEtiqueta = (label: string) =>
  label.trim().toLowerCase().replace(/\s+/g, ' ');

declare global {
  interface Window {
    turnstile?: {
      render: (
        container: string | HTMLElement,
        options: Record<string, unknown>
      ) => string;
      reset: (widgetId?: string) => void;
      remove: (widgetId?: string) => void;
    };
  }
}

export default function Home() {
  const [docType, setDocType] = useState('3');
  const [docNumber, setDocNumber] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [parsedFields, setParsedFields] = useState<RUIField[]>([]);
  const [nivelInfo, setNivelInfo] = useState<NivelRuiInfo | null>(null);
  const [hasError, setHasError] = useState(false);
  const [isResultOpen, setIsResultOpen] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  // Con `strategy="afterInteractive"`, next/script sólo inyecta el <script>
  // de Turnstile una vez por sesión de navegación: si el usuario ya visitó
  // la portada, navega a otra página y vuelve (client-side routing), este
  // componente se vuelve a montar pero el script global no se reinyecta ni
  // vuelve a disparar `onLoad`. Por eso no basta con escuchar `onLoad`: hay
  // que comprobar también si `window.turnstile` ya está disponible al
  // montar, y si no, sondear brevemente por si la carga sigue en curso.
  const [turnstileReady, setTurnstileReady] = useState(
    () => typeof window !== 'undefined' && !!window.turnstile
  );
  const turnstileContainerRef = useRef<HTMLDivElement>(null);
  const turnstileWidgetIdRef = useRef<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (turnstileReady || typeof window === 'undefined') return;
    if (window.turnstile) {
      setTurnstileReady(true);
      return;
    }
    // El script pudo quedar cargándose desde una navegación previa: sondea
    // hasta que `window.turnstile` aparezca.
    const interval = setInterval(() => {
      if (window.turnstile) {
        setTurnstileReady(true);
        clearInterval(interval);
      }
    }, 150);
    return () => clearInterval(interval);
  }, [turnstileReady]);

  useEffect(() => {
    if (!turnstileReady || !turnstileContainerRef.current) return;
    if (turnstileWidgetIdRef.current || !window.turnstile) return;

    const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
    if (!siteKey) {
      console.error('NEXT_PUBLIC_TURNSTILE_SITE_KEY no está configurada');
      return;
    }

    turnstileWidgetIdRef.current = window.turnstile.render(
      turnstileContainerRef.current,
      {
        sitekey: siteKey,
        theme: 'dark',
        language: 'es',
        callback: (token: string) => setTurnstileToken(token),
        'expired-callback': () => {
          setTurnstileToken(null);
          toast({
            title: 'Verificación expirada',
            description: 'La verificación de seguridad expiró, por favor complétala de nuevo.',
            variant: 'destructive',
          });
        },
        'error-callback': () => {
          setTurnstileToken(null);
          toast({
            title: 'Error de verificación',
            description: 'No se pudo cargar la verificación de seguridad. Intenta de nuevo.',
            variant: 'destructive',
          });
        },
      }
    );

    return () => {
      if (turnstileWidgetIdRef.current && window.turnstile) {
        window.turnstile.remove(turnstileWidgetIdRef.current);
        turnstileWidgetIdRef.current = null;
      }
    };
  }, [turnstileReady, toast]);

  const parseHtmlResponse = useCallback((html: string): RUIField[] => {
    const fields: RUIField[] = [];
    // Try to extract data from common RUI response patterns
    // The response may contain HTML tables, spans, or JSON data

    // Try parsing as JSON first
    try {
      const jsonMatch = html.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const data = JSON.parse(jsonMatch[0]);
        for (const [key, value] of Object.entries(data)) {
          if (value && String(value).trim()) {
            fields.push({
              label: key.replace(/([A-Z])/g, ' $1').replace(/^./, (s) => s.toUpperCase()),
              value: String(value),
            });
          }
        }
        if (fields.length > 0) return fields;
      }
    } catch {
      // Not JSON, continue to HTML parsing
    }

    // Parse HTML table rows
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    // Look for table rows with td/th pairs
    const rows = doc.querySelectorAll('tr');
    rows.forEach((row) => {
      const cells = row.querySelectorAll('td, th');
      if (cells.length >= 2) {
        const label = cells[0].textContent?.trim();
        const value = cells[1].textContent?.trim();
        if (label && value) {
          fields.push({ label, value });
        }
      }
    });

    if (fields.length > 0) return fields;

    // Look for label-value pairs (e.g., spans with specific classes)
    const allText = doc.body?.textContent?.trim() || '';
    if (allText && allText.length > 0 && allText.length < 5000) {
      // Return raw text if we can't parse structured data
      fields.push({ label: 'Resultado', value: allText });
    }

    return fields;
  }, []);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      if (!docNumber.trim()) {
        toast({
          title: 'Campo requerido',
          description: 'Por favor ingresa tu número de documento.',
          variant: 'destructive',
        });
        return;
      }

      if (!/^\d{1,15}$/.test(docNumber.trim())) {
        track('consulta_invalida', { tipo_doc: docType });
        toast({
          title: 'Número inválido',
          description: 'El número de documento debe contener solo dígitos (máximo 15).',
          variant: 'destructive',
        });
        return;
      }

      if (!turnstileToken) {
        toast({
          title: 'Verificación requerida',
          description: 'Por favor completa la verificación de seguridad antes de continuar.',
          variant: 'destructive',
        });
        return;
      }

      track('consulta_enviada', { tipo_doc: docType });
      setIsLoading(true);
      setParsedFields([]);
      setNivelInfo(null);
      setHasError(false);

      try {
        const response = await fetch('/api/consultar-rui', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            pNumDoc: docNumber.trim(),
            pTipDoc: docType,
            turnstileToken,
          }),
        });

        const text = await response.text();
        if (!response.ok) {
          track('consulta_error', { status: response.status });
          setHasError(true);
          setIsResultOpen(true);
          toast({
            title: 'No pudimos completar la consulta',
            description: 'Puede ser una falla temporal del servicio o un dato mal escrito. Revisa e intenta de nuevo.',
            variant: 'destructive',
          });
          return;
        }

        const fields = parseHtmlResponse(text);
        const visibleFields = fields.filter(
          (field) => !CAMPOS_OCULTOS.has(normalizarEtiqueta(field.label))
        );
        setParsedFields(visibleFields);
        setIsResultOpen(true);

        const campoNivel =
          fields.find((field) => CAMPO_NIVEL_RUI_EXACTO.test(normalizarEtiqueta(field.label))) ??
          fields.find((field) => CAMPO_NIVEL_RUI_AMPLIO.test(normalizarEtiqueta(field.label)));
        const nivel =
          (campoNivel && detectarNivelRui(campoNivel.value)) ||
          fields.map((field) => detectarNivelRui(field.value)).find(Boolean) ||
          detectarNivelRui(text) ||
          null;
        setNivelInfo(nivel);
        track(
          fields.length === 0 ? 'consulta_sin_resultados' : 'consulta_exitosa',
          { grupo: nivel?.grupo ?? 'desconocido' }
        );

        if (fields.length === 0) {
          toast({
            title: 'Sin resultados',
            description: 'No encontramos información para este documento.',
          });
        }
      } catch {
        track('consulta_error', { status: 0 });
        setHasError(true);
        setIsResultOpen(true);
        toast({
          title: 'Error de conexión',
          description: 'No pudimos conectar con el servicio. Intenta de nuevo en unos minutos.',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
        if (turnstileWidgetIdRef.current && window.turnstile) {
          window.turnstile.reset(turnstileWidgetIdRef.current);
        }
        setTurnstileToken(null);
      }
    },
    [docNumber, docType, turnstileToken, toast, parseHtmlResponse]
  );

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(homeJsonLd) }}
      />
      <Script
        src="https://challenges.cloudflare.com/turnstile/v0/api.js"
        strategy="afterInteractive"
        onLoad={() => setTurnstileReady(true)}
      />

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
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-[#06b6d4]/10 border border-[#06b6d4]/20">
            <Shield className="w-5 h-5 text-[#06b6d4]" />
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-bold text-[#e2e8f0] leading-tight">
              Consulta RUI
            </h1>
            <p className="text-xs text-[#94a3b8] leading-tight">
              Registro Universal de Ingresos
            </p>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 flex flex-col items-center px-4 sm:px-6 pb-8">
        {/* Hero Section */}
        <section className="max-w-2xl mx-auto text-center mt-6 sm:mt-10 mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#06b6d4]/10 border border-[#06b6d4]/20 text-[#22d3ee] text-xs font-medium mb-5">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Gratis · Sin cuenta · Datos del DNP
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[#e2e8f0] mb-4 leading-tight">
            Consultar RUI por cédula:{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#06b6d4] to-[#22d3ee]">
              Registro Universal de Ingresos
            </span>
          </h2>
          <p className="text-[#94a3b8] text-sm sm:text-base max-w-lg mx-auto leading-relaxed">
            El Sisbén ya no muestra puntaje: desde agosto de 2026 lo reemplaza
            el RUI. Consulta gratis tu grupo con tu documento y entiende qué
            significa para tus subsidios. La transición termina el 31 de
            octubre de 2026.
          </p>
        </section>

        {/* Form Card */}
        <section id="consulta" className="w-full max-w-md mx-auto mb-8 scroll-mt-6">
          <Card className="bg-[#0c1120]/80 backdrop-blur-sm border-[#1e293b] shadow-2xl shadow-black/20">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-2 mb-1">
                <FileText className="w-4 h-4 text-[#06b6d4]" />
                <CardTitle className="text-base text-[#e2e8f0]">
                  Consulta tu grupo en el RUI
                </CardTitle>
              </div>
              <CardDescription className="text-[#94a3b8] text-sm">
                Escribe tu documento sin puntos ni comas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="docType" className="text-[#94a3b8] text-sm">
                    Tipo de documento
                  </Label>
                  <Select value={docType} onValueChange={setDocType}>
                    <SelectTrigger className="w-full bg-[#111827] border-[#1e293b] text-[#e2e8f0] hover:bg-[#111827]/80">
                      <SelectValue placeholder="Selecciona el tipo" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#111827] border-[#1e293b] max-h-72 overflow-y-auto">
                      {DOCUMENT_TYPES.map((type) => (
                        <SelectItem
                          key={type.value}
                          value={type.value}
                          className="text-[#e2e8f0] focus:bg-[#06b6d4]/10 focus:text-[#22d3ee]"
                        >
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="docNumber" className="text-[#94a3b8] text-sm">
                    Número de documento
                  </Label>
                  <Input
                    id="docNumber"
                    type="text"
                    placeholder="Ej. 1012345678"
                    value={docNumber}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '').slice(0, 15);
                      setDocNumber(val);
                    }}
                    className="w-full bg-[#111827] border-[#1e293b] text-[#e2e8f0] placeholder:text-[#475569] hover:bg-[#111827]/80 focus-visible:ring-[#06b6d4]/30"
                    inputMode="numeric"
                    maxLength={15}
                  />
                </div>

                <div ref={turnstileContainerRef} className="flex justify-center" />

                <Button
                  type="submit"
                  disabled={isLoading || !docNumber.trim() || !turnstileToken}
                  className="w-full h-11 text-sm font-semibold text-white bg-gradient-to-r from-[#06b6d4] to-[#0891b2] hover:from-[#22d3ee] hover:to-[#06b6d4] shadow-lg shadow-[#06b6d4]/20 hover:shadow-[#06b6d4]/30 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Consultando...
                    </>
                  ) : (
                    <>
                      <Search className="w-4 h-4 mr-2" />
                      Consultar RUI
                    </>
                  )}
                </Button>
                {!turnstileToken && !isLoading && (
                  <p className="text-xs text-[#64748b] text-center">
                    Completa la verificación de seguridad para activar el botón.
                  </p>
                )}
              </form>
            </CardContent>
          </Card>

          {/* Trust indicators */}
          <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-6">
            <div className="flex items-center gap-2 text-[#94a3b8] text-xs">
              <Lock className="w-3.5 h-3.5 text-[#06b6d4]/60" />
              <span>Sin cuenta ni costo</span>
            </div>
            <div className="hidden sm:block w-1 h-1 rounded-full bg-[#1e293b]" />
            <div className="flex items-center gap-2 text-[#94a3b8] text-xs">
              <Shield className="w-3.5 h-3.5 text-[#06b6d4]/60" />
              <span>Resultado del DNP</span>
            </div>
            <div className="hidden sm:block w-1 h-1 rounded-full bg-[#1e293b]" />
            <div className="flex items-center gap-2 text-[#94a3b8] text-xs">
              <UserCheck className="w-3.5 h-3.5 text-[#06b6d4]/60" />
              <span>Sitio independiente</span>
            </div>
          </div>
          <p className="mt-3 text-center text-xs text-[#64748b] leading-relaxed">
            No somos un portal oficial ni estamos afiliados al DNP. Consultar el
            RUI es gratis: no pagues a intermediarios.
          </p>
        </section>

        {/* Contenido informativo (SEO): texto indexable sobre qué es el RUI,
            cómo consultarlo, sus grupos y preguntas frecuentes. */}
        <div className="w-full max-w-2xl mx-auto mt-16 space-y-12">
          <section>
            <h2 className="text-xl sm:text-2xl font-bold text-[#e2e8f0] mb-3">
              ¿Qué es el RUI o Registro Universal de Ingresos?
            </h2>
            <div className="space-y-3 text-sm text-[#94a3b8] leading-relaxed">
              <p>
                El <strong className="text-[#cbd5e1]">Registro Universal de
                Ingresos (RUI)</strong> es el instrumento del Departamento
                Nacional de Planeación (DNP) que desde el 1 de agosto de 2026
                clasifica a los hogares colombianos según su capacidad económica
                para orientar el gasto social del Estado.
              </p>
              <p>
                El RUI parte de la base del Sisbén y la fortalece con registros
                administrativos: cruza bases de datos oficiales como las de la
                DIAN, empresas de servicios públicos, fondos de pensiones y
                entidades financieras. Por eso la información se actualiza sin
                que tengas que pedir una encuesta nueva.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-xl sm:text-2xl font-bold text-[#e2e8f0] mb-3">
              Cómo consultar el RUI por cédula
            </h2>
            <p className="text-sm text-[#94a3b8] leading-relaxed mb-4">
              La consulta del RUI es gratuita, toma solo un momento y no
              requiere crear una cuenta. Sigue estos pasos:
            </p>
            <ol className="space-y-3">
              {[
                'Selecciona tu tipo de documento de identidad: cédula de ciudadanía, tarjeta de identidad, cédula de extranjería u otro.',
                'Escribe el número de documento sin puntos ni comas.',
                'Completa la validación de seguridad que confirma que no eres un robot.',
                'Presiona «Consultar RUI» para ver tu grupo y subgrupo.',
              ].map((paso, i) => (
                <li key={i} className="flex gap-3 text-sm text-[#94a3b8] leading-relaxed">
                  <span className="flex items-center justify-center w-6 h-6 shrink-0 rounded-full bg-[#06b6d4]/10 border border-[#06b6d4]/20 text-[#22d3ee] text-xs font-semibold">
                    {i + 1}
                  </span>
                  <span className="pt-0.5">{paso}</span>
                </li>
              ))}
            </ol>
            <p className="text-sm text-[#94a3b8] leading-relaxed mt-4">
              ¿Necesitas un soporte para un trámite?{' '}
              <Link
                href="/certificado-rui"
                className="text-[#06b6d4] hover:text-[#22d3ee] transition-colors font-medium"
              >
                Aprende a descargar el certificado del RUI en PDF
              </Link>
              .
            </p>
          </section>

          <section>
            <h2 className="text-xl sm:text-2xl font-bold text-[#e2e8f0] mb-3">
              Grupos y clasificación del RUI
            </h2>
            <p className="text-sm text-[#94a3b8] leading-relaxed mb-4">
              El RUI <strong className="text-[#cbd5e1]">no asigna un puntaje
              numérico</strong> como lo hacía el Sisbén. En su lugar devuelve un
              código de grupo y subgrupo —por ejemplo B03 o C12— junto con la
              fecha de corte del cálculo. Estos son los cuatro grupos:
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              {GRUPOS_RUI.map((grupo) => (
                <Link
                  key={grupo.codigo}
                  href={`/grupo-${grupo.codigo.toLowerCase()}-rui`}
                  className={`block rounded-lg border bg-[#0c1120]/60 p-4 hover:bg-[#0c1120] transition-colors ${grupo.colorClass}`}
                >
                  <h3 className="flex items-center gap-2 mb-1.5">
                    <Badge
                      variant="outline"
                      className="border-current text-current text-xs px-2 py-0.5"
                    >
                      Grupo {grupo.codigo}
                    </Badge>
                    <span className="text-sm font-semibold">{grupo.titulo}</span>
                  </h3>
                  <p className="text-xs text-[#94a3b8] leading-relaxed mb-2">
                    {grupo.resumen}
                  </p>
                  <span className="text-xs font-medium text-[#06b6d4]">
                    Ver el grupo {grupo.codigo} →
                  </span>
                </Link>
              ))}
            </div>
            <p className="text-xs text-[#94a3b8] leading-relaxed mt-4">
              ¿Quieres entender cada código?{' '}
              <Link
                href="/clasificacion-rui"
                className="text-[#06b6d4] hover:text-[#22d3ee] transition-colors font-medium"
              >
                Lee la guía completa de grupos y subgrupos
              </Link>
              .
            </p>
          </section>

          <section>
            <h2 className="text-xl sm:text-2xl font-bold text-[#e2e8f0] mb-3">
              RUI y Sisbén: qué cambió
            </h2>
            <div className="space-y-3 text-sm text-[#94a3b8] leading-relaxed">
              <p>
                El RUI reemplaza al Sisbén como instrumento principal de
                focalización del gasto social. Durante la transición, vigente
                hasta el 31 de octubre de 2026, el Sisbén sigue siendo una de las
                fuentes de información sobre las condiciones de los hogares: no
                desaparece, evoluciona.
              </p>
              <p>
                Estar clasificado en el RUI no otorga subsidios de forma
                automática: el registro clasifica hogares y cada programa social
                define sus propios requisitos de acceso sobre esa clasificación.
              </p>
              <p>
                <Link
                  href="/rui-vs-sisben"
                  className="text-[#06b6d4] hover:text-[#22d3ee] transition-colors font-medium"
                >
                  Compara el RUI y el Sisbén
                </Link>{' '}
                o revisa{' '}
                <Link
                  href="/que-paso-con-mi-puntaje-sisben"
                  className="text-[#06b6d4] hover:text-[#22d3ee] transition-colors font-medium"
                >
                  qué pasó con tu puntaje del Sisbén
                </Link>
                .
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-xl sm:text-2xl font-bold text-[#e2e8f0] mb-4">
              Preguntas frecuentes sobre el RUI
            </h2>
            <div className="space-y-4">
              {FAQ_RUI.map((item) => (
                <div
                  key={item.pregunta}
                  className="rounded-lg border border-[#1e293b] bg-[#0c1120]/60 p-4"
                >
                  <h3 className="text-sm font-semibold text-[#e2e8f0] mb-1.5">
                    {item.pregunta}
                  </h3>
                  <p className="text-sm text-[#94a3b8] leading-relaxed">
                    {item.respuesta}
                  </p>
                  {item.enlace && (
                    <Link
                      href={item.enlace.href}
                      className="inline-block mt-2 text-xs font-medium text-[#06b6d4] hover:text-[#22d3ee] transition-colors"
                    >
                      {item.enlace.texto} →
                    </Link>
                  )}
                </div>
              ))}
            </div>
          </section>

          <section>
            <h2 className="text-xl sm:text-2xl font-bold text-[#e2e8f0] mb-4">
              Más información sobre el RUI
            </h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {PAGINAS.map((pagina) => (
                <Link
                  key={pagina.slug}
                  href={`/${pagina.slug}`}
                  className="rounded-lg border border-[#1e293b] bg-[#0c1120]/60 p-4 hover:border-[#06b6d4]/30 hover:bg-[#0c1120] transition-colors group"
                >
                  <span className="block text-sm font-semibold text-[#e2e8f0] mb-1 group-hover:text-[#22d3ee] transition-colors">
                    {pagina.titulo}
                  </span>
                  <span className="block text-xs text-[#94a3b8] leading-relaxed">
                    {pagina.descripcion}
                  </span>
                </Link>
              ))}
            </div>
          </section>

          <section className="rounded-lg border border-[#1e293b] bg-[#111827]/60 p-4">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-[#e2e8f0] mb-2">
              <AlertCircle className="w-4 h-4 text-[#94a3b8]" />
              Aviso importante
            </h2>
            <p className="text-xs text-[#94a3b8] leading-relaxed">
              Este es un sitio informativo independiente, no es un portal oficial
              del Gobierno de Colombia ni está afiliado al DNP. La consulta del
              RUI y la descarga del certificado son{' '}
              <strong className="text-[#cbd5e1]">completamente gratuitas</strong>{' '}
              y no debes pagar a intermediarios. Puedes realizarlas directamente
              en el portal oficial de la Ventanilla Social del DNP:{' '}
              <a
                href="https://ventanillasocial.dnp.gov.co/"
                data-umami-event="click_ventanilla_social"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#06b6d4] hover:text-[#22d3ee] transition-colors font-medium"
              >
                ventanillasocial.dnp.gov.co
              </a>
              .
            </p>
          </section>
        </div>

        {/* Results Modal */}
        <Dialog open={isResultOpen} onOpenChange={setIsResultOpen}>
          <DialogContent className="bg-[#0c1120] border-[#1e293b] text-[#e2e8f0] max-w-2xl max-h-[85vh] overflow-y-auto">
            {parsedFields.length > 0 && !hasError ? (
              <>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2 text-base text-[#e2e8f0]">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    {nivelInfo ? `Tu grupo en el RUI: ${nivelInfo.codigo}` : 'Resultado de la consulta'}
                  </DialogTitle>
                  <DialogDescription className="text-[#94a3b8]">
                    Esto es lo que encontramos en el Registro Universal de Ingresos
                  </DialogDescription>
                </DialogHeader>
                {nivelInfo && (
                  <div
                    className={`rounded-lg border bg-gradient-to-br p-4 space-y-3 ${nivelInfo.colorClass}`}
                  >
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="outline" className="border-current text-current text-sm px-2.5 py-1">
                        Nivel {nivelInfo.codigo}
                      </Badge>
                      <span className="text-sm font-semibold">{nivelInfo.titulo}</span>
                    </div>
                    <p className="text-xs text-[#cbd5e1] leading-relaxed">
                      {nivelInfo.descripcion}
                    </p>
                    <div>
                      <p className="text-xs font-medium text-[#e2e8f0] mb-1.5">
                        Beneficios a los que normalmente puedes aplicar:
                      </p>
                      <ul className="space-y-1">
                        {nivelInfo.beneficios.map((beneficio, i) => (
                          <li key={i} className="text-xs text-[#cbd5e1] flex items-start gap-1.5">
                            <span className="mt-1 w-1 h-1 rounded-full bg-current shrink-0" />
                            {beneficio}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <p className="text-[10px] text-[#94a3b8] leading-relaxed border-t border-white/10 pt-2">
                      Información referencial. El RUI clasifica hogares; cada entidad y
                      programa social define sus propios requisitos de acceso. Confirma tu
                      elegibilidad en el DNP o la entidad responsable del programa.
                    </p>
                  </div>
                )}

                <div className="rounded-lg border border-[#1e293b] overflow-hidden">
                  {parsedFields.map((field, index) => (
                    <div
                      key={index}
                      className={`flex flex-col sm:flex-row sm:items-center px-4 py-3 ${
                        index < parsedFields.length - 1
                          ? 'border-b border-[#1e293b]'
                          : ''
                      }`}
                    >
                      <span className="text-xs font-medium text-[#94a3b8] uppercase tracking-wider sm:w-48 sm:shrink-0 mb-1 sm:mb-0">
                        {field.label}
                      </span>
                      <span className="text-sm text-[#e2e8f0] break-all">
                        {field.value}
                      </span>
                    </div>
                  ))}
                </div>

                <div>
                  <p className="text-xs font-medium text-[#e2e8f0] mb-2">¿Y ahora qué?</p>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {[
                      nivelInfo && {
                        href: `/grupo-${nivelInfo.grupo.toLowerCase()}-rui`,
                        texto: `Qué significa estar en el grupo ${nivelInfo.grupo}`,
                      },
                      { href: '/subsidios-rui', texto: 'Ver subsidios según tu grupo' },
                      { href: '/certificado-rui', texto: 'Descargar el certificado en PDF' },
                      { href: '/corregir-datos-rui', texto: 'Mi grupo no coincide con mi situación' },
                    ]
                      .filter((e): e is { href: string; texto: string } => !!e)
                      .map((enlace) => (
                        <Link
                          key={enlace.href}
                          href={enlace.href}
                          className="rounded-lg border border-[#1e293b] bg-[#111827]/60 px-3 py-2.5 text-xs font-medium text-[#22d3ee] hover:border-[#06b6d4]/30 transition-colors"
                        >
                          {enlace.texto} →
                        </Link>
                      ))}
                  </div>
                </div>
              </>
            ) : hasError ? (
              <>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2 text-base text-[#e2e8f0]">
                    <AlertCircle className="w-5 h-5 text-red-400" />
                    No pudimos completar la consulta
                  </DialogTitle>
                  <DialogDescription className="text-[#94a3b8]">
                    Puede ser una falla temporal del servicio del DNP o un dato mal escrito.
                  </DialogDescription>
                </DialogHeader>
                <ul className="space-y-2 text-sm text-[#94a3b8] leading-relaxed">
                  <li>• Revisa que el tipo y el número de documento sean correctos.</li>
                  <li>• Intenta de nuevo en unos minutos: el servicio se satura en horas de alta demanda.</li>
                  <li>• Si sigue fallando, consúltalo directamente en la Ventanilla Social.</li>
                </ul>
                <div className="flex flex-col sm:flex-row gap-2">
                  <Button
                    type="button"
                    onClick={() => setIsResultOpen(false)}
                    className="text-white bg-gradient-to-r from-[#06b6d4] to-[#0891b2] cursor-pointer"
                  >
                    Intentar de nuevo
                  </Button>
                  <a
                    href="https://ventanillasocial.dnp.gov.co/"
                    data-umami-event="click_ventanilla_social"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center h-9 px-4 rounded-md text-sm font-medium text-[#22d3ee] border border-[#06b6d4]/40 hover:bg-[#06b6d4]/10 transition-colors"
                  >
                    Ir a la Ventanilla Social
                  </a>
                </div>
              </>
            ) : (
              <>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2 text-base text-[#e2e8f0]">
                    <FileText className="w-5 h-5 text-[#94a3b8]" />
                    Sin resultados
                  </DialogTitle>
                  <DialogDescription className="text-[#94a3b8]">
                    No encontramos información para este documento.
                  </DialogDescription>
                </DialogHeader>
                <ul className="space-y-2 text-sm text-[#94a3b8] leading-relaxed">
                  <li>• Confirma que elegiste el tipo de documento correcto y que el número no tiene errores.</li>
                  <li>• Puede que tu clasificación aún no se haya calculado: el RUI se actualiza de forma periódica.</li>
                  <li>
                    • Si crees que deberías aparecer, consulta en la{' '}
                    <a
                      href="https://ventanillasocial.dnp.gov.co/"
                      data-umami-event="click_ventanilla_social"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#06b6d4] hover:text-[#22d3ee] font-medium"
                    >
                      Ventanilla Social
                    </a>{' '}
                    o en la oficina del Sisbén de tu municipio.
                  </li>
                </ul>
                <Link
                  href="/corregir-datos-rui"
                  className="text-xs font-medium text-[#22d3ee] hover:underline"
                >
                  Qué hacer si tus datos no aparecen o están mal →
                </Link>
              </>
            )}
          </DialogContent>
        </Dialog>
      </main>

      <SiteFooter />
    </div>
  );
}
