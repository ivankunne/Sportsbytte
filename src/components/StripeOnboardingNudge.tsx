"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { showError } from "@/components/Toaster";

export function StripeOnboardingNudge() {
  const [show, setShow] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [needsLogin, setNeedsLogin] = useState(false);

  useEffect(() => {
    async function check() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("stripe_onboarding_complete")
        .eq("auth_user_id", session.user.id)
        .maybeSingle();

      if (profile && !profile.stripe_onboarding_complete) setShow(true);
    }
    check();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) { setShow(false); setNeedsLogin(false); }
      else check();
    });
    return () => subscription.unsubscribe();
  }, []);

  async function handleConnect() {
    setConnecting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setNeedsLogin(true);
        setConnecting(false);
        return;
      }

      const res = await fetch("/api/stripe/connect", {
        method: "POST",
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      const json = await res.json();

      if (json.url) {
        window.location.href = json.url;
      } else {
        showError(json.error ?? "Kunne ikke opprette Stripe-konto. Prøv igjen.");
        setConnecting(false);
      }
    } catch (err) {
      console.error("Stripe connect error:", err);
      showError("Noe gikk galt. Sjekk internettforbindelsen og prøv igjen.");
      setConnecting(false);
    }
  }

  if (!show) return null;

  return (
    <div className="fixed bottom-20 md:bottom-6 right-4 md:right-6 z-50 w-80 rounded-2xl bg-white border border-border shadow-xl overflow-hidden">
      {/* Green top bar */}
      <div className="h-1 w-full bg-forest" />
      <div className="p-5">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-forest-light">
            <svg className="h-5 w-5 text-forest" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-ink">Aktiver betaling for å selge</p>
            <p className="mt-1 text-xs text-ink-mid leading-relaxed">
              Koble til Stripe for å motta betaling når noen kjøper utstyret ditt. Tar under 2 minutter.
            </p>
          </div>
        </div>

        {needsLogin ? (
          <div className="mt-3 rounded-lg bg-amber-light border border-amber/20 px-3 py-2.5 text-xs text-ink-mid">
            Du må logge inn igjen for å koble til Stripe.{" "}
            <button
              onClick={() => window.location.reload()}
              className="font-semibold text-amber hover:underline"
            >
              Last siden på nytt
            </button>
          </div>
        ) : (
          <button
            onClick={handleConnect}
            disabled={connecting}
            className="mt-3 w-full rounded-lg bg-forest py-2.5 text-xs font-semibold text-white hover:bg-forest-mid transition-colors duration-[120ms] disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {connecting ? (
              <>
                <span className="h-3.5 w-3.5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                Åpner Stripe...
              </>
            ) : (
              "Koble til betaling →"
            )}
          </button>
        )}

        <p className="mt-2 text-center text-[10px] text-ink-light">
          Trygt og sikkert via Stripe · Kreves for å selge
        </p>
      </div>
    </div>
  );
}
