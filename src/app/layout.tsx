import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { ErrorBoundary } from "@/components/providers/error-boundary";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#10b981" },
    { media: "(prefers-color-scheme: dark)", color: "#059669" },
  ],
};

export const metadata: Metadata = {
  title: "FinTrack - Finanzas Personales Inteligentes",
  description:
    "Gestiona tus finanzas personales con IA. Presupuestos, deudas, suscripciones, IRPF, alertas inteligentes y planes personalizados. Disponible en iOS, Android y PC.",
  keywords: [
    "finanzas personales",
    "ahorro",
    "presupuesto",
    "IRPF",
    "deudas",
    "suscripciones",
    "IA",
    "fintech",
    "gastos",
    "ingresos",
  ],
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "FinTrack",
  },
  icons: {
    icon: [
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icon-192.png" }],
  },
  openGraph: {
    title: "FinTrack - Finanzas Personales Inteligentes",
    description:
      "Tu asistente financiero personal con IA. Presupuestos, deudas, suscripciones, IRPF y más.",
    type: "website",
    locale: "es_ES",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <link rel="apple-touch-icon" href="/icon-192.png" />
        <meta name="mobile-web-app-capable" content="yes" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // Inline theme detection to prevent flash of wrong theme
              (function() {
                try {
                  var stored = localStorage.getItem('fintrack-settings');
                  var theme = stored ? JSON.parse(stored).state?.settings?.theme : null;
                  if (theme === 'dark' || (!theme && window.matchMedia('(prefers-color-scheme: dark)').matches) || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                    document.documentElement.classList.add('dark');
                  }
                } catch(e) {}
              })();
            `,
          }}
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', () => {
                  navigator.serviceWorker.register('/sw.js').catch(() => {});
                });
              }
            `,
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <ThemeProvider>
          <ErrorBoundary>{children}</ErrorBoundary>
        </ThemeProvider>
        <Toaster />
      </body>
    </html>
  );
}
