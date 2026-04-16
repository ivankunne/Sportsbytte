"use client";

import { useEffect, useRef } from "react";
import { Logo } from "./Logo";

type Props = {
  onClose: () => void;
};

export function LoginModal({ onClose }: Props) {
  const overlayRef = useRef<HTMLDivElement>(null);

  // Close on Escape
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  return (
    <div
      ref={overlayRef}
      onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-ink/40 backdrop-blur-sm px-4"
    >
      <div className="relative w-full max-w-sm bg-white rounded-2xl shadow-2xl overflow-hidden">

        {/* Coming soon banner */}
        <div className="bg-amber/10 border-b border-amber/20 px-5 py-2.5 flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-amber flex-shrink-0" />
          <p className="text-xs font-medium text-amber">
            Brukerkontoer lanseres snart — følg med!
          </p>
        </div>

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 h-7 w-7 flex items-center justify-center rounded-full text-ink-light hover:bg-cream hover:text-ink transition-colors duration-[120ms]"
          aria-label="Lukk"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="px-6 pt-6 pb-8">
          {/* Logo + heading */}
          <div className="text-center mb-6">
            <Logo variant="light" className="text-xl justify-center mb-3" />
            <h2 className="font-display text-xl font-bold text-ink">Logg inn på Sportsbyttet</h2>
            <p className="mt-1 text-sm text-ink-light">Kjøp og selg brukt sportsutstyr i din klubb</p>
          </div>

          {/* Google button — disabled */}
          <button
            disabled
            className="w-full flex items-center justify-center gap-3 rounded-lg border border-border bg-white px-4 py-2.5 text-sm font-medium text-ink-mid cursor-not-allowed opacity-60"
          >
            <svg className="h-4 w-4 flex-shrink-0" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Fortsett med Google
          </button>

          <div className="flex items-center gap-3 my-4">
            <div className="flex-1 h-px bg-border" />
            <span className="text-xs text-ink-light">eller</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          {/* Email + password — disabled */}
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-ink-mid mb-1.5">E-post</label>
              <input
                type="email"
                disabled
                placeholder="deg@epost.no"
                className="w-full rounded-lg border border-border bg-cream px-4 py-2.5 text-sm text-ink-mid placeholder:text-ink-light/60 cursor-not-allowed"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-ink-mid mb-1.5">Passord</label>
              <input
                type="password"
                disabled
                placeholder="••••••••"
                className="w-full rounded-lg border border-border bg-cream px-4 py-2.5 text-sm text-ink-mid placeholder:text-ink-light/60 cursor-not-allowed"
              />
            </div>
          </div>

          {/* Submit — disabled with coming soon */}
          <div className="mt-4 relative">
            <button
              disabled
              className="w-full rounded-lg bg-forest py-2.5 text-sm font-semibold text-white opacity-40 cursor-not-allowed"
            >
              Logg inn
            </button>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="rounded-full bg-amber px-3 py-0.5 text-[11px] font-bold text-white shadow">
                Kommer snart
              </span>
            </div>
          </div>

          {/* Divider */}
          <div className="mt-5 pt-5 border-t border-border text-center">
            <p className="text-xs text-ink-light mb-3">Foreløpig kan du bruke appen uten konto</p>
            <div className="flex items-center justify-center gap-4">
              <a href="/utforsk" onClick={onClose} className="text-xs font-medium text-forest hover:text-forest-mid transition-colors duration-[120ms]">
                Utforsk utstyr
              </a>
              <span className="text-border">·</span>
              <a href="/selg" onClick={onClose} className="text-xs font-medium text-forest hover:text-forest-mid transition-colors duration-[120ms]">
                Legg ut annonse
              </a>
              <span className="text-border">·</span>
              <a href="/registrer-klubb" onClick={onClose} className="text-xs font-medium text-forest hover:text-forest-mid transition-colors duration-[120ms]">
                Registrer klubb
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
