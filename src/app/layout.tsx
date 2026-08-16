import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { SITE_URL } from "@/lib/site";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const siteUrl = SITE_URL;
const title =
  "Consultar RUI por cédula 2026 - Registro Universal de Ingresos";
const description =
  "Consulta el RUI por cédula gratis y en línea: conoce tu grupo y clasificación en el Registro Universal de Ingresos (el nuevo Sisbén) del DNP en Colombia.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: title,
    template: "%s | Consulta RUI",
  },
  description,
  keywords: [
    "consultar RUI",
    "RUI consulta",
    "consulta RUI",
    "RUI consultar",
    "consultar RUI por cédula",
    "RUI por cédula",
    "Registro Universal de Ingresos",
    "RUI Colombia",
    "puntaje RUI",
    "clasificación RUI",
    "grupo RUI",
    "certificado RUI",
    "RUI nuevo Sisbén",
    "RUI 2026",
    "DNP",
    "ventanilla social",
    "registro social de hogares",
  ],
  authors: [{ name: "col0", url: "https://col0.com" }],
  creator: "col0",
  publisher: "col0",
  applicationName: "Consulta RUI",
  category: "government",
  alternates: {
    canonical: "/",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "es_CO",
    url: siteUrl,
    siteName: "Consulta RUI",
    title,
    description,
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "Consulta RUI - Registro Único de Ingreso",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: ["/opengraph-image"],
  },
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/icon-192.png", type: "image/png", sizes: "192x192" },
      { url: "/icon-512.png", type: "image/png", sizes: "512x512" },
    ],
    apple: "/apple-touch-icon.png",
  },
  manifest: "/manifest.webmanifest",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#060912",
  colorScheme: "dark",
};

// Schema de alcance global (aplica a todo el sitio). El FAQ y los pasos de
// consulta viven en `lib/home-schema.ts` porque su contenido sólo es visible
// en la portada.
const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  "@id": `${siteUrl}#app`,
  name: "Consulta RUI",
  alternateName: [
    "Consultar RUI",
    "RUI Consulta",
    "Consultar RUI por cédula",
  ],
  url: siteUrl,
  description,
  applicationCategory: "GovernmentApplication",
  operatingSystem: "Any",
  inLanguage: "es-CO",
  isAccessibleForFree: true,
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "COP",
  },
  publisher: {
    "@type": "Organization",
    name: "col0",
    url: "https://col0.com",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="dark" suppressHydrationWarning>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
