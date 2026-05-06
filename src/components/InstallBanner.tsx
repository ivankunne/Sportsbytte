"use client";

import { useState, useEffect } from "react";
import Image from "next/image";

const DISMISSED_KEY = "pwa_install_dismissed_until";
const DISMISS_DAYS = 14;

type Platform = "android" | "ios" | "ios-other" | null;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type BeforeInstallPromptEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };

export function InstallBanner() {
  const [platform, setPlatform] = useState<Platform>(null);
  const [visible, setVisible] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showIOSSteps, setShowIOSSteps] = useState(false);

  useEffect(() => {
    // Already installed as standalone app
    if (window.matchMedia("(display-mode: standalone)").matches) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if ((navigator as any).standalone === true) return;

    // Check if dismissed recently
    const until = localStorage.getItem(DISMISSED_KEY);
    if (until && Date.now() < Number(until)) return;

    const ua = navigator.userAgent;
    const isIOS = /iPad|iPhone|iPod/.test(ua);
    const isAndroid = /Android/.test(ua);
    const isMobile = isIOS || isAndroid;
    if (!isMobile) return;

    if (isIOS) {
      const isSafari = /Safari/.test(ua) && !/CriOS|FxiOS|EdgiOS/.test(ua);
      // Chrome/Firefox on iOS can't install PWAs directly — suggest opening in Safari
      setPlatform(isSafari ? "ios" : "ios-other");
      setTimeout(() => setVisible(true), 2500);
    }

    if (isAndroid) {
      const handler = (e: Event) => {
        e.preventDefault();
        setDeferredPrompt(e as BeforeInstallPromptEvent);
        setPlatform("android");
        setTimeout(() => setVisible(true), 2500);
      };
      window.addEventListener("beforeinstallprompt", handler);
      return () => window.removeEventListener("beforeinstallprompt", handler);
    }
  }, []);

  function dismiss() {
    setVisible(false);
    localStorage.setItem(DISMISSED_KEY, String(Date.now() + DISMISS_DAYS * 24 * 60 * 60 * 1000));
  }

  async function handleInstall() {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setVisible(false);
    }
    setDeferredPrompt(null);
  }

  if (!visible || !platform) return null;

  return (
    <div className="fixed bottom-16 inset-x-0 z-40 px-3 pb-2 md:hidden">
      <div className="bg-white rounded-2xl border border-border shadow-xl shadow-black/10 overflow-hidden">

        {/* Main row */}
        <div className="flex items-center gap-3 px-4 py-3">
          <div className="flex-shrink-0">
            <Image
              src="/favicon.png"
              alt="Sportsbytte"
              width={44}
              height={44}
              className="rounded-xl"
            />
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-ink leading-tight">Legg til Sportsbytte</p>
            <p className="text-xs text-ink-light mt-0.5 leading-snug">
              {platform === "ios-other"
                ? "Åpne i Safari for å installere"
                : "Raskere tilgang — fungerer som en app"}
            </p>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            {platform === "android" && (
              <button
                onClick={handleInstall}
                className="rounded-lg bg-forest px-4 py-2 text-xs font-bold text-white hover:bg-forest-mid transition-colors duration-[120ms]"
              >
                Legg til
              </button>
            )}

            {platform === "ios" && (
              <button
                onClick={() => setShowIOSSteps((s) => !s)}
                className="rounded-lg bg-forest px-4 py-2 text-xs font-bold text-white hover:bg-forest-mid transition-colors duration-[120ms]"
              >
                Hvordan
              </button>
            )}

            {platform === "ios-other" && (
              <button
                onClick={() => setShowIOSSteps((s) => !s)}
                className="rounded-lg bg-forest px-4 py-2 text-xs font-bold text-white hover:bg-forest-mid transition-colors duration-[120ms]"
              >
                Hvordan
              </button>
            )}

            <button
              onClick={dismiss}
              aria-label="Lukk"
              className="flex h-7 w-7 items-center justify-center rounded-full text-ink-light hover:bg-cream transition-colors duration-[120ms]"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* iOS Safari step-by-step instructions */}
        {platform === "ios" && showIOSSteps && (
          <div className="border-t border-border bg-cream px-4 py-3 space-y-2">
            <p className="text-xs font-semibold text-ink mb-2">Slik legger du til på hjemskjermen:</p>
            {[
              { n: "1", text: "Trykk på del-knappen", icon: "↑", desc: "nederst i Safari" },
              { n: "2", text: "Rull ned og velg", icon: "＋", desc: "«Legg til på hjemskjerm»" },
              { n: "3", text: "Trykk", icon: "✓", desc: "«Legg til» øverst til høyre" },
            ].map((step) => (
              <div key={step.n} className="flex items-center gap-3">
                <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-forest text-white text-[10px] font-bold">
                  {step.n}
                </span>
                <p className="text-xs text-ink-mid">
                  {step.text}{" "}
                  <span className="font-semibold text-ink">{step.icon} {step.desc}</span>
                </p>
              </div>
            ))}
          </div>
        )}

        {/* iOS Chrome/Firefox — redirect to Safari */}
        {platform === "ios-other" && showIOSSteps && (
          <div className="border-t border-border bg-cream px-4 py-3 space-y-2">
            <p className="text-xs font-semibold text-ink mb-2">Installering krever Safari på iPhone:</p>
            {[
              { n: "1", text: "Kopier lenken", icon: "⎘", desc: "sportsbytte.no" },
              { n: "2", text: "Åpne", icon: "🧭", desc: "Safari" },
              { n: "3", text: "Lim inn lenken og trykk", icon: "↑", desc: "del-knappen → «Legg til på hjemskjerm»" },
            ].map((step) => (
              <div key={step.n} className="flex items-center gap-3">
                <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-forest text-white text-[10px] font-bold">
                  {step.n}
                </span>
                <p className="text-xs text-ink-mid">
                  {step.text}{" "}
                  <span className="font-semibold text-ink">{step.icon} {step.desc}</span>
                </p>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}
