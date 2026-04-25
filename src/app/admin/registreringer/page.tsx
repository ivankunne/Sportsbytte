"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { contrastColor } from "@/lib/color";
import { showSuccess, showError } from "@/components/Toaster";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

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

type Club = {
  id: number;
  name: string;
  slug: string;
  initials: string;
  color: string;
  secondary_color: string | null;
  description: string | null;
  members: number;
  active_listings: number;
  total_sold: number;
  is_membership_gated: boolean;
  is_pro: boolean;
  member_email_domain: string | null;
  created_at: string;
};

type Profile = {
  id: number;
  name: string;
  slug: string;
  avatar: string;
  bio: string;
  club_id: number | null;
  total_sold: number;
  created_at: string;
  vipps_phone: string | null;
  clubs: { name: string; color: string; initials: string } | null;
};

type Listing = {
  id: number;
  title: string;
  price: number;
  category: string;
  listing_type: string;
  is_sold: boolean;
  created_at: string;
  clubs: { name: string } | null;
  profiles: { name: string } | null;
};

type Inquiry = {
  id: number;
  buyer_name: string;
  buyer_email: string;
  message: string;
  created_at: string;
  listing_id: number;
  listings: { title: string; price: number } | null;
};

type Stats = {
  registrations: number;
  clubs: number;
  profiles: number;
  listings: number;
  inquiries: number;
};

type Tab = "registreringer" | "klubber" | "brukere" | "annonser" | "foresporsler" | "meldinger";

const STATUS_LABELS: Record<string, { label: string; dot: string }> = {
  pending: { label: "Venter", dot: "bg-amber" },
  approved: { label: "Godkjent", dot: "bg-forest" },
  rejected: { label: "Avvist", dot: "bg-ink-light" },
};

// ---------------------------------------------------------------------------
// Admin secret — set once on login, sent with every admin API call
// ---------------------------------------------------------------------------

let _adminSecret = "";

// ---------------------------------------------------------------------------
// Shared admin action helper
// ---------------------------------------------------------------------------

async function adminAction(resource: string, action: string, id: number, data?: object) {
  const res = await fetch("/api/admin/action", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-admin-secret": _adminSecret },
    body: JSON.stringify({ resource, action, id, data }),
  });
  if (!res.ok) {
    const j = await res.json();
    throw new Error(j.error ?? "Feil");
  }
  return res.json();
}

// ---------------------------------------------------------------------------
// Spinner
// ---------------------------------------------------------------------------

