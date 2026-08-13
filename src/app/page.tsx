'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import Script from 'next/script';
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
import { CAMPO_NIVEL_RUI_EXACTO, CAMPO_NIVEL_RUI_AMPLIO } from '@/lib/rui-fields';

const DOCUMENT_TYPES = [
  { value: '3', label: 'Cédula de ciudadanía' },
  { value: '2', label: 'Tarjeta de identidad' },
  { value: '1', label: 'Registro civil' },
  { value: '4', label: 'Cédula de extranjería' },
  { value: '5', label: 'DNI (País de origen)' },
  { value: '6', label: 'DNI (Pasaporte)' },
  { value: '7', label: 'Salvoconducto refugiado' },
  { value: '8', label: 'Permiso especial permanencia' },
  { value: '9', label: 'Permiso Protección Temporal' },
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
  const [resultHtml, setResultHtml] = useState<string | null>(null);
  const [parsedFields, setParsedFields] = useState<RUIField[]>([]);
  const [nivelInfo, setNivelInfo] = useState<NivelRuiInfo | null>(null);
  const [hasError, setHasError] = useState(false);
  const [isResultOpen, setIsResultOpen] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [turnstileScriptLoaded, setTurnstileScriptLoaded] = useState(false);
  const turnstileContainerRef = useRef<HTMLDivElement>(null);
  const turnstileWidgetIdRef = useRef<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (!turnstileScriptLoaded || !turnstileContainerRef.current) return;
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
  }, [turnstileScriptLoaded, toast]);

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

      setIsLoading(true);
      setResultHtml(null);
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
        setResultHtml(text);

        if (!response.ok) {
          setHasError(true);
          setIsResultOpen(true);
          toast({
            title: 'Error en la consulta',
            description: 'No se pudo obtener la información. Verifica tus datos e intenta de nuevo.',
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

        if (fields.length === 0) {
          toast({
            title: 'Sin resultados',
            description: 'No se encontró información para el documento consultado.',
          });
        }
      } catch {
        setHasError(true);
        setIsResultOpen(true);
        toast({
          title: 'Error de conexión',
          description: 'No se pudo conectar con el servicio. Intente nuevamente más tarde.',
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
      <Script
        src="https://challenges.cloudflare.com/turnstile/v0/api.js"
        strategy="afterInteractive"
        onLoad={() => setTurnstileScriptLoaded(true)}
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
              Registro Único de Ingreso
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
            Servicio oficial del Gobierno de Colombia
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[#e2e8f0] mb-4 leading-tight">
            Consulta tu información en el{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#06b6d4] to-[#22d3ee]">
              Registro Único de Ingreso
            </span>
          </h2>
          <p className="text-[#94a3b8] text-sm sm:text-base max-w-lg mx-auto leading-relaxed">
            Ingresa tu documento de identidad para consultar tu estado en el RUI.
            Tu información está protegida y es tratada con total confidencialidad.
          </p>
        </section>

        {/* Form Card */}
        <section className="w-full max-w-md mx-auto mb-8">
          <Card className="bg-[#0c1120]/80 backdrop-blur-sm border-[#1e293b] shadow-2xl shadow-black/20">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-2 mb-1">
                <FileText className="w-4 h-4 text-[#06b6d4]" />
                <CardTitle className="text-base text-[#e2e8f0]">
                  Datos de consulta
                </CardTitle>
              </div>
              <CardDescription className="text-[#94a3b8] text-sm">
                Selecciona el tipo e ingresa tu número de documento
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
                    placeholder="Ingresa tu número de documento"
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
              </form>
            </CardContent>
          </Card>

          {/* Trust indicators */}
          <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-6">
            <div className="flex items-center gap-2 text-[#94a3b8] text-xs">
              <Lock className="w-3.5 h-3.5 text-[#06b6d4]/60" />
              <span>Tus datos están protegidos</span>
            </div>
            <div className="hidden sm:block w-1 h-1 rounded-full bg-[#1e293b]" />
            <div className="flex items-center gap-2 text-[#94a3b8] text-xs">
              <Shield className="w-3.5 h-3.5 text-[#06b6d4]/60" />
              <span>Conexión segura</span>
            </div>
            <div className="hidden sm:block w-1 h-1 rounded-full bg-[#1e293b]" />
            <div className="flex items-center gap-2 text-[#94a3b8] text-xs">
              <UserCheck className="w-3.5 h-3.5 text-[#06b6d4]/60" />
              <span>Consulta oficial</span>
            </div>
          </div>
        </section>

        {/* Results Modal */}
        <Dialog open={isResultOpen} onOpenChange={setIsResultOpen}>
          <DialogContent className="bg-[#0c1120] border-[#1e293b] text-[#e2e8f0] max-w-2xl max-h-[85vh] overflow-y-auto">
            {parsedFields.length > 0 && !hasError ? (
              <>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2 text-base text-[#e2e8f0]">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    Resultado de la consulta
                  </DialogTitle>
                  <DialogDescription className="text-[#94a3b8]">
                    Información encontrada en el Registro Único de Ingreso
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
              </>
            ) : hasError ? (
              <>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2 text-base text-[#e2e8f0]">
                    <AlertCircle className="w-5 h-5 text-red-400" />
                    Respuesta del servicio
                  </DialogTitle>
                  <DialogDescription className="text-[#94a3b8]">
                    El servicio devolvió la siguiente respuesta
                  </DialogDescription>
                </DialogHeader>
                {resultHtml && (
                  <div className="rounded-lg border border-[#1e293b] bg-[#111827] p-4 max-h-96 overflow-y-auto">
                    <pre className="text-xs text-[#94a3b8] whitespace-pre-wrap break-words font-mono">
                      {resultHtml}
                    </pre>
                  </div>
                )}
              </>
            ) : (
              <>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2 text-base text-[#e2e8f0]">
                    <FileText className="w-5 h-5 text-[#94a3b8]" />
                    Sin resultados
                  </DialogTitle>
                  <DialogDescription className="text-[#94a3b8]">
                    No se encontró información para el documento consultado.
                  </DialogDescription>
                </DialogHeader>
              </>
            )}
          </DialogContent>
        </Dialog>
      </main>

      {/* Footer - sticky to bottom */}
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
