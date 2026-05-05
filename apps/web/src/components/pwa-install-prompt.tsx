"use client";

import { useState, useEffect } from "react";
import { Download, X, Share, PlusSquare } from "lucide-react";
import { cn } from "@/lib/utils";

export function PWAInstallPrompt() {
  const [show, setShow] = useState(false);
  const [platform, setPlatform] = useState<"ios" | "android" | "other">("other");
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    // Detect platform
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIos = /iphone|ipad|ipod/.test(userAgent);
    const isAndroid = /android/.test(userAgent);

    if (isIos) setPlatform("ios");
    else if (isAndroid) setPlatform("android");

    // Check if already in PWA mode
    const isStandalone = window.matchMedia("(display-mode: standalone)").matches 
      || (window.navigator as any).standalone 
      || document.referrer.includes("android-app://");

    if (isStandalone) return;

    // Listen for Chrome install prompt
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShow(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    // For iOS, we show it after a small delay
    if (isIos) {
      const timer = setTimeout(() => {
        const dismissed = localStorage.getItem("pwa-prompt-dismissed");
        if (!dismissed) setShow(true);
      }, 3000);
      return () => clearTimeout(timer);
    }

    return () => window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setShow(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShow(false);
    localStorage.setItem("pwa-prompt-dismissed", "true");
  };

  if (!show) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] w-[calc(100%-3rem)] max-w-md animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-background border border-border shadow-2xl rounded-2xl overflow-hidden">
        <div className="p-5 flex items-start gap-4">
          <div className="h-12 w-12 rounded-xl bg-primary flex items-center justify-center shrink-0 shadow-lg shadow-primary/20">
            <Download className="h-6 w-6 text-primary-foreground" />
          </div>
          
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-base text-foreground">Instalar Flip App</h3>
            <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
              Instala Flip en tu pantalla de inicio para una experiencia más rápida y acceso sin conexión.
            </p>
          </div>

          <button 
            onClick={handleDismiss}
            className="h-8 w-8 rounded-full hover:bg-muted flex items-center justify-center text-muted-foreground transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="px-5 pb-5">
          {platform === "ios" ? (
            <div className="bg-muted/50 rounded-xl p-3 text-[13px] text-muted-foreground border border-border/50">
              <p className="flex items-center flex-wrap gap-1.5 justify-center">
                Pulsa <Share className="h-4 w-4 inline text-primary" /> y luego 
                <span className="font-semibold text-foreground inline-flex items-center gap-1 bg-background px-1.5 py-0.5 rounded border border-border">
                  <PlusSquare className="h-3.5 w-3.5" /> Añadir a la pantalla de inicio
                </span>
              </p>
            </div>
          ) : (
            <button
              onClick={handleInstall}
              className="w-full bg-primary text-primary-foreground font-bold py-3.5 rounded-xl hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary/20"
            >
              <Download className="h-5 w-5" />
              Instalar ahora
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
