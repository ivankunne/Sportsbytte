"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

const LOCK_KEY = "login_rate_limit";
const LOCK_THRESHOLDS = [
  { attempts: 5, durationMs: 5 * 60 * 1000 },
  { attempts: 3, durationMs: 30 * 1000 },
];

type Club = {
  id: number;
  name: string;
  initials: string;
  color: string;
};

export type AuthResult = {
  name: string;
  email: string;
  authUserId: string;
};

type Props = {
  onSuccess: (result: AuthResult) => void;
  initialMode?: "login" | "signup";
};

export function AuthForm({ onSuccess, initialMode = "login" }: Props) {
  const [mode, setMode] = useState<"login" | "signup" | "forgot">(initialMode);
  const [form, setForm] = useState({ email: "", password: "", name: "" });
  const [clubSearch, setClubSearch] = useState("");
  const [allClubs, setAllClubs] = useState<Club[]>([]);
  const [selectedClub, setSelectedClub] = useState<Club | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<"free" | "pro">("free");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lockedUntil, setLockedUntil] = useState<number | null>(null);
  const [lockCountdown, setLockCountdown] = useState(0);

  // Restore lock state from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(LOCK_KEY);
      if (stored) {
        const { attempts, until } = JSON.parse(stored) as { attempts: number; until: number };
        setFailedAttempts(attempts);
        if (until > Date.now()) setLockedUntil(until);
        else localStorage.removeItem(LOCK_KEY);
      }
    } catch {}
  }, []);

  // Countdown timer while locked
  useEffect(() => {
    if (!lockedUntil) return;
    const tick = () => {
      const remaining = Math.ceil((lockedUntil - Date.now()) / 1000);
      if (remaining <= 0) {
        setLockedUntil(null);
        setLockCountdown(0);
        setFailedAttempts(0);
        localStorage.removeItem(LOCK_KEY);
      } else {
        setLockCountdown(remaining);
      }
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [lockedUntil]);

  function recordFailedAttempt() {
    const next = failedAttempts + 1;
    const threshold = LOCK_THRESHOLDS.find((t) => next >= t.attempts);
    const until = threshold ? Date.now() + threshold.durationMs : 0;
    setFailedAttempts(next);
    if (until) {
      setLockedUntil(until);
      localStorage.setItem(LOCK_KEY, JSON.stringify({ attempts: next, until }));
    } else {
      localStorage.setItem(LOCK_KEY, JSON.stringify({ attempts: next, until: 0 }));
    }
  }

  function resetLock() {
    setFailedAttempts(0);
    setLockedUntil(null);
    setLockCountdown(0);
    localStorage.removeItem(LOCK_KEY);
  }

  // Fetch clubs once when entering signup mode
  useEffect(() => {
    if (mode === "signup" && allClubs.length === 0) {
      supabase
        .from("clubs")
        .select("id, name, initials, color")
        .order("members", { ascending: false })
        .then(({ data }) => setAllClubs(data ?? []));
    }
  }, [mode, allClubs.length]);

  const filteredClubs =
    clubSearch.trim().length > 0
      ? allClubs
          .filter((c) =>
            c.name.toLowerCase().includes(clubSearch.toLowerCase())
          )
          .slice(0, 5)
      : [];

  async function handleForgotPassword() {
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: form.email.trim() }),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error ?? "Noe gikk galt");
      }
      setResetSent(true);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Noe gikk galt");
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit() {
    if (lockedUntil && lockedUntil > Date.now()) {
      setError(`For mange mislykkede forsøk. Vent ${lockCountdown} sekunder.`);
      return;
    }
    setError("");
    setLoading(true);
    try {
      if (mode === "login") {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: form.email.trim(),
          password: form.password,
        });
        if (error) {
          recordFailedAttempt();
          throw error;
        }

        resetLock();
        const { data: profile } = await supabase
          .from("profiles")
          .select("name")
          .eq("auth_user_id", data.user.id)
          .single();

        onSuccess({
          name: profile?.name ?? data.user.email?.split("@")[0] ?? "Meg",
          email: data.user.email ?? "",
          authUserId: data.user.id,
        });
      } else {
        if (!form.name.trim() || form.name.trim().length < 2) throw new Error("Navn må være minst 2 tegn");
        if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) throw new Error("Ugyldig e-postadresse");
        if (form.password.length < 8) throw new Error("Passordet må være minst 8 tegn");

        const { data, error } = await supabase.auth.signUp({
          email: form.email.trim(),
          password: form.password,
        });
        if (error) throw error;
        if (!data.user) throw new Error("Registrering feilet");

        const slug =
          form.name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "") +
          "-" +
          Date.now().toString(36);

        const { data: newProfile } = await supabase
          .from("profiles")
          .insert({
            auth_user_id: data.user.id,
            name: form.name.trim(),
            slug,
            club_id: selectedClub?.id ?? null,
          })
          .select("id")
          .single();

        let membershipId: number | null = null;
        if (selectedClub && newProfile) {
          const { data: mem } = await supabase
            .from("memberships")
            .insert({
              club_id: selectedClub.id,
              profile_id: newProfile.id,
              status: "pending",
              message: "Søkt via registrering",
            })
            .select("id")
            .single();
          membershipId = mem?.id ?? null;
        }

        // Fire welcome + membership emails (non-blocking)
        const { data: { session: newSession } } = await supabase.auth.getSession();
        const origin = window.location.origin;
        if (newSession) {
          const authHeaders = {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${newSession.access_token}`,
          };
          fetch(`${origin}/api/notify-welcome`, {
            method: "POST",
            headers: authHeaders,
            body: JSON.stringify({ name: form.name.trim() }),
          }).catch(() => {});

          if (membershipId) {
            fetch(`${origin}/api/notify-membership`, {
              method: "POST",
              headers: authHeaders,
              body: JSON.stringify({ type: "submitted", membership_id: membershipId }),
            }).catch(() => {});
          }

          // Redirect to Stripe Pro checkout if user chose Pro plan
          if (selectedPlan === "pro") {
            const proRes = await fetch(`${origin}/api/stripe/seller-pro-subscribe`, {
              method: "POST",
              headers: { "Authorization": `Bearer ${newSession.access_token}` },
            });
            const proJson = await proRes.json();
            if (proJson.url) {
              window.location.href = proJson.url;
              return;
            }
          }
        }

        onSuccess({
          name: form.name.trim(),
          email: form.email.trim(),
          authUserId: data.user.id,
        });
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Noe gikk galt");
    } finally {
      setLoading(false);
    }
  }

  if (mode === "forgot") {
    return (
      <div className="space-y-3">
        {resetSent ? (
          <div className="rounded-lg bg-forest-light p-4 text-center">
            <p className="text-sm font-medium text-forest">E-post sendt!</p>
            <p className="mt-1 text-xs text-ink-light">
              Sjekk innboksen din for en lenke for å tilbakestille passordet.
            </p>
          </div>
        ) : (
          <>
            <p className="text-sm text-ink-light">
              Skriv inn e-postadressen din, så sender vi en tilbakestillingslenke.
            </p>
            <div>
              <label className="block text-xs font-medium text-ink mb-1.5">E-post</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                onKeyDown={(e) => e.key === "Enter" && handleForgotPassword()}
                placeholder="deg@epost.no"
                className="w-full rounded-lg border border-border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-forest/20 focus:border-forest"
              />
            </div>
            {error && <p className="text-xs text-red-500">{error}</p>}
            <button
              onClick={handleForgotPassword}
              disabled={loading || !form.email.trim()}
              className="w-full rounded-lg bg-forest py-2.5 text-sm font-semibold text-white hover:bg-forest-mid transition-colors duration-[120ms] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Sender..." : "Send tilbakestillingslenke"}
            </button>
          </>
        )}
        <p className="text-center text-sm text-ink-light">
          <button
            onClick={() => { setMode("login"); setError(""); setResetSent(false); }}
            className="font-semibold text-forest hover:underline"
          >
            Tilbake til innlogging
          </button>
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-border" />
        <span className="text-xs text-ink-light">eller</span>
        <div className="h-px flex-1 bg-border" />
      </div>

      {mode === "signup" && (
        <div>
          <label className="block text-xs font-medium text-ink mb-1.5">
            Fullt navn
          </label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            placeholder="Ola Nordmann"
            className="w-full rounded-lg border border-border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-forest/20 focus:border-forest"
          />
        </div>
      )}

      <div>
        <label className="block text-xs font-medium text-ink mb-1.5">
          E-post
        </label>
        <input
          type="email"
          value={form.email}
          onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
          onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          placeholder="deg@epost.no"
          className="w-full rounded-lg border border-border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-forest/20 focus:border-forest"
        />
      </div>

      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="block text-xs font-medium text-ink">Passord</label>
          {mode === "login" && (
            <button
              onClick={() => { setMode("forgot"); setError(""); }}
              className="text-xs text-forest hover:underline"
            >
              Glemt passord?
            </button>
          )}
        </div>
        <input
          type="password"
          value={form.password}
          onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
          onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          placeholder="••••••••"
          className="w-full rounded-lg border border-border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-forest/20 focus:border-forest"
        />
      </div>

      {/* Club search — signup only */}
      {mode === "signup" && (
        <div>
          <label className="block text-xs font-medium text-ink mb-1.5">
            Klubb{" "}
            <span className="font-normal text-ink-light">(valgfritt)</span>
          </label>

          {selectedClub ? (
            <div className="flex items-center gap-3 rounded-lg border-2 border-forest bg-forest-light px-3 py-2.5">
              <div
                className="h-7 w-7 flex-shrink-0 rounded-full flex items-center justify-center text-white text-xs font-bold"
                style={{ backgroundColor: selectedClub.color }}
              >
                {selectedClub.initials}
              </div>
              <span className="flex-1 text-sm font-medium text-ink">
                {selectedClub.name}
              </span>
              <button
                onClick={() => { setSelectedClub(null); setClubSearch(""); }}
                className="text-xs text-ink-light hover:text-ink transition-colors"
              >
                Endre
              </button>
            </div>
          ) : (
            <div>
              <div className="relative">
                <svg
                  className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-light pointer-events-none"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
                  />
                </svg>
                <input
                  type="text"
                  value={clubSearch}
                  onChange={(e) => setClubSearch(e.target.value)}
                  placeholder="Søk etter din klubb..."
                  className="w-full rounded-lg border border-border pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-forest/20 focus:border-forest"
                />
              </div>

              {filteredClubs.length > 0 && (
                <div className="mt-1 rounded-lg border border-border bg-white shadow-sm overflow-hidden">
                  {filteredClubs.map((club) => (
                    <button
                      key={club.id}
                      onClick={() => {
                        setSelectedClub(club);
                        setClubSearch("");
                      }}
                      className="flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm hover:bg-cream transition-colors"
                    >
                      <div
                        className="h-7 w-7 flex-shrink-0 rounded-full flex items-center justify-center text-white text-xs font-bold"
                        style={{ backgroundColor: club.color }}
                      >
                        {club.initials}
                      </div>
                      <span className="text-ink">{club.name}</span>
                    </button>
                  ))}
                </div>
              )}

              {clubSearch.trim() && filteredClubs.length === 0 && (
                <p className="mt-1 px-1 text-xs text-ink-light">
                  Ingen klubber funnet for &ldquo;{clubSearch}&rdquo;
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Plan selector — signup only */}
      {mode === "signup" && (
        <div>
          <label className="block text-xs font-medium text-ink mb-2">Plan</label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setSelectedPlan("free")}
              className={`rounded-xl border-2 p-3 text-left transition-colors ${
                selectedPlan === "free"
                  ? "border-forest bg-forest-light"
                  : "border-border hover:border-forest/40"
              }`}
            >
              <p className="text-sm font-semibold text-ink">Gratis</p>
              <p className="text-xs text-ink-light mt-0.5">5 % gebyr</p>
            </button>
            <button
              type="button"
              onClick={() => setSelectedPlan("pro")}
              className={`rounded-xl border-2 p-3 text-left transition-colors ${
                selectedPlan === "pro"
                  ? "border-amber bg-amber-light"
                  : "border-border hover:border-amber/40"
              }`}
            >
              <div className="flex items-center gap-1.5">
                <p className="text-sm font-semibold text-ink">Selger Pro</p>
                <span className="rounded-full bg-amber px-1.5 py-px text-[9px] font-bold text-white leading-none">PRO</span>
              </div>
              <p className="text-xs text-ink-light mt-0.5">99 kr/mnd · 2 % gebyr</p>
            </button>
          </div>
          {selectedPlan === "pro" && (
            <p className="mt-2 text-xs text-ink-light">
              Du betaler via Stripe etter at kontoen er opprettet.
            </p>
          )}
        </div>
      )}

      {lockedUntil && lockedUntil > Date.now() && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-center">
          <p className="text-xs font-medium text-red-600">
            For mange mislykkede forsøk. Vent {lockCountdown} sekunder.
          </p>
        </div>
      )}

      {error && <p className="text-xs text-red-500">{error}</p>}

      <button
        onClick={handleSubmit}
        disabled={
          loading ||
          !!(lockedUntil && lockedUntil > Date.now()) ||
          !form.email.trim() ||
          !form.password ||
          (mode === "signup" && !form.name.trim())
        }
        className="w-full rounded-lg bg-forest py-2.5 text-sm font-semibold text-white hover:bg-forest-mid transition-colors duration-[120ms] disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading
          ? "Laster..."
          : mode === "login"
          ? "Logg inn"
          : selectedPlan === "pro"
          ? "Opprett konto og gå til betaling →"
          : "Opprett konto"}
      </button>

      {mode === "signup" && selectedClub && (
        <p className="text-center text-xs text-ink-light">
          Du vil søke om opptak i{" "}
          <span className="font-medium text-ink">{selectedClub.name}</span>.
          Klubben godkjenner søknaden din.
        </p>
      )}

      <p className="text-center text-sm text-ink-light">
        {mode === "login" ? (
          <>
            Har du ikke konto?{" "}
            <button
              onClick={() => { setMode("signup"); setError(""); }}
              className="font-semibold text-forest hover:underline"
            >
              Registrer deg
            </button>
          </>
        ) : (
          <>
            Har du allerede konto?{" "}
            <button
              onClick={() => { setMode("login"); setError(""); setSelectedClub(null); setClubSearch(""); setSelectedPlan("free"); }}
              className="font-semibold text-forest hover:underline"
            >
              Logg inn
            </button>
          </>
        )}
      </p>
    </div>
  );
}
