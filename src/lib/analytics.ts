type Umami = { track: (name: string, data?: Record<string, string | number | boolean>) => void };

/** Evento personalizado de Umami. No-op si el script no cargó (adblock, sin ID). Nunca enviar el número de documento. */
export function track(name: string, data?: Record<string, string | number | boolean>) {
  try {
    (window as unknown as { umami?: Umami }).umami?.track(name, data);
  } catch {}
}
