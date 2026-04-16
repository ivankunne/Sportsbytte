"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";

type Registration = {
  id: number;
  created_at: string;
  status: string;
  club_name: string;
  sport: string | null;
  location: string | null;
  member_count: string | null;
  org_number: string | null;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  role: string | null;
  logo_url: string | null;
  primary_color: string | null;
  secondary_color: string | null;
  description: string | null;
};

const STATUS_LABELS: Record<string, { label: string; dot: string }> = {
  pending:  { label: "Venter",   dot: "bg-amber" },
  approved: { label: "Godkjent", dot: "bg-forest" },
  rejected: { label: "Avvist",   dot: "bg-ink-light" },
};

export default function RegistreringerPage() {
  const [authenticated, setAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState("");

  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Registration | null>(null);
  const [filter, setFilter] = useState<"all" | "pending" | "approved" | "rejected">("all");
  const [updating, setUpdating] = useState(false);

  const fetchRegistrations = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("club_registrations")
      .select("*")
      .order("created_at", { ascending: false });
    setRegistrations((data ?? []) as Registration[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (authenticated) fetchRegistrations();
  }, [authenticated, fetchRegistrations]);

  function handleLogin(e: { preventDefault(): void }) {
    e.preventDefault();
    if (password === "demo2026") {
      setAuthenticated(true);
    } else {
      setAuthError("Feil passord.");
    }
  }

  async function updateStatus(id: number, status: string) {
    setUpdating(true);
    await supabase.from("club_registrations").update({ status }).eq("id", id);
    setRegistrations((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status } : r))
    );
    if (selected?.id === id) setSelected((prev) => prev ? { ...prev, status } : prev);
    setUpdating(false);
  }

  if (!authenticated) {
    return (
      <div className="mx-auto max-w-sm px-4 py-24">
        <div className="bg-white rounded-2xl p-8 border border-border text-center">
          <h1 className="font-display text-xl font-bold text-ink mb-1">Admin</h1>
          <p className="text-sm text-ink-light mb-6">Logg inn for å se klubbregistreringer</p>
          <form onSubmit={handleLogin} className="space-y-4">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Passord"
              className="w-full rounded-lg border border-border px-4 py-2.5 text-sm text-center focus:outline-none focus:ring-2 focus:ring-forest/20 focus:border-forest"
            />
            {authError && <p className="text-xs text-red-600">{authError}</p>}
            <button type="submit" className="w-full rounded-lg bg-forest py-2.5 text-sm font-semibold text-white hover:bg-forest-mid transition-colors duration-[120ms]">
              Logg inn
            </button>
          </form>
        </div>
      </div>
    );
  }

  const filtered = filter === "all" ? registrations : registrations.filter((r) => r.status === filter);
  const counts = {
    all: registrations.length,
    pending: registrations.filter((r) => r.status === "pending").length,
    approved: registrations.filter((r) => r.status === "approved").length,
    rejected: registrations.filter((r) => r.status === "rejected").length,
  };

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink">Klubbregistreringer</h1>
          <p className="text-sm text-ink-light mt-1">{counts.pending} venter på behandling</p>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 border-b border-border mb-6">
        {(["all", "pending", "approved", "rejected"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-colors duration-[120ms] flex items-center gap-2 ${
              filter === f ? "text-forest border-b-2 border-forest -mb-px" : "text-ink-light hover:text-ink"
            }`}
          >
            {{ all: "Alle", pending: "Venter", approved: "Godkjent", rejected: "Avvist" }[f]}
            <span className={`text-[11px] font-bold rounded-full px-1.5 py-0.5 ${filter === f ? "bg-forest text-white" : "bg-cream text-ink-light"}`}>
              {counts[f]}
            </span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-forest border-r-transparent" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-border px-6 py-16 text-center">
          <p className="font-display text-base font-semibold text-ink">Ingen registreringer</p>
          <p className="mt-1 text-sm text-ink-light">Nye søknader dukker opp her.</p>
        </div>
      ) : (
        <div className="flex gap-6">
          {/* List */}
          <div className="flex-1 bg-white rounded-xl border border-border divide-y divide-border overflow-hidden">
            {filtered.map((reg) => (
              <button
                key={reg.id}
                onClick={() => setSelected(reg)}
                className={`w-full px-5 py-4 flex items-center gap-4 text-left transition-colors duration-[120ms] ${
                  selected?.id === reg.id ? "bg-forest-light" : "hover:bg-cream"
                }`}
              >
                <div
                  className="h-10 w-10 rounded-full flex-shrink-0 flex items-center justify-center text-white text-sm font-bold"
                  style={{ backgroundColor: reg.primary_color ?? "#1a3c2e" }}
                >
                  {reg.logo_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={reg.logo_url} alt="" className="h-full w-full object-cover rounded-full" />
                  ) : (
                    reg.club_name.slice(0, 2).toUpperCase()
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-ink truncate">{reg.club_name}</p>
                  <p className="text-xs text-ink-light truncate">{reg.first_name} {reg.last_name} · {reg.location}</p>
                </div>
                <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                  <span className="text-xs text-ink-light">
                    {new Date(reg.created_at).toLocaleDateString("nb-NO", { day: "numeric", month: "short" })}
                  </span>
                  <span className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${STATUS_LABELS[reg.status]?.dot ?? "bg-border"}`} />
                    {STATUS_LABELS[reg.status]?.label ?? reg.status}
                  </span>
                </div>
              </button>
            ))}
          </div>

          {/* Detail panel */}
          {selected && (
            <div className="w-96 flex-shrink-0 bg-white rounded-xl border border-border overflow-hidden self-start sticky top-24">
              {/* Banner preview */}
              <div className="px-5 py-4 flex items-center gap-3" style={{ backgroundColor: selected.primary_color ?? "#1a3c2e" }}>
                <div
                  className="h-10 w-10 rounded-full flex-shrink-0 flex items-center justify-center overflow-hidden border-2 border-white/30 text-white text-sm font-bold"
                  style={{ backgroundColor: selected.secondary_color || selected.primary_color || "#1a3c2e" }}
                >
                  {selected.logo_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={selected.logo_url} alt="" className="h-full w-full object-cover" />
                  ) : (
                    selected.club_name.slice(0, 2).toUpperCase()
                  )}
                </div>
                <span className="text-white font-display font-bold truncate">{selected.club_name}</span>
                <span
                  className="ml-auto rounded-lg px-3 py-1 text-xs font-semibold text-white flex-shrink-0"
                  style={{ backgroundColor: selected.secondary_color || "#e8843a" }}
                >
                  Bli med
                </span>
              </div>

              <div className="p-5 space-y-4">
                {/* Status actions */}
                <div className="flex gap-2">
                  {selected.status !== "approved" && (
                    <button
                      onClick={() => updateStatus(selected.id, "approved")}
                      disabled={updating}
                      className="flex-1 rounded-lg bg-forest py-2 text-xs font-semibold text-white hover:bg-forest-mid transition-colors duration-[120ms] disabled:opacity-50"
                    >
                      Godkjenn
                    </button>
                  )}
                  {selected.status !== "rejected" && (
                    <button
                      onClick={() => updateStatus(selected.id, "rejected")}
                      disabled={updating}
                      className="flex-1 rounded-lg bg-cream py-2 text-xs font-medium text-ink-mid hover:bg-border transition-colors duration-[120ms] disabled:opacity-50"
                    >
                      Avvis
                    </button>
                  )}
                  {selected.status !== "pending" && (
                    <button
                      onClick={() => updateStatus(selected.id, "pending")}
                      disabled={updating}
                      className="flex-1 rounded-lg border border-border py-2 text-xs font-medium text-ink-light hover:bg-cream transition-colors duration-[120ms] disabled:opacity-50"
                    >
                      Sett til venter
                    </button>
                  )}
                </div>

                <div className="space-y-3 text-sm">
                  <Section label="Klubb">
                    <Row k="Idrett" v={selected.sport} />
                    <Row k="Sted" v={selected.location} />
                    <Row k="Antall medlemmer" v={selected.member_count} />
                    <Row k="Org.nummer" v={selected.org_number} />
                  </Section>
                  <Section label="Kontakt">
                    <Row k="Navn" v={`${selected.first_name} ${selected.last_name}`} />
                    <Row k="E-post" v={<a href={`mailto:${selected.email}`} className="text-forest hover:underline">{selected.email}</a>} />
                    <Row k="Telefon" v={selected.phone} />
                    <Row k="Rolle" v={selected.role} />
                  </Section>
                  {selected.description && (
                    <Section label="Beskrivelse">
                      <p className="text-ink-mid text-xs leading-relaxed">{selected.description}</p>
                    </Section>
                  )}
                  <Section label="Farger">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1.5">
                        <span className="h-5 w-5 rounded-full border border-border" style={{ backgroundColor: selected.primary_color ?? "" }} />
                        <span className="text-xs text-ink-mid font-mono">{selected.primary_color ?? "—"}</span>
                      </div>
                      {selected.secondary_color && (
                        <>
                          <span className="text-ink-light text-xs">+</span>
                          <div className="flex items-center gap-1.5">
                            <span className="h-5 w-5 rounded-full border border-border" style={{ backgroundColor: selected.secondary_color }} />
                            <span className="text-xs text-ink-mid font-mono">{selected.secondary_color}</span>
                          </div>
                        </>
                      )}
                    </div>
                  </Section>
                  <p className="text-xs text-ink-light pt-1">
                    Innsendt {new Date(selected.created_at).toLocaleDateString("nb-NO", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-[11px] font-bold uppercase tracking-wider text-ink-light mb-2">{label}</p>
      <div className="space-y-1.5">{children}</div>
    </div>
  );
}

function Row({ k, v }: { k: string; v: React.ReactNode }) {
  if (!v) return null;
  return (
    <div className="flex items-start gap-2">
      <span className="text-xs text-ink-light w-32 flex-shrink-0">{k}</span>
      <span className="text-xs text-ink font-medium">{v}</span>
    </div>
  );
}
