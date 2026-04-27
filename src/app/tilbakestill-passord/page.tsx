"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function TilbakestillPassordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [ready, setReady] = useState(false);
  const [checking, setChecking] = useState(true);

  // Re-request form state
  const [requestEmail, setRequestEmail] = useState("");
  const [requestLoading, setRequestLoading] = useState(false);
  const [requestDone, setRequestDone] = useState(false);
  const [requestError, setRequestError] = useState("");

  useEffect(() => {
    async function init() {
      // 1. PKCE flow — code in query string
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get("code");
      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (!error) { setReady(true); setChecking(false); return; }
      }

      // 2. Implicit flow — tokens in hash fragment
      const hashParams = new URLSearchParams(window.location.hash.slice(1));
      const accessToken = hashParams.get("access_token");
      const refreshToken = hashParams.get("refresh_token");
      const type = hashParams.get("type");

      if (type === "recovery" && accessToken && refreshToken) {
        const { error } = await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken });
        if (!error) { setReady(true); setChecking(false); return; }
      }

      // 3. Supabase may have already processed the URL — check existing session
      const { data: { session } } = await supabase.auth.getSession();
      if (session && type === "recovery") {
        setReady(true); setChecking(false); return;
      }

      setChecking(false);
    }

    init();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") { setReady(true); setChecking(false); }
    });
    return () => subscription.unsubscribe();
  }, []);

  async function handleSubmit() {
    if (password !== confirm) { setError("Passordene stemmer ikke overens"); return; }
    if (password.length < 6) { setError("Passordet må være minst 6 tegn"); return; }
    setError("");
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      setDone(true);
      setTimeout(() => router.push("/"), 2000);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Noe gikk galt");
    } finally {
      setLoading(false);
    }
  }

  async function handleReRequest() {
    if (!requestEmail.trim()) return;
    setRequestLoading(true);
    setRequestError("");
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: requestEmail.trim() }),
      });
      const data = await res.json();
      if (!res.ok) { setRequestError(data.error ?? "Noe gikk galt"); return; }
      setRequestDone(true);
    } catch {
      setRequestError("Noe gikk galt. Prøv igjen.");
    } finally {
      setRequestLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-cream flex items-center justify-center px-4">
      <div className="w-full max-w-sm bg-white rounded-2xl border border-border p-8 shadow-sm">
        <h1 className="font-display text-2xl font-bold text-ink mb-2">Nytt passord</h1>

        {done ? (
          <div className="rounded-lg bg-forest-light p-4 text-center mt-4">
            <p className="text-sm font-medium text-forest">Passordet er oppdatert!</p>
            <p className="mt-1 text-xs text-ink-light">Du blir sendt til forsiden...</p>
          </div>
        ) : checking ? (
          <p className="mt-4 text-sm text-ink-light">Verifiserer lenke...</p>
        ) : !ready ? (
          <div className="mt-4 space-y-4">
            <p className="text-sm text-ink-light">
              Lenken er ugyldig eller utløpt. Lenker er engangskoder og gjelder i 1 time.
            </p>
            {requestDone ? (
              <div className="rounded-lg bg-forest-light p-4">
                <p className="text-sm font-medium text-forest">Ny lenke sendt!</p>
                <p className="mt-1 text-xs text-ink-light">Sjekk innboksen din.</p>
              </div>
            ) : (
              <>
                <p className="text-sm font-medium text-ink">Be om ny lenke</p>
                <input
                  type="email"
                  value={requestEmail}
                  onChange={(e) => setRequestEmail(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleReRequest()}
                  placeholder="din@epost.no"
                  className="w-full rounded-lg border border-border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-forest/20 focus:border-forest"
                />
                {requestError && <p className="text-xs text-red-500">{requestError}</p>}
                <button
                  onClick={handleReRequest}
                  disabled={requestLoading || !requestEmail.trim()}
                  className="w-full rounded-lg bg-forest py-2.5 text-sm font-semibold text-white hover:bg-forest-mid transition-colors duration-[120ms] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {requestLoading ? "Sender..." : "Send ny lenke"}
                </button>
              </>
            )}
          </div>
        ) : (
          <div className="space-y-4 mt-4">
            <div>
              <label className="block text-xs font-medium text-ink mb-1.5">Nytt passord</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-lg border border-border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-forest/20 focus:border-forest"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-ink mb-1.5">Gjenta passord</label>
              <input
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                placeholder="••••••••"
                className="w-full rounded-lg border border-border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-forest/20 focus:border-forest"
              />
            </div>
            {error && <p className="text-xs text-red-500">{error}</p>}
            <button
              onClick={handleSubmit}
              disabled={loading || !password || !confirm}
              className="w-full rounded-lg bg-forest py-2.5 text-sm font-semibold text-white hover:bg-forest-mid transition-colors duration-[120ms] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Lagrer..." : "Lagre nytt passord"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