function Spinner() {
  return (
    <div className="flex justify-center py-20">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-forest border-r-transparent" />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Section / Row helpers (preserved from original)
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Input style constants
// ---------------------------------------------------------------------------

const inputCls =
  "w-full border border-border px-3 py-2 text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-forest/20 focus:border-forest bg-white";
const btnPrimary =
  "rounded-lg bg-forest text-white hover:bg-forest-mid px-4 py-2 text-sm font-semibold transition-colors duration-[120ms] disabled:opacity-50";
const btnDanger =
  "rounded-lg bg-red-600 text-white hover:bg-red-700 px-4 py-2 text-sm font-semibold transition-colors duration-[120ms] disabled:opacity-50";
const btnDangerOutline =
  "rounded-lg border border-red-300 text-red-600 hover:bg-red-50 px-4 py-2 text-sm font-semibold transition-colors duration-[120ms] disabled:opacity-50";

// ---------------------------------------------------------------------------
// Stats card
// ---------------------------------------------------------------------------

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-white rounded-xl border border-border px-5 py-4 flex-1 min-w-0">
      <p className="text-[11px] font-bold uppercase tracking-wider text-ink-light">{label}</p>
      <p className="font-display text-2xl font-bold text-ink mt-1">{value}</p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tab: Registreringer
// ---------------------------------------------------------------------------

function RegistreringerTab({
  registrations,
  loading,
  onRefetch,
}: {
  registrations: Registration[];
  loading: boolean;
  onRefetch: () => void;
}) {
  const [filter, setFilter] = useState<"all" | "pending" | "approved" | "rejected">("all");
  const [selected, setSelected] = useState<Registration | null>(null);
  const [updating, setUpdating] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [search, setSearch] = useState("");

  const byStatus =
    filter === "all" ? registrations : registrations.filter((r) => r.status === filter);

  const filtered = search.trim()
    ? byStatus.filter((r) =>
        [r.club_name, r.first_name, r.last_name, r.email, r.sport]
          .join(" ")
          .toLowerCase()
          .includes(search.toLowerCase())
      )
    : byStatus;

  const counts = {
    all: registrations.length,
    pending: registrations.filter((r) => r.status === "pending").length,
    approved: registrations.filter((r) => r.status === "approved").length,
    rejected: registrations.filter((r) => r.status === "rejected").length,
  };

  async function updateStatus(id: number, status: string) {
    setUpdating(true);
    const reg = registrations.find((r) => r.id === id);

    if (status === "approved" && reg) {
      const res = await fetch("/api/approve-club", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-secret": _adminSecret },
        body: JSON.stringify(reg),
      });
      if (!res.ok) {
        const data = await res.json();
        showError(`Kunne ikke opprette klubb: ${data.error}`);
        setUpdating(false);
        return;
      }
    }

    await supabase.from("club_registrations").update({ status }).eq("id", id);
    const labels: Record<string, string> = {
      approved: "Klubb godkjent og opprettet!",
      rejected: "Søknad avvist.",
      pending: "Status satt til venter.",
    };
    showSuccess(labels[status] ?? "Status oppdatert.");
    setUpdating(false);
    onRefetch();
  }

  async function handleDelete(id: number) {
    try {
      await adminAction("registration", "delete", id);
      showSuccess("Søknad slettet.");
      setSelected(null);
      setConfirmDelete(false);
      onRefetch();
    } catch (e: unknown) {
      showError(e instanceof Error ? e.message : "Feil ved sletting.");
    }
  }

  if (loading) return <Spinner />;

  if (filtered.length === 0 && registrations.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-border px-6 py-16 text-center">
        <p className="font-display text-base font-semibold text-ink">Ingen registreringer</p>
        <p className="mt-1 text-sm text-ink-light">Nye søknader dukker opp her.</p>
      </div>
    );
  }

  return (
    <div>
      {/* Search */}
      <div className="relative mb-4">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-light" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
        </svg>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Søk etter klubbnavn, kontaktperson, e-post..."
          className="w-full rounded-lg border border-border bg-white pl-9 pr-4 py-2.5 text-sm text-ink placeholder:text-ink-light focus:outline-none focus:ring-2 focus:ring-forest/20 focus:border-forest"
        />
      </div>

      {/* Filter pills */}
      <div className="flex gap-1 border-b border-border mb-6">
        {(["all", "pending", "approved", "rejected"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-colors duration-[120ms] flex items-center gap-2 ${
              filter === f
                ? "text-forest border-b-2 border-forest -mb-px"
                : "text-ink-light hover:text-ink"
            }`}
          >
            {{ all: "Alle", pending: "Venter", approved: "Godkjent", rejected: "Avvist" }[f]}
            <span
              className={`text-[11px] font-bold rounded-full px-1.5 py-0.5 ${
                filter === f ? "bg-forest text-white" : "bg-cream text-ink-light"
              }`}
            >
              {counts[f]}
            </span>
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-border px-6 py-16 text-center">
          <p className="font-display text-base font-semibold text-ink">Ingen resultater</p>
          <p className="mt-1 text-sm text-ink-light">
            Ingen søknader med denne statusen.
          </p>
        </div>
      ) : (
        <div className="flex gap-6">
          {/* List */}
          <div className="flex-1 bg-white rounded-xl border border-border divide-y divide-border overflow-hidden">
            {filtered.map((reg) => (
              <button
                key={reg.id}
                onClick={() => {
                  setSelected(reg);
                  setConfirmDelete(false);
                }}
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
                    <img
                      src={reg.logo_url}
                      alt=""
                      className="h-full w-full object-cover rounded-full"
                    />
                  ) : (
                    reg.club_name.slice(0, 2).toUpperCase()
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-ink truncate">{reg.club_name}</p>
                  <p className="text-xs text-ink-light truncate">
                    {reg.first_name} {reg.last_name} · {reg.location}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                  <span className="text-xs text-ink-light">
                    {new Date(reg.created_at).toLocaleDateString("nb-NO", {
                      day: "numeric",
                      month: "short",
                    })}
                  </span>
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider">
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${
                        STATUS_LABELS[reg.status]?.dot ?? "bg-border"
                      }`}
                    />
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
              <div
                className="px-5 py-4 flex items-center gap-3"
                style={{ backgroundColor: selected.primary_color ?? "#1a3c2e" }}
              >
                <div
                  className="h-10 w-10 rounded-full flex-shrink-0 flex items-center justify-center overflow-hidden border-2 border-white/30 text-white text-sm font-bold"
                  style={{
                    backgroundColor:
                      selected.secondary_color || selected.primary_color || "#1a3c2e",
                  }}
                >
                  {selected.logo_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={selected.logo_url}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    selected.club_name.slice(0, 2).toUpperCase()
                  )}
                </div>
                <span className="text-white font-display font-bold truncate">
                  {selected.club_name}
                </span>
                <span
                  className="ml-auto rounded-lg px-3 py-1 text-xs font-semibold text-white flex-shrink-0"
                  style={{
                    backgroundColor: selected.secondary_color || "#e8843a",
                    color: contrastColor(selected.secondary_color || "#e8843a"),
                  }}
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
                    <Row
                      k="E-post"
                      v={
                        <a
                          href={`mailto:${selected.email}`}
                          className="text-forest hover:underline"
                        >
                          {selected.email}
                        </a>
                      }
                    />
                    <Row k="Telefon" v={selected.phone} />
                    <Row k="Rolle" v={selected.role} />
                  </Section>
                  {selected.description && (
                    <Section label="Beskrivelse">
                      <p className="text-ink-mid text-xs leading-relaxed">
                        {selected.description}
                      </p>
                    </Section>
                  )}
                  <Section label="Farger">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1.5">
                        <span
                          className="h-5 w-5 rounded-full border border-border"
                          style={{ backgroundColor: selected.primary_color ?? "" }}
                        />
                        <span className="text-xs text-ink-mid font-mono">
                          {selected.primary_color ?? "—"}
                        </span>
                      </div>
                      {selected.secondary_color && (
                        <>
                          <span className="text-ink-light text-xs">+</span>
                          <div className="flex items-center gap-1.5">
                            <span
                              className="h-5 w-5 rounded-full border border-border"
                              style={{ backgroundColor: selected.secondary_color }}
                            />
                            <span className="text-xs text-ink-mid font-mono">
                              {selected.secondary_color}
                            </span>
                          </div>
                        </>
                      )}
                    </div>
                  </Section>
                  <p className="text-xs text-ink-light pt-1">
                    Innsendt{" "}
                    {new Date(selected.created_at).toLocaleDateString("nb-NO", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>

                {/* Delete danger zone */}
                <div className="pt-2 border-t border-border">
                  {!confirmDelete ? (
                    <button
                      onClick={() => setConfirmDelete(true)}
                      className={btnDangerOutline + " w-full text-center"}
                    >
                      Slett søknad
                    </button>
                  ) : (
                    <div className="space-y-2">
                      <p className="text-xs text-red-600 font-medium">
                        Er du sikker? Dette sletter søknaden permanent.
                      </p>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleDelete(selected.id)}
                          className={btnDanger + " flex-1"}
                        >
                          Ja, slett
                        </button>
                        <button
                          onClick={() => setConfirmDelete(false)}
                          className="flex-1 rounded-lg border border-border px-4 py-2 text-sm text-ink-mid hover:bg-cream transition-colors duration-[120ms]"
                        >
                          Avbryt
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tab: Klubber
// ---------------------------------------------------------------------------

function KlubberTab() {
  const [clubs, setClubs] = useState<Club[]>([]);
  const [loading, setLoading] = useState(true);
  const [editClub, setEditClub] = useState<Club | null>(null);
  const [form, setForm] = useState<Partial<Club>>({});
  const [search, setSearch] = useState("");
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const fetchClubs = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("clubs")
      .select("*")
      .order("created_at", { ascending: false });
    setClubs((data ?? []) as Club[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchClubs();
  }, [fetchClubs]);

  function openEdit(club: Club) {
    setEditClub(club);
    setForm({
      name: club.name,
      description: club.description ?? "",
      color: club.color,
      secondary_color: club.secondary_color ?? "",
      members: club.members,
      is_membership_gated: club.is_membership_gated,
      is_pro: club.is_pro,
      member_email_domain: club.member_email_domain ?? "",
    });
    setConfirmDelete(false);
  }

  async function handleSave() {
    if (!editClub) return;
    setSaving(true);
    try {
      await adminAction("club", "update", editClub.id, {
        name: form.name,
        description: form.description || null,
        color: form.color,
        secondary_color: form.secondary_color || null,
        members: form.members,
        is_membership_gated: form.is_membership_gated,
        is_pro: form.is_pro ?? false,
        member_email_domain: form.member_email_domain || null,
      });
      showSuccess("Klubb oppdatert.");
      await fetchClubs();
      setEditClub(null);
    } catch (e: unknown) {
      showError(e instanceof Error ? e.message : "Feil ved lagring.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!editClub) return;
    try {
      await adminAction("club", "delete", editClub.id);
      showSuccess("Klubb slettet.");
      setEditClub(null);
      setConfirmDelete(false);
      await fetchClubs();
    } catch (e: unknown) {
      showError(e instanceof Error ? e.message : "Feil ved sletting.");
    }
  }

  if (loading) return <Spinner />;

  const filteredClubs = search.trim()
    ? clubs.filter((c) =>
        [c.name, c.slug, c.description ?? ""]
          .join(" ")
          .toLowerCase()
          .includes(search.toLowerCase())
      )
    : clubs;

  return (
    <div className="flex gap-6">
      {/* Table */}
      <div className="flex-1 min-w-0">
        {/* Search */}
        <div className="relative mb-4">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-light" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Søk etter klubb..."
            className="w-full rounded-lg border border-border bg-white pl-9 pr-4 py-2.5 text-sm text-ink placeholder:text-ink-light focus:outline-none focus:ring-2 focus:ring-forest/20 focus:border-forest"
          />
        </div>
        <div className="bg-white rounded-xl border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-cream">
              <tr>
                <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-ink-light">
                  Klubb
                </th>
                <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-ink-light hidden md:table-cell">
                  Slug
                </th>
                <th className="px-4 py-3 text-right text-[11px] font-bold uppercase tracking-wider text-ink-light">
                  Medl.
                </th>
                <th className="px-4 py-3 text-right text-[11px] font-bold uppercase tracking-wider text-ink-light hidden lg:table-cell">
                  Annonser
                </th>
                <th className="px-4 py-3 text-right text-[11px] font-bold uppercase tracking-wider text-ink-light hidden lg:table-cell">
                  Solgt
                </th>
                <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-ink-light hidden xl:table-cell">
                  Opprettet
                </th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredClubs.map((club) => (
                <tr
                  key={club.id}
                  className={`hover:bg-cream transition-colors duration-[120ms] cursor-pointer ${
                    editClub?.id === club.id ? "bg-forest-light" : ""
                  }`}
                  onClick={() => openEdit(club)}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div
                        className="h-8 w-8 rounded-lg flex-shrink-0 flex items-center justify-center text-white text-xs font-bold"
                        style={{ backgroundColor: club.color }}
                      >
                        {club.initials}
                      </div>
                      <span className="font-medium text-ink truncate max-w-[140px]">
                        {club.name}
                      </span>
                      {club.is_pro && (
                        <span className="inline-flex items-center rounded-full bg-amber/20 border border-amber/40 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-amber flex-shrink-0">
                          Pro
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-ink-mid font-mono text-xs hidden md:table-cell">
                    {club.slug}
                  </td>
                  <td className="px-4 py-3 text-right text-ink-mid">{club.members}</td>
                  <td className="px-4 py-3 text-right text-ink-mid hidden lg:table-cell">
                    {club.active_listings}
                  </td>
                  <td className="px-4 py-3 text-right text-ink-mid hidden lg:table-cell">
                    {club.total_sold}
                  </td>
                  <td className="px-4 py-3 text-ink-light text-xs hidden xl:table-cell">
                    {new Date(club.created_at).toLocaleDateString("nb-NO", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2 justify-end">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openEdit(club);
                        }}
                        className="rounded-lg border border-border px-3 py-1 text-xs text-ink-mid hover:bg-cream transition-colors duration-[120ms]"
                      >
                        Rediger
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {clubs.length === 0 && (
            <div className="px-6 py-16 text-center">
              <p className="text-sm text-ink-light">Ingen klubber enda.</p>
            </div>
          )}
        </div>
      </div>

      {/* Edit panel */}
      {editClub && (
        <div className="w-80 flex-shrink-0 bg-white rounded-xl border border-border overflow-hidden self-start sticky top-24">
          {/* Color preview banner */}
          <div
            className="px-5 py-4 flex items-center gap-3"
            style={{ backgroundColor: form.color ?? editClub.color }}
          >
            <div
              className="h-10 w-10 rounded-lg flex-shrink-0 flex items-center justify-center text-white text-sm font-bold border-2 border-white/30"
              style={{ backgroundColor: form.secondary_color || form.color || editClub.color }}
            >
              {editClub.initials}
            </div>
            <span className="text-white font-display font-bold truncate">
              {form.name || editClub.name}
            </span>
          </div>

          <div className="p-5 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-ink-mid mb-1">Navn</label>
              <input
                type="text"
                value={form.name ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                className={inputCls}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-ink-mid mb-1">Beskrivelse</label>
              <textarea
                value={form.description ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                rows={3}
                className={inputCls}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-ink-mid mb-1">
                  Primærfarge
                </label>
                <input
                  type="color"
                  value={form.color ?? "#1a3c2e"}
                  onChange={(e) => setForm((f) => ({ ...f, color: e.target.value }))}
                  className="w-full h-9 rounded-lg border border-border cursor-pointer"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-ink-mid mb-1">
                  Sekundærfarge
                </label>
                <input
                  type="color"
                  value={form.secondary_color ?? "#e8843a"}
                  onChange={(e) => setForm((f) => ({ ...f, secondary_color: e.target.value }))}
                  className="w-full h-9 rounded-lg border border-border cursor-pointer"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-ink-mid mb-1">
                Antall medlemmer
              </label>
              <input
                type="number"
                value={form.members ?? 0}
                onChange={(e) =>
                  setForm((f) => ({ ...f, members: parseInt(e.target.value) || 0 }))
                }
                className={inputCls}
              />
            </div>
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="gated"
                checked={form.is_membership_gated ?? false}
                onChange={(e) =>
                  setForm((f) => ({ ...f, is_membership_gated: e.target.checked }))
                }
                className="h-4 w-4 rounded border-border text-forest focus:ring-forest/20"
              />
              <label htmlFor="gated" className="text-sm text-ink-mid cursor-pointer">
                Lukket medlemskap
              </label>
            </div>
            <div className="flex items-center gap-3 rounded-lg bg-amber-light border border-amber/30 px-3 py-2.5">
              <input
                type="checkbox"
                id="is_pro"
                checked={form.is_pro ?? false}
                onChange={(e) =>
                  setForm((f) => ({ ...f, is_pro: e.target.checked }))
                }
                className="h-4 w-4 rounded border-amber/40 text-amber focus:ring-amber/20"
              />
              <label htmlFor="is_pro" className="text-sm font-semibold text-amber cursor-pointer">
                Pro-klubb
              </label>
              <span className="text-xs text-amber/70 ml-auto">2% gebyr · featured</span>
            </div>
            <div>
              <label className="block text-xs font-semibold text-ink-mid mb-1">
                E-postdomene for medlemmer
              </label>
              <input
                type="text"
                value={form.member_email_domain ?? ""}
                onChange={(e) =>
                  setForm((f) => ({ ...f, member_email_domain: e.target.value }))
                }
                placeholder="klubb.no"
                className={inputCls}
              />
            </div>

            <div className="flex gap-2 pt-1">
              <button onClick={handleSave} disabled={saving} className={btnPrimary + " flex-1"}>
                {saving ? "Lagrer..." : "Lagre"}
              </button>
              <a
                href={`/klubb/${editClub.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-lg border border-border px-3 py-2 text-xs text-ink-mid hover:bg-cream transition-colors duration-[120ms] flex items-center"
              >
                Se side
              </a>
            </div>

            {/* Danger zone */}
            <div className="pt-3 border-t border-border">
              <p className="text-[11px] font-bold uppercase tracking-wider text-ink-light mb-3">
                Faresone
              </p>
              {!confirmDelete ? (
                <button
                  onClick={() => setConfirmDelete(true)}
                  className={btnDangerOutline + " w-full text-center"}
                >
                  Slett klubb
                </button>
              ) : (
                <div className="space-y-2">
                  <p className="text-xs text-red-600 font-medium">
                    Er du sikker? Dette sletter klubben permanent.
                  </p>
                  <div className="flex gap-2">
                    <button onClick={handleDelete} className={btnDanger + " flex-1"}>
                      Ja, slett
                    </button>
                    <button
                      onClick={() => setConfirmDelete(false)}
                      className="flex-1 rounded-lg border border-border px-4 py-2 text-sm text-ink-mid hover:bg-cream transition-colors duration-[120ms]"
                    >
                      Avbryt
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tab: Brukere
// ---------------------------------------------------------------------------

function BrukereTab() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [clubs, setClubs] = useState<Club[]>([]);
  const [loading, setLoading] = useState(true);
  const [editProfile, setEditProfile] = useState<Profile | null>(null);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState<{
    name: string;
    bio: string;
    club_id: number | null;
    total_sold: number;
    vipps_phone: string;
  }>({ name: "", bio: "", club_id: null, total_sold: 0, vipps_phone: "" });
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const [{ data: profilesData }, { data: clubsData }] = await Promise.all([
      supabase
        .from("profiles")
        .select("*, clubs(name, color, initials)")
        .order("created_at", { ascending: false }),
      supabase.from("clubs").select("*").order("name"),
    ]);
    setProfiles((profilesData ?? []) as Profile[]);
    setClubs((clubsData ?? []) as Club[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  function openEdit(profile: Profile) {
    setEditProfile(profile);
    setForm({
      name: profile.name,
      bio: profile.bio,
      club_id: profile.club_id,
      total_sold: profile.total_sold,
      vipps_phone: profile.vipps_phone ?? "",
    });
    setConfirmDelete(false);
  }

  async function handleSave() {
    if (!editProfile) return;
    setSaving(true);
    try {
      await adminAction("profile", "update", editProfile.id, form);
      showSuccess("Bruker oppdatert.");
      await fetchData();
      setEditProfile(null);
    } catch (e: unknown) {
      showError(e instanceof Error ? e.message : "Feil ved lagring.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!editProfile) return;
    try {
      await adminAction("profile", "delete", editProfile.id);
      showSuccess("Bruker slettet.");
      setEditProfile(null);
      setConfirmDelete(false);
      await fetchData();
    } catch (e: unknown) {
      showError(e instanceof Error ? e.message : "Feil ved sletting.");
    }
  }

  const filteredProfiles = search.trim()
    ? profiles.filter((p) =>
        [p.name, p.slug, p.bio, p.vipps_phone ?? ""]
          .join(" ")
          .toLowerCase()
          .includes(search.toLowerCase())
      )
    : profiles;

  if (loading) return <Spinner />;

  return (
    <div className="flex gap-6">
      {/* Table */}
      <div className="flex-1 min-w-0">
        {/* Search */}
        <div className="relative mb-4">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-light" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Søk etter bruker, slug..."
            className="w-full rounded-lg border border-border bg-white pl-9 pr-4 py-2.5 text-sm text-ink placeholder:text-ink-light focus:outline-none focus:ring-2 focus:ring-forest/20 focus:border-forest"
          />
        </div>
        <div className="bg-white rounded-xl border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-cream">
              <tr>
                <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-ink-light">
                  Bruker
                </th>
                <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-ink-light hidden md:table-cell">
                  Klubb
                </th>
                <th className="px-4 py-3 text-right text-[11px] font-bold uppercase tracking-wider text-ink-light">
                  Solgt
                </th>
                <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-ink-light hidden xl:table-cell">
                  Opprettet
                </th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredProfiles.map((profile) => (
                <tr
                  key={profile.id}
                  className={`hover:bg-cream transition-colors duration-[120ms] cursor-pointer ${
                    editProfile?.id === profile.id ? "bg-forest-light" : ""
                  }`}
                  onClick={() => openEdit(profile)}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full flex-shrink-0 flex items-center justify-center bg-cream border border-border text-base">
                        {profile.avatar}
                      </div>
                      <div>
                        <p className="font-medium text-ink">{profile.name}</p>
                        <p className="text-xs text-ink-light font-mono">{profile.slug}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    {profile.clubs ? (
                      <div className="flex items-center gap-2">
                        <div
                          className="h-5 w-5 rounded flex-shrink-0 flex items-center justify-center text-white text-[9px] font-bold"
                          style={{ backgroundColor: profile.clubs.color }}
                        >
                          {profile.clubs.initials}
                        </div>
                        <span className="text-ink-mid text-xs">{profile.clubs.name}</span>
                      </div>
                    ) : (
                      <span className="text-ink-light text-xs">Ingen</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right text-ink-mid">{profile.total_sold}</td>
                  <td className="px-4 py-3 text-ink-light text-xs hidden xl:table-cell">
                    {new Date(profile.created_at).toLocaleDateString("nb-NO", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        openEdit(profile);
                      }}
                      className="rounded-lg border border-border px-3 py-1 text-xs text-ink-mid hover:bg-cream transition-colors duration-[120ms]"
                    >
                      Rediger
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {profiles.length === 0 && (
            <div className="px-6 py-16 text-center">
              <p className="text-sm text-ink-light">Ingen brukere enda.</p>
            </div>
          )}
        </div>
      </div>

      {/* Edit panel */}
      {editProfile && (
        <div className="w-80 flex-shrink-0 bg-white rounded-xl border border-border overflow-hidden self-start sticky top-24">
          <div className="bg-cream px-5 py-4 flex items-center gap-3 border-b border-border">
            <div className="h-10 w-10 rounded-full flex-shrink-0 flex items-center justify-center bg-white border border-border text-2xl">
              {editProfile.avatar}
            </div>
            <div>
              <p className="font-display font-bold text-ink text-sm">{editProfile.name}</p>
              <p className="text-xs text-ink-light font-mono">{editProfile.slug}</p>
            </div>
          </div>

          <div className="p-5 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-ink-mid mb-1">Navn</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                className={inputCls}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-ink-mid mb-1">Bio</label>
              <textarea
                value={form.bio}
                onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))}
                rows={3}
                className={inputCls}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-ink-mid mb-1">Klubb</label>
              <select
                value={form.club_id ?? ""}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    club_id: e.target.value ? parseInt(e.target.value) : null,
                  }))
                }
                className={inputCls}
              >
                <option value="">Ingen</option>
                {clubs.map((club) => (
                  <option key={club.id} value={club.id}>
                    {club.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-ink-mid mb-1">Antall solgt</label>
              <input
                type="number"
                value={form.total_sold}
                onChange={(e) =>
                  setForm((f) => ({ ...f, total_sold: parseInt(e.target.value) || 0 }))
                }
                className={inputCls}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-ink-mid mb-1">Telefonnummer</label>
              <input
                type="tel"
                value={form.vipps_phone}
                onChange={(e) => setForm((f) => ({ ...f, vipps_phone: e.target.value }))}
                placeholder="4712345678"
                className={inputCls}
              />
            </div>

            <div className="flex gap-2 pt-1">
              <button onClick={handleSave} disabled={saving} className={btnPrimary + " flex-1"}>
                {saving ? "Lagrer..." : "Lagre"}
              </button>
              <a
                href={`/profil/${editProfile.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-lg border border-border px-3 py-2 text-xs text-ink-mid hover:bg-cream transition-colors duration-[120ms] flex items-center"
              >
                Se profil
              </a>
            </div>

            {/* Danger zone */}
            <div className="pt-3 border-t border-border">
              <p className="text-[11px] font-bold uppercase tracking-wider text-ink-light mb-3">
                Faresone
              </p>
              {!confirmDelete ? (
                <button
                  onClick={() => setConfirmDelete(true)}
                  className={btnDangerOutline + " w-full text-center"}
                >
                  Slett bruker
                </button>
              ) : (
                <div className="space-y-2">
                  <p className="text-xs text-red-600 font-medium">
                    Er du sikker? Dette sletter brukeren permanent.
                  </p>
                  <div className="flex gap-2">
                    <button onClick={handleDelete} className={btnDanger + " flex-1"}>
                      Ja, slett
                    </button>
                    <button
                      onClick={() => setConfirmDelete(false)}
                      className="flex-1 rounded-lg border border-border px-4 py-2 text-sm text-ink-mid hover:bg-cream transition-colors duration-[120ms]"
                    >
                      Avbryt
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tab: Annonser
// ---------------------------------------------------------------------------

function AnnonsertTab() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  const [search, setSearch] = useState("");

  const fetchListings = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("listings")
      .select("*, clubs(name), profiles!listings_seller_id_fkey(name)")
      .order("created_at", { ascending: false });
    setListings((data ?? []) as Listing[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchListings();
  }, [fetchListings]);

  async function toggleSold(listing: Listing) {
    try {
      await adminAction("listing", "update", listing.id, { is_sold: !listing.is_sold });
      showSuccess(listing.is_sold ? "Merket som aktiv." : "Merket som solgt.");
      await fetchListings();
    } catch (e: unknown) {
      showError(e instanceof Error ? e.message : "Feil.");
    }
  }

  async function handleDelete(id: number) {
    try {
      await adminAction("listing", "delete", id);
      showSuccess("Annonse slettet.");
      setConfirmDeleteId(null);
      await fetchListings();
    } catch (e: unknown) {
      showError(e instanceof Error ? e.message : "Feil ved sletting.");
    }
  }

  const typeLabel: Record<string, string> = {
    standard: "Vanlig",
    iso: "ISO",
    bulk: "Bulk",
  };

  const filteredListings = search.trim()
    ? listings.filter((l) =>
        [l.title, l.category, l.profiles?.name ?? "", l.clubs?.name ?? ""]
          .join(" ")
          .toLowerCase()
          .includes(search.toLowerCase())
      )
    : listings;

  if (loading) return <Spinner />;

  return (
    <div>
      {/* Search */}
      <div className="relative mb-4">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-light" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
        </svg>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Søk etter tittel, selger, klubb..."
          className="w-full rounded-lg border border-border bg-white pl-9 pr-4 py-2.5 text-sm text-ink placeholder:text-ink-light focus:outline-none focus:ring-2 focus:ring-forest/20 focus:border-forest"
        />
      </div>
    <div className="bg-white rounded-xl border border-border overflow-hidden">
      <table className="w-full text-sm">
        <thead className="border-b border-border bg-cream">
          <tr>
            <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-ink-light">
              Tittel
            </th>
            <th className="px-4 py-3 text-right text-[11px] font-bold uppercase tracking-wider text-ink-light">
              Pris
            </th>
            <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-ink-light hidden md:table-cell">
              Selger
            </th>
            <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-ink-light hidden lg:table-cell">
              Klubb
            </th>
            <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-ink-light hidden lg:table-cell">
              Type
            </th>
            <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-ink-light">
              Status
            </th>
            <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-ink-light hidden xl:table-cell">
              Dato
            </th>
            <th className="px-4 py-3" />
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {filteredListings.map((listing) => (
            <tr key={listing.id} className="hover:bg-cream transition-colors duration-[120ms]">
              <td className="px-4 py-3">
                <p className="font-medium text-ink truncate max-w-[180px]">{listing.title}</p>
                <p className="text-xs text-ink-light capitalize hidden sm:block">
                  {listing.category}
                </p>
              </td>
              <td className="px-4 py-3 text-right font-medium text-ink">
                {listing.price.toLocaleString("nb-NO")} kr
              </td>
              <td className="px-4 py-3 text-ink-mid hidden md:table-cell">
                {listing.profiles?.name ?? "—"}
              </td>
              <td className="px-4 py-3 text-ink-mid hidden lg:table-cell">
                {listing.clubs?.name ?? "—"}
              </td>
              <td className="px-4 py-3 hidden lg:table-cell">
                <span className="text-xs text-ink-mid">
                  {typeLabel[listing.listing_type] ?? listing.listing_type}
                </span>
              </td>
              <td className="px-4 py-3">
                <span
                  className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                    listing.is_sold
                      ? "bg-cream text-ink-light"
                      : "bg-forest-light text-forest"
                  }`}
                >
                  {listing.is_sold ? "Solgt" : "Aktiv"}
                </span>
              </td>
              <td className="px-4 py-3 text-ink-light text-xs hidden xl:table-cell">
                {new Date(listing.created_at).toLocaleDateString("nb-NO", {
                  day: "numeric",
                  month: "short",
                })}
              </td>
              <td className="px-4 py-3">
                {confirmDeleteId === listing.id ? (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleDelete(listing.id)}
                      className="rounded-lg bg-red-600 text-white hover:bg-red-700 px-2 py-1 text-xs font-semibold transition-colors duration-[120ms]"
                    >
                      Slett
                    </button>
                    <button
                      onClick={() => setConfirmDeleteId(null)}
                      className="rounded-lg border border-border px-2 py-1 text-xs text-ink-mid hover:bg-cream transition-colors duration-[120ms]"
                    >
                      Avbryt
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 justify-end">
                    <button
                      onClick={() => toggleSold(listing)}
                      className="rounded-lg border border-border px-2 py-1 text-xs text-ink-mid hover:bg-cream transition-colors duration-[120ms] whitespace-nowrap"
                    >
                      {listing.is_sold ? "Aktiver" : "Merk solgt"}
                    </button>
                    <button
                      onClick={() => setConfirmDeleteId(listing.id)}
                      className="rounded-lg border border-red-200 text-red-500 hover:bg-red-50 px-2 py-1 text-xs transition-colors duration-[120ms]"
                    >
                      Slett
                    </button>
                  </div>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {filteredListings.length === 0 && (
        <div className="px-6 py-16 text-center">
          <p className="text-sm text-ink-light">{search ? "Ingen treff på søket." : "Ingen annonser enda."}</p>
        </div>
      )}
    </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tab: Forespørsler
// ---------------------------------------------------------------------------

function ForesporslerTab() {
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  const [search, setSearch] = useState("");

  const fetchInquiries = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("inquiries")
      .select("*, listings(title, price)")
      .order("created_at", { ascending: false });
    setInquiries((data ?? []) as Inquiry[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchInquiries();
  }, [fetchInquiries]);

  async function handleDelete(id: number) {
    try {
      await adminAction("inquiry", "delete", id);
      showSuccess("Forespørsel slettet.");
      setConfirmDeleteId(null);
      await fetchInquiries();
    } catch (e: unknown) {
      showError(e instanceof Error ? e.message : "Feil ved sletting.");
    }
  }

  const filteredInquiries = search.trim()
    ? inquiries.filter((i) =>
        [i.buyer_name, i.buyer_email, i.message, i.listings?.title ?? ""]
          .join(" ")
          .toLowerCase()
          .includes(search.toLowerCase())
      )
    : inquiries;

  if (loading) return <Spinner />;

  return (
    <div>
      {/* Search */}
      <div className="relative mb-4">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-light" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
        </svg>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Søk etter navn, e-post, melding..."
          className="w-full rounded-lg border border-border bg-white pl-9 pr-4 py-2.5 text-sm text-ink placeholder:text-ink-light focus:outline-none focus:ring-2 focus:ring-forest/20 focus:border-forest"
        />
      </div>
    <div className="bg-white rounded-xl border border-border overflow-hidden">
      <table className="w-full text-sm">
        <thead className="border-b border-border bg-cream">
          <tr>
            <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-ink-light">
              Kjøper
            </th>
            <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-ink-light hidden md:table-cell">
              E-post
            </th>
            <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-ink-light hidden lg:table-cell">
              Annonse
            </th>
            <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-ink-light">
              Melding
            </th>
            <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-ink-light hidden xl:table-cell">
              Dato
            </th>
            <th className="px-4 py-3" />
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {filteredInquiries.map((inquiry) => (
            <tr key={inquiry.id} className="hover:bg-cream transition-colors duration-[120ms]">
              <td className="px-4 py-3">
                <p className="font-medium text-ink">{inquiry.buyer_name}</p>
              </td>
              <td className="px-4 py-3 text-ink-mid hidden md:table-cell">
                <a
                  href={`mailto:${inquiry.buyer_email}`}
                  className="text-forest hover:underline"
                >
                  {inquiry.buyer_email}
                </a>
              </td>
              <td className="px-4 py-3 hidden lg:table-cell">
                {inquiry.listings ? (
                  <a
                    href={`/annonse/${inquiry.listing_id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-forest hover:underline text-xs"
                  >
                    {inquiry.listings.title}
                  </a>
                ) : (
                  <span className="text-ink-light text-xs">Annonse slettet</span>
                )}
              </td>
              <td className="px-4 py-3 max-w-[240px]">
                <p
                  className="text-xs text-ink-mid cursor-pointer"
                  onClick={() =>
                    setExpandedId(expandedId === inquiry.id ? null : inquiry.id)
                  }
                >
                  {expandedId === inquiry.id
                    ? inquiry.message
                    : inquiry.message.length > 80
                    ? inquiry.message.slice(0, 80) + "…"
                    : inquiry.message}
                </p>
              </td>
              <td className="px-4 py-3 text-ink-light text-xs hidden xl:table-cell">
                {new Date(inquiry.created_at).toLocaleDateString("nb-NO", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </td>
              <td className="px-4 py-3">
                {confirmDeleteId === inquiry.id ? (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleDelete(inquiry.id)}
                      className="rounded-lg bg-red-600 text-white hover:bg-red-700 px-2 py-1 text-xs font-semibold transition-colors duration-[120ms]"
                    >
                      Slett
                    </button>
                    <button
                      onClick={() => setConfirmDeleteId(null)}
                      className="rounded-lg border border-border px-2 py-1 text-xs text-ink-mid hover:bg-cream transition-colors duration-[120ms]"
                    >
                      Avbryt
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setConfirmDeleteId(inquiry.id)}
                    className="rounded-lg border border-red-200 text-red-500 hover:bg-red-50 px-2 py-1 text-xs transition-colors duration-[120ms]"
                  >
                    Slett
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {filteredInquiries.length === 0 && (
        <div className="px-6 py-16 text-center">
          <p className="text-sm text-ink-light">{search ? "Ingen treff på søket." : "Ingen forespørsler enda."}</p>
        </div>
      )}
    </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tab: Meldinger
// ---------------------------------------------------------------------------

type Conversation = {
  id: string;
  listing_id: number;
  seller_id: number;
  buyer_name: string;
  buyer_email: string;
  created_at: string;
  listings: { title: string; price: number } | null;
  profiles: { name: string; avatar: string } | null;
};

type Message = {
  id: string;
  conversation_id: string;
  is_from_seller: boolean;
  type: string;
  content: string;
  metadata: Record<string, unknown> | null;
  created_at: string;
};

function MeldingerTab() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);
  const [search, setSearch] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const fetchConversations = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("conversations")
      .select("*, listings(title, price), profiles(name, avatar)")
      .order("created_at", { ascending: false });
    setConversations((data ?? []) as unknown as Conversation[]);
    setLoading(false);
  }, []);

  useEffect(() => { fetchConversations(); }, [fetchConversations]);

  async function openConversation(conv: Conversation) {
    setSelected(conv);
    const { data } = await supabase
      .from("messages")
      .select("*")
      .eq("conversation_id", conv.id)
      .order("created_at", { ascending: true });
    setMessages((data ?? []) as Message[]);
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 60);
  }

  // Realtime for selected conversation
  useEffect(() => {
    if (!selected) return;
    const channel = supabase
      .channel(`admin-messages:${selected.id}`)
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "messages",
        filter: `conversation_id=eq.${selected.id}`,
      }, (payload) => {
        setMessages((prev) => {
          if (prev.find((m) => m.id === (payload.new as Message).id)) return prev;
          return [...prev, payload.new as Message];
        });
        setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 60);
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [selected]);

  async function sendReply() {
    if (!selected || !reply.trim()) return;
    setSending(true);
    try {
      const { data: msg } = await supabase
        .from("messages")
        .insert({
          conversation_id: selected.id,
          is_from_seller: true,
          type: "text",
          content: reply.trim(),
        })
        .select()
        .single();
      if (msg) {
        setMessages((prev) => {
          if (prev.find((m) => m.id === (msg as Message).id)) return prev;
          return [...prev, msg as Message];
        });
        setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 60);
      }
      setReply("");
    } finally {
      setSending(false);
    }
  }

  const filteredConversations = search.trim()
    ? conversations.filter((c) =>
        [c.buyer_name, c.buyer_email, c.listings?.title ?? ""]
          .join(" ").toLowerCase().includes(search.toLowerCase())
      )
    : conversations;

  if (loading) return <Spinner />;

  return (
    <div className="flex gap-4 h-[600px]">
      {/* Conversation list */}
      <div className="w-72 flex-shrink-0 flex flex-col gap-3">
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-light" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Søk..."
            className="w-full rounded-lg border border-border bg-white pl-9 pr-4 py-2 text-sm text-ink placeholder:text-ink-light focus:outline-none focus:ring-2 focus:ring-forest/20 focus:border-forest"
          />
        </div>
        <div className="bg-white rounded-xl border border-border overflow-y-auto flex-1 divide-y divide-border">
          {filteredConversations.length === 0 && (
            <div className="p-6 text-center text-sm text-ink-light">Ingen samtaler.</div>
          )}
          {filteredConversations.map((conv) => (
            <button
              key={conv.id}
              onClick={() => openConversation(conv)}
              className={`w-full px-4 py-3 text-left transition-colors duration-[120ms] ${selected?.id === conv.id ? "bg-forest-light" : "hover:bg-cream"}`}
            >
              <p className="text-sm font-medium text-ink truncate">{conv.buyer_name}</p>
              <p className="text-xs text-ink-light truncate">{conv.listings?.title ?? "Ukjent annonse"}</p>
              <p className="text-xs text-ink-light mt-0.5">{new Date(conv.created_at).toLocaleDateString("nb-NO")}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Chat pane */}
      {selected ? (
        <div className="flex-1 bg-white rounded-xl border border-border flex flex-col overflow-hidden">
          {/* Header */}
          <div className="px-4 py-3 border-b border-border flex items-center gap-3 flex-shrink-0">
            <div className="h-8 w-8 rounded-full bg-forest-light flex items-center justify-center text-forest text-sm font-bold">
              {selected.profiles?.avatar ?? "?"}
            </div>
            <div>
              <p className="text-sm font-semibold text-ink">{selected.buyer_name}</p>
              <p className="text-xs text-ink-light">{selected.listings?.title} · {selected.listings?.price?.toLocaleString("nb-NO")} kr</p>
            </div>
            <a href={`mailto:${selected.buyer_email}`} className="ml-auto text-xs text-forest hover:underline">{selected.buyer_email}</a>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.is_from_seller ? "justify-end" : "justify-start"}`}>
                <div className={`rounded-2xl px-4 py-2.5 max-w-[75%] text-sm leading-relaxed ${
                  msg.is_from_seller
                    ? "bg-forest text-white rounded-br-sm"
                    : "bg-cream text-ink rounded-bl-sm"
                }`}>
                  {msg.type === "vipps_request" && (
                    <span className="block text-[11px] font-bold uppercase tracking-wide opacity-70 mb-1">Betalingsforespørsel</span>
                  )}
                  {msg.type === "bring_request" && (
                    <span className="block text-[11px] font-bold uppercase tracking-wide opacity-70 mb-1">Bring frakt</span>
                  )}
                  <span className="whitespace-pre-line">{msg.content}</span>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Reply input */}
          <div className="px-4 py-3 border-t border-border flex gap-2 flex-shrink-0">
            <input
              type="text"
              value={reply}
              onChange={(e) => setReply(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendReply(); } }}
              placeholder={`Svar som ${selected.profiles?.name ?? "selger"}...`}
              className="flex-1 rounded-full border border-border px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-forest/20 focus:border-forest bg-cream"
            />
            <button
              onClick={sendReply}
              disabled={sending || !reply.trim()}
              className="h-9 w-9 flex-shrink-0 rounded-full bg-forest flex items-center justify-center text-white hover:bg-forest-mid transition-colors disabled:opacity-40"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.269 20.876L5.999 12zm0 0h7.5" />
              </svg>
            </button>
          </div>
        </div>
      ) : (
        <div className="flex-1 bg-white rounded-xl border border-border flex items-center justify-center">
          <p className="text-sm text-ink-light">Velg en samtale for å se meldinger.</p>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export default function RegistreringerPage() {
  const [authenticated, setAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState("");

  const [activeTab, setActiveTab] = useState<Tab>("registreringer");
  const [loadedTabs, setLoadedTabs] = useState<Set<Tab>>(new Set());

  const [stats, setStats] = useState<Stats>({
    registrations: 0,
    clubs: 0,
    profiles: 0,
    listings: 0,
    inquiries: 0,
  });

  // Registreringer state (managed here so stats can see it)
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [regLoading, setRegLoading] = useState(true);

  const fetchRegistrations = useCallback(async () => {
    setRegLoading(true);
    const { data } = await supabase
      .from("club_registrations")
      .select("*")
      .order("created_at", { ascending: false });
    setRegistrations((data ?? []) as Registration[]);
    setRegLoading(false);
  }, []);

  const fetchStats = useCallback(async () => {
    const [{ count: regCount }, { count: clubCount }, { count: profileCount }, { count: listingCount }, { count: inquiryCount }] =
      await Promise.all([
        supabase.from("club_registrations").select("id", { count: "exact", head: true }),
        supabase.from("clubs").select("id", { count: "exact", head: true }),
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase.from("listings").select("id", { count: "exact", head: true }),
        supabase.from("inquiries").select("id", { count: "exact", head: true }),
      ]);

    setStats({
      registrations: regCount ?? 0,
      clubs: clubCount ?? 0,
      profiles: profileCount ?? 0,
      listings: listingCount ?? 0,
      inquiries: inquiryCount ?? 0,
    });
  }, []);

  useEffect(() => {
    if (authenticated) {
      fetchStats();
      fetchRegistrations();
      setLoadedTabs(new Set(["registreringer"]));
    }
  }, [authenticated, fetchStats, fetchRegistrations]);

  function handleTabChange(tab: Tab) {
    setActiveTab(tab);
    setLoadedTabs((prev) => new Set([...prev, tab]));
  }

  function handleLogin(e: { preventDefault(): void }) {
    e.preventDefault();
    if (!password.trim()) {
      setAuthError("Skriv inn passord.");
      return;
    }
    // Store the typed password — verified server-side on first API call
    _adminSecret = password;
    setAuthenticated(true);
  }

  if (!authenticated) {
    return (
      <div className="mx-auto max-w-sm px-4 py-24">
        <div className="bg-white rounded-2xl p-8 border border-border text-center">
          <h1 className="font-display text-xl font-bold text-ink mb-1">Admin</h1>
          <p className="text-sm text-ink-light mb-6">Logg inn for å administrere Sportsbytte</p>
          <form onSubmit={handleLogin} className="space-y-4">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Passord"
              className="w-full rounded-lg border border-border px-4 py-2.5 text-sm text-center focus:outline-none focus:ring-2 focus:ring-forest/20 focus:border-forest"
            />
            {authError && <p className="text-xs text-red-600">{authError}</p>}
            <button
              type="submit"
              className="w-full rounded-lg bg-forest py-2.5 text-sm font-semibold text-white hover:bg-forest-mid transition-colors duration-[120ms]"
            >
              Logg inn
            </button>
          </form>
        </div>
      </div>
    );
  }

  const TABS: { id: Tab; label: string }[] = [
    { id: "registreringer", label: "Registreringer" },
    { id: "klubber", label: "Klubber" },
    { id: "brukere", label: "Brukere" },
    { id: "annonser", label: "Annonser" },
    { id: "foresporsler", label: "Forespørsler" },
    { id: "meldinger", label: "Meldinger" },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink">Sportsbytte Admin</h1>
          <p className="text-sm text-ink-light mt-1">
            {stats.registrations > 0 &&
              `${registrations.filter((r) => r.status === "pending").length} registreringer venter`}
          </p>
        </div>
        <button
          onClick={() => setAuthenticated(false)}
          className="rounded-lg border border-border px-4 py-2 text-sm text-ink-mid hover:bg-cream transition-colors duration-[120ms]"
        >
          Logg ut
        </button>
      </div>

      {/* Stats row */}
      <div className="flex gap-3 mb-8 overflow-x-auto pb-1">
        <StatCard label="Registreringer" value={stats.registrations} />
        <StatCard label="Klubber" value={stats.clubs} />
        <StatCard label="Brukere" value={stats.profiles} />
        <StatCard label="Annonser" value={stats.listings} />
        <StatCard label="Forespørsler" value={stats.inquiries} />
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 border-b border-border mb-6 overflow-x-auto">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => handleTabChange(tab.id)}
            className={`px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-colors duration-[120ms] ${
              activeTab === tab.id
                ? "text-forest border-b-2 border-forest -mb-px"
                : "text-ink-light hover:text-ink"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div>
        {activeTab === "registreringer" && (
          <RegistreringerTab
            registrations={registrations}
            loading={regLoading}
            onRefetch={() => {
              fetchRegistrations();
              fetchStats();
            }}
          />
        )}
        {activeTab === "klubber" && loadedTabs.has("klubber") && <KlubberTab />}
        {activeTab === "brukere" && loadedTabs.has("brukere") && <BrukereTab />}
        {activeTab === "annonser" && loadedTabs.has("annonser") && <AnnonsertTab />}
        {activeTab === "foresporsler" && loadedTabs.has("foresporsler") && <ForesporslerTab />}
        {activeTab === "meldinger" && loadedTabs.has("meldinger") && <MeldingerTab />}
      </div>
    </div>
  );
}
