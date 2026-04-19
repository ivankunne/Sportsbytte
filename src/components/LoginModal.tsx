"use client";

import { useEffect, useRef } from "react";
import { Logo } from "./Logo";
import { AuthForm } from "./AuthForm";

type Props = {
  onClose: () => void;
  onSuccess?: () => void;
};

export function LoginModal({ onClose, onSuccess }: Props) {
  const overlayRef = useRef<HTMLDivElement>(null);

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
      <div className="relative w-full max-w-sm bg-white rounded-2xl shadow-2xl overflow-hidden max-h-[92vh] overflow-y-auto">
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-10 h-7 w-7 flex items-center justify-center rounded-full text-ink-light hover:bg-cream hover:text-ink transition-colors duration-[120ms]"
          aria-label="Lukk"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="px-6 pt-6 pb-8">
          <div className="text-center mb-6">
            <Logo variant="light" className="text-xl justify-center mb-3" />
            <h2 className="font-display text-xl font-bold text-ink">
              Velkommen til Sportsbyttet
            </h2>
            <p className="mt-1 text-sm text-ink-light">
              Kjøp og selg brukt sportsutstyr i din klubb
            </p>
          </div>

          <AuthForm
            onSuccess={() => {
              onSuccess?.();
              onClose();
            }}
          />
        </div>
      </div>
    </div>
  );
}
