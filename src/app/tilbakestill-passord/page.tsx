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

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY") {
        setReady(true);
        return;
      }
      // INITIAL_SESSION fires immediately on subscribe — if a recovery session is
      // already active (event fired before this component mounted), catch it here
      if (event === "INITIAL_SESSION" && session) {
        const params = new URLSearchParams(window.location.hash.slice(1));
        if (params.get("type") === "recovery") setReady(true);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  async function handleSubmit() {
    if (password !== confirm) {
      setError("Passordene stemmer ikke overens");
      return;
    }
    if (password.length < 6) {
      setError("Passordet må være minst 6 tegn");
      return;
    }
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

  return (
    <div className="min-h-screen bg-cream flex items-center justify-center px-4">
      <div className="w-full max-w-sm bg-white rounded-2xl border border-border p-8 shadow-sm">
        <h1 className="font-display text-2xl font-bold text-ink mb-2">Nytt passord</h1>

        {done ? (
          <div className="rounded-lg bg-forest-light p-4 text-center mt-4">
            <p className="text-sm font-medium text-forest">Passordet er oppdatert!</p>
            <p className="mt-1 text-xs text-ink-light">Du blir sendt til forsiden...</p>
          </div>
        ) : !ready ? (
          <p className="mt-4 text-sm text-ink-light">
            Ugyldig eller utløpt lenke. Be om en ny tilbakestillingslenke fra innloggingssiden.
          </p>
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
