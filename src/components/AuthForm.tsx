"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

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
  const [mode, setMode] = useState<"login" | "signup">(initialMode);
  const [form, setForm] = useState({ email: "", password: "", name: "" });
  const [clubSearch, setClubSearch] = useState("");
  const [allClubs, setAllClubs] = useState<Club[]>([]);
  const [selectedClub, setSelectedClub] = useState<Club | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

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

  async function handleSubmit() {
    setError("");
    setLoading(true);
    try {
      if (mode === "login") {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: form.email.trim(),
          password: form.password,
        });
        if (error) throw error;

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
        if (!form.name.trim()) throw new Error("Skriv inn ditt navn");

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

        if (selectedClub && newProfile) {
          await supabase.from("memberships").insert({
            club_id: selectedClub.id,
            profile_id: newProfile.id,
            status: "pending",
            message: "Søkt via registrering",
          });
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

  return (
    <div className="space-y-3">
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
        <label className="block text-xs font-medium text-ink mb-1.5">
          Passord
        </label>
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

      {error && <p className="text-xs text-red-500">{error}</p>}

      <button
        onClick={handleSubmit}
        disabled={
          loading ||
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
              onClick={() => { setMode("login"); setError(""); setSelectedClub(null); setClubSearch(""); }}
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
