"use client";

import { useState, useEffect } from "react";
import { X, Download } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    const standalone = window.matchMedia("(display-mode: standalone)").matches
      || (window.navigator as unknown as { standalone?: boolean }).standalone === true;
    setIsStandalone(standalone);

    const ios = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(ios);

    const dismissed = localStorage.getItem("pwa-prompt-dismissed");
    if (dismissed && Date.now() - parseInt(dismissed) < 7 * 24 * 60 * 60 * 1000) {
      return;
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      if (!standalone) setShowPrompt(true);
    };

    window.addEventListener("beforeinstallprompt", handler);

    if (ios && !standalone) setShowPrompt(true);

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") setShowPrompt(false);
      setDeferredPrompt(null);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem("pwa-prompt-dismissed", Date.now().toString());
  };

  if (!showPrompt || isStandalone) return null;

  return (
    <div className="fixed bottom-16 md:bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-sm z-50 rounded-xl border bg-card p-4 shadow-lg animate-in slide-in-from-bottom-4" style={{ marginBottom: 'calc(env(safe-area-inset-bottom, 0px) + 0.75rem)' }}>
      <button onClick={handleDismiss} className="absolute right-2 top-2 rounded-full p-1 text-muted-foreground hover:text-foreground">
        <X className="h-4 w-4" />
      </button>
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
          <Download className="h-5 w-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold">Instalar FinTrack</p>
          {isIOS ? (
            <p className="text-xs text-muted-foreground mt-1">
              Toca el botón Compartir y selecciona &quot;Añadir a pantalla de inicio&quot;
            </p>
          ) : (
            <p className="text-xs text-muted-foreground mt-1">
              Instala la app para acceso rápido desde tu pantalla de inicio
            </p>
          )}
          {!isIOS && (
            <Button size="sm" onClick={handleInstall} className="mt-2 gap-1.5">
              <Download className="h-3.5 w-3.5" />
              Instalar
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
