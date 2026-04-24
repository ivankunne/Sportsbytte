"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export function StripeOnboardingNudge() {
  const [show, setShow] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    async function check() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("stripe_onboarding_complete")
        .eq("auth_user_id", session.user.id)
        .single();

      if (profile && !profile.stripe_onboarding_complete) setShow(true);
    }
    check();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) setShow(false);
    });
    return () => subscription.unsubscribe();
  }, []);

  async function handleConnect() {
    setConnecting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const res = await fetch("/api/stripe/connect", {
        method: "POST",
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      const { url } = await res.json();
      if (url) window.location.href = url;
    } catch {
      setConnecting(false);
    }
  }

  if (!show || dismissed) return null;

  return (
    <div className="fixed bottom-20 md:bottom-6 right-4 md:right-6 z-50 w-80 rounded-2xl bg-white border border-border shadow-xl p-5">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-forest-light">
          <svg className="h-5 w-5 text-forest" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-ink">Aktiver betaling for å selge</p>
          <p className="mt-1 text-xs text-ink-mid leading-relaxed">
            Koble til Stripe for å motta betaling når du selger utstyr. Tar under 2 minutter.
          </p>
          <button
            onClick={handleConnect}
            disabled={connecting}
            className="mt-3 w-full rounded-lg bg-forest py-2 text-xs font-semibold text-white hover:bg-forest-mid transition-colors duration-[120ms] disabled:opacity-60"
          >
            {connecting ? "Åpner Stripe..." : "Koble til betaling →"}
          </button>
        </div>
        <button
          onClick={() => setDismissed(true)}
          className="shrink-0 text-ink-light hover:text-ink transition-colors duration-[120ms] -mt-1 -mr-1"
          aria-label="Lukk"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}
