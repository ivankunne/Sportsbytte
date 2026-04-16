"use client";

import { useState, useEffect, useCallback, type ChangeEvent } from "react";
import Link from "next/link";
import { QRCodeSVG } from "qrcode.react";
import { supabase } from "@/lib/supabase";
import { updateMembershipStatus } from "@/lib/queries";
import { ClubAnnouncements } from "@/components/ClubAnnouncements";
import type { Club, ListingWithRelations, Profile } from "@/lib/queries";
import type { MembershipWithProfile } from "@/lib/queries";

type Tab = "oversikt" | "oppslag" | "annonser" | "medlemmer" | "utseende";

const TABS: { id: Tab; label: string }[] = [
  { id: "oversikt", label: "Oversikt" },
  { id: "oppslag", label: "Oppslag" },
  { id: "annonser", label: "Annonser" },
  { id: "medlemmer", label: "Medlemmer" },
  { id: "utseende", label: "Utseende" },
];

// ── Invite Link Section ──────────────────────────────────
function InviteLinkSection({
  club,
  onRegenerate,
}: {
  club: Club;
  onRegenerate: () => Promise<void>;
}) {
  const [copied, setCopied] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [confirmRegen, setConfirmRegen] = useState(false);
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);

  useEffect(() => {
    if (club.invite_token) {
      setInviteUrl(`${window.location.origin}/join/${club.invite_token}`);
    }
  }, [club.invite_token]);

  async function handleCopy() {
    if (!inviteUrl) return;
    await navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleRegenerate() {
    setRegenerating(true);
    setConfirmRegen(false);
    await onRegenerate();
    setRegenerating(false);
  }

  return (
    <div>
      <div className="mb-5">
        <h2 className="font-display text-xl font-semibold text-ink">Invitasjonslenke</h2>
        <p className="text-sm text-ink-light mt-1">
          Del denne lenken med klubbmedlemmer. Alle som klikker den blir automatisk godkjent.
        </p>
      </div>
      <div className="bg-white rounded-xl border border-border p-6">
        {inviteUrl ? (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <input
                readOnly
                value={inviteUrl}
                className="flex-1 rounded-lg border border-border px-4 py-2.5 text-sm text-ink-mid font-mono bg-cream focus:outline-none"
              />
              <button
                type="button"
                onClick={handleCopy}
                className="flex-shrink-0 px-4 py-2.5 rounded-lg bg-forest text-sm font-semibold text-white hover:bg-forest-mid transition-colors duration-[120ms]"
              >
                {copied ? "Kopiert ✓" : "Kopier"}
              </button>
            </div>
            <p className="text-xs text-ink-light">
              Del via WhatsApp, Spond, e-post eller SMS. Lenken gjelder til du regenererer den.
            </p>
            <div className="flex flex-col items-center gap-2 pt-4 border-t border-border">
              <QRCodeSVG value={inviteUrl} size={160} level="M" />
              <p className="text-xs text-ink-light text-center">
                Skriv ut eller ta skjermbilde for å dele QR-koden på oppslagstavla
              </p>
            </div>

            <div className="pt-3 border-t border-border">
              {!confirmRegen ? (
                <button
                  type="button"
                  onClick={() => setConfirmRegen(true)}
                  disabled={regenerating}
                  className="text-xs text-ink-light hover:text-red-500 transition-colors duration-[120ms] disabled:opacity-50"
                >
                  Generer ny lenke (ugyldiggjør den gamle)
                </button>
              ) : (
                <div className="flex items-center gap-3 rounded-lg bg-red-50 border border-red-200 px-4 py-3">
                  <p className="text-xs text-red-700 flex-1">
                    Den gamle lenken vil slutte å fungere. Er du sikker?
                  </p>
                  <button
                    type="button"
                    onClick={handleRegenerate}
                    disabled={regenerating}
                    className="text-xs font-semibold text-red-600 hover:text-red-800 transition-colors disabled:opacity-50"
                  >
                    {regenerating ? "Regenererer..." : "Ja, generer ny"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmRegen(false)}
                    className="text-xs text-ink-light hover:text-ink transition-colors"
                  >
                    Avbryt
                  </button>
                </div>
              )}
            </div>
          </div>
        ) : (
          <p className="text-sm text-ink-light">Ingen invitasjonstoken funnet. Kjør migration 003 i Supabase.</p>
        )}
      </div>
    </div>
  );
}

// ── CSV Import Section ────────────────────────────────────
function CsvImportSection({
  club,
  onImported,
}: {
  club: Club;
  onImported: () => Promise<void>;
}) {
  const [rows, setRows] = useState<string[]>([]);
  const [importing, setImporting] = useState(false);
  const [importDone, setImportDone] = useState(false);
  const [importError, setImportError] = useState("");

  function handleFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const lines = text.split(/\r?\n/).filter(Boolean);
      if (lines.length < 2) return;
      const header = lines[0].toLowerCase().split(/[,;]/).map((s) => s.trim().replace(/^"|"$/g, ""));
      const nameIdx = header.indexOf("name") !== -1
        ? header.indexOf("name")
        : header.indexOf("navn") !== -1
        ? header.indexOf("navn")
        : 0;
      const names = lines
        .slice(1)
        .map((line) => line.split(/[,;]/).map((s) => s.trim().replace(/^"|"$/g, ""))[nameIdx])
        .filter(Boolean);
      setRows(names);
      setImportDone(false);
      setImportError("");
    };
    reader.readAsText(file);
  }

  async function handleImport() {
    if (rows.length === 0) return;
    setImporting(true);
    setImportError("");
    try {
      for (const name of rows) {
        let profileId: number;
        const { data: existing } = await supabase
          .from("profiles")
          .select("id")
          .ilike("name", name)
          .limit(1)
          .maybeSingle();

        if (existing) {
          profileId = existing.id;
        } else {
          const slug =
            name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "") +
            "-" +
            Date.now();
          const { data: newProfile, error } = await supabase
            .from("profiles")
            .insert({ name, slug, avatar: name.slice(0, 2).toUpperCase(), club_id: club.id })
            .select("id")
            .single();
          if (error) throw error;
          profileId = newProfile.id;
        }

        await supabase.from("memberships").upsert({
          club_id: club.id,
          profile_id: profileId,
          status: "approved",
        });
      }
      setImportDone(true);
      setRows([]);
      await onImported();
    } catch (err) {
      setImportError(err instanceof Error ? err.message : "Import feilet.");
    }
    setImporting(false);
  }

  return (
    <div>
      <div className="mb-5">
        <h2 className="font-display text-xl font-semibold text-ink">Importer fra CSV</h2>
        <p className="text-sm text-ink-light mt-1">
          Last opp en CSV-fil med medlemsnavn for å legge til mange på én gang.
        </p>
      </div>
      <div className="bg-white rounded-xl border border-border p-6 space-y-4">
        <div className="rounded-lg border-2 border-dashed border-border p-6 text-center">
          <p className="text-sm text-ink-light mb-3">
            Filen bør ha en kolonne kalt{" "}
            <code className="text-xs bg-cream px-1.5 py-0.5 rounded">name</code> eller{" "}
            <code className="text-xs bg-cream px-1.5 py-0.5 rounded">navn</code>
          </p>
          <input
            type="file"
            accept=".csv"
            onChange={handleFile}
            className="text-sm text-ink file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-forest-light file:text-forest hover:file:bg-forest/10 cursor-pointer"
          />
        </div>

        {rows.length > 0 && (
          <div>
            <p className="text-sm font-medium text-ink mb-2">{rows.length} navn funnet:</p>
            <div className="max-h-40 overflow-y-auto rounded-lg border border-border bg-cream p-3 space-y-1">
              {rows.map((name, i) => (
                <p key={i} className="text-sm text-ink-mid">{name}</p>
              ))}
            </div>
            {importError && <p className="text-xs text-red-600 mt-2">{importError}</p>}
            <button
              type="button"
              onClick={handleImport}
              disabled={importing}
              className="mt-4 px-5 py-2.5 rounded-lg bg-forest text-sm font-semibold text-white hover:bg-forest-mid transition-colors duration-[120ms] disabled:opacity-50"
            >
              {importing ? "Importerer..." : `Importer ${rows.length} medlemmer`}
            </button>
          </div>
        )}

        {importDone && (
          <p className="text-sm font-medium text-forest">Import fullført ✓</p>
        )}

        <p className="text-xs text-ink-light border-t border-border pt-4">
          Eksempelformat:{" "}
          <code className="bg-cream px-1 py-0.5 rounded">name,email</code> — én person per linje.
        </p>
      </div>
    </div>
  );
}

export default function ClubAdminPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const [authenticated, setAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [club, setClub] = useState<Club | null>(null);
  const [listings, setListings] = useState<ListingWithRelations[]>([]);
  const [sellers, setSellers] = useState<Profile[]>([]);
  const [memberships, setMemberships] = useState<MembershipWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [slug, setSlug] = useState("");
  const [activeTab, setActiveTab] = useState<Tab>("oversikt");

  // Branding form state
  const [branding, setBranding] = useState({
    color: "",
    secondary_color: "",
    description: "",
    logo_url: "",
    is_membership_gated: false,
    member_email_domain: "",
  });
  const [brandingSaving, setBrandingSaving] = useState(false);
  const [brandingSaved, setBrandingSaved] = useState(false);

  const fetchMemberships = useCallback(async (clubId: number) => {
    const { data } = await supabase
      .from("memberships")
      .select("*, profiles(*)")
      .eq("club_id", clubId)
      .order("created_at", { ascending: false });
    setMemberships((data ?? []) as MembershipWithProfile[]);
  }, []);

  useEffect(() => {
    params.then(async (p) => {
      setSlug(p.slug);

      const { data: clubData } = await supabase
        .from("clubs")
        .select("*")
        .eq("slug", p.slug)
        .single();

      if (!clubData) { setLoading(false); return; }
      setClub(clubData);
      setBranding({
        color: clubData.color ?? "#1a3c2e",
        secondary_color: clubData.secondary_color ?? "",
        description: clubData.description ?? "",
        logo_url: clubData.logo_url ?? "",
        is_membership_gated: clubData.is_membership_gated ?? false,
        member_email_domain: clubData.member_email_domain ?? "",
      });

      const [{ data: listingsData }, { data: sellersData }] = await Promise.all([
        supabase
          .from("listings")
          .select("*, clubs(*), profiles(*)")
          .eq("club_id", clubData.id)
          .order("created_at", { ascending: false }),
        supabase
          .from("profiles")
          .select("*")
          .eq("club_id", clubData.id)
          .order("total_sold", { ascending: false })
          .limit(10),
      ]);

      setListings((listingsData ?? []) as ListingWithRelations[]);
      setSellers(sellersData ?? []);
      await fetchMemberships(clubData.id);
      setLoading(false);
    });
  }, [params, fetchMemberships]);

  function handleLogin(e: { preventDefault(): void }) {
    e.preventDefault();
    if (password === "demo2026") {
      setAuthenticated(true);
      setAuthError("");
    } else {
      setAuthError("Feil passord. Kontakt Sportsbyttet for tilgang.");
    }
  }

  async function handleMembershipAction(id: number, status: "approved" | "rejected") {
    await updateMembershipStatus(id, status);
    if (club) await fetchMemberships(club.id);
  }

  async function handleSaveBranding(e: { preventDefault(): void }) {
    e.preventDefault();
    if (!club) return;
    setBrandingSaving(true);
    setBrandingSaved(false);
    const { error } = await supabase.from("clubs").update({
      color: branding.color,
      secondary_color: branding.secondary_color || null,
      description: branding.description || null,
      logo_url: branding.logo_url || null,
      is_membership_gated: branding.is_membership_gated,
      member_email_domain: branding.member_email_domain || null,
      updated_at: new Date().toISOString(),
    }).eq("id", club.id);
    setBrandingSaving(false);
    if (error) {
      alert(`Kunne ikke lagre: ${error.message}`);
      return;
    }
    setClub({ ...club, ...branding, secondary_color: branding.secondary_color || null, description: branding.description || null, logo_url: branding.logo_url || null, member_email_domain: branding.member_email_domain || null });
    // Revalidate the public club page so changes appear immediately
    await fetch("/api/revalidate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path: `/klubb/${slug}` }),
    });
    setBrandingSaved(true);
    setTimeout(() => setBrandingSaved(false), 3000);
  }

  async function handleMarkSold(listingId: number) {
    await supabase.from("listings").update({ is_sold: true }).eq("id", listingId);
    setListings((prev) => prev.map((l) => l.id === listingId ? { ...l, is_sold: true } : l));
  }

  async function handleDeleteListing(listingId: number) {
    await supabase.from("listings").delete().eq("id", listingId);
    setListings((prev) => prev.filter((l) => l.id !== listingId));
  }

  // ── Loading ──────────────────────────────────────────
  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-20 text-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-forest border-r-transparent" />
      </div>
    );
  }

  if (!club) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-20 text-center">
        <h1 className="font-display text-3xl font-bold">Klubb ikke funnet</h1>
      </div>
    );
  }

  // ── Login gate ───────────────────────────────────────
  if (!authenticated) {
    return (
      <div className="mx-auto max-w-sm px-4 py-20">
        <div className="bg-white rounded-2xl p-8 border border-border text-center">
          <div
            className="mx-auto flex h-14 w-14 items-center justify-center rounded-full text-white text-lg font-bold mb-4"
            style={{ backgroundColor: club.color }}
          >
            {club.initials}
          </div>
          <h1 className="font-display text-xl font-bold text-ink">{club.name}</h1>
          <p className="text-sm text-ink-light mt-1 mb-6">Logg inn for å se administrasjonspanelet</p>
          <form onSubmit={handleLogin} className="space-y-4">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Skriv inn passord"
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
          <p className="mt-6 text-xs text-ink-light">
            Har du ikke tilgang?{" "}
            <Link href="/kontakt" className="text-forest hover:underline">Kontakt oss</Link>
          </p>
        </div>
      </div>
    );
  }

  const pendingCount = memberships.filter((m) => m.status === "pending").length;
  const activeListings = listings.filter((l) => !l.is_sold);
  const soldListings = listings.filter((l) => l.is_sold);

  // ── Dashboard ────────────────────────────────────────
  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 sm:py-12">

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
          <div
            className="flex h-10 w-10 items-center justify-center rounded-full text-white text-sm font-bold"
            style={{ backgroundColor: club.color }}
          >
            {club.initials}
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold text-ink">{club.name}</h1>
            <p className="text-sm text-ink-light">Administrasjonspanel</p>
          </div>
        </div>
        <Link
          href={`/klubb/${slug}`}
          className="text-sm font-medium text-forest hover:text-forest-mid transition-colors duration-[120ms]"
        >
          ← Tilbake til klubbsiden
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border mb-8 overflow-x-auto">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`relative px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-colors duration-[120ms] ${
              activeTab === tab.id
                ? "text-forest border-b-2 border-forest -mb-px"
                : "text-ink-light hover:text-ink"
            }`}
          >
            {tab.label}
            {tab.id === "medlemmer" && pendingCount > 0 && (
              <span className="ml-1.5 inline-flex h-4 w-4 items-center justify-center rounded-full bg-amber text-[10px] font-bold text-white">
                {pendingCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── Tab: Oversikt ── */}
      {activeTab === "oversikt" && (
        <div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-10">
            {[
              { label: "Aktive annonser", value: activeListings.length.toString() },
              { label: "Totalt solgt", value: soldListings.length.toString() },
              { label: "Medlemmer", value: club.members.toLocaleString("nb-NO") },
              { label: "Snittkarakter", value: `${club.rating} ⭐` },
            ].map((stat) => (
              <div key={stat.label} className="bg-white rounded-xl p-5 border border-border">
                <p className="text-xs text-ink-light font-medium uppercase tracking-wider">{stat.label}</p>
                <p className="mt-1 text-2xl font-bold font-display text-ink">{stat.value}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 bg-white rounded-xl border border-border">
              <div className="px-6 py-4 border-b border-border flex items-center justify-between">
                <h2 className="font-display text-lg font-semibold text-ink">Siste annonser</h2>
                <button
                  onClick={() => setActiveTab("annonser")}
                  className="text-xs text-forest hover:underline"
                >
                  Se alle
                </button>
              </div>
              <div className="divide-y divide-border">
                {activeListings.slice(0, 5).map((listing) => (
                  <Link
                    key={listing.id}
                    href={`/annonse/${listing.id}`}
                    className="px-6 py-4 flex items-center gap-4 hover:bg-cream/50 transition-colors duration-[120ms]"
                  >
                    <div className="h-10 w-10 rounded-lg bg-cream flex-shrink-0 overflow-hidden">
                      {listing.images?.[0] && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={listing.images[0]} alt="" className="w-full h-full object-cover" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-ink truncate">{listing.title}</p>
                      <p className="text-xs text-ink-light">{listing.profiles?.name}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-bold text-forest">{listing.price.toLocaleString("nb-NO")} kr</p>
                      <p className="text-xs text-ink-light">{listing.views} visninger</p>
                    </div>
                  </Link>
                ))}
                {activeListings.length === 0 && (
                  <p className="px-6 py-8 text-sm text-ink-light text-center">Ingen aktive annonser ennå.</p>
                )}
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-white rounded-xl border border-border p-6">
                <h2 className="font-display text-lg font-semibold text-ink mb-4">Topp selgere</h2>
                <div className="space-y-3">
                  {sellers.slice(0, 5).map((seller) => (
                    <div key={seller.id} className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-forest-light flex items-center justify-center text-forest text-xs font-bold">
                        {seller.avatar}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-ink truncate">{seller.name}</p>
                        <p className="text-xs text-ink-light">{seller.total_sold} solgt</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-amber-light rounded-xl p-6 border border-amber/30">
                <h3 className="font-display text-base font-semibold text-ink">Oppgrader til Pro</h3>
                <p className="mt-1 text-sm text-ink-mid">
                  Avansert statistikk, flere admin-brukere og lavere transaksjonsgebyr.
                </p>
                <Link href="/priser" className="mt-3 inline-block text-sm font-semibold text-amber hover:underline">
                  Se planer →
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Tab: Oppslag ── */}
      {activeTab === "oppslag" && (
        <div className="max-w-2xl">
          <p className="text-sm text-ink-light mb-6">
            Post kunngjøringer, arrangementer eller utstyrsbehov til klubbsiden.
          </p>
          <ClubAnnouncements clubId={club.id} isAdmin={true} />
        </div>
      )}

      {/* ── Tab: Annonser ── */}
      {activeTab === "annonser" && (
        <div>
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-display text-xl font-semibold text-ink">
              Alle annonser ({listings.length})
            </h2>
            <Link
              href="/selg"
              className="text-sm font-semibold text-forest hover:text-forest-mid transition-colors duration-[120ms]"
            >
              + Legg ut annonse
            </Link>
          </div>
          <div className="bg-white rounded-xl border border-border divide-y divide-border">
            {listings.length === 0 && (
              <p className="px-6 py-10 text-sm text-ink-light text-center">Ingen annonser ennå.</p>
            )}
            {listings.map((listing) => (
              <div key={listing.id} className="px-6 py-4 flex items-center gap-4">
                <div className="h-12 w-12 rounded-lg bg-cream flex-shrink-0 overflow-hidden">
                  {listing.images?.[0] && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={listing.images[0]} alt="" className="w-full h-full object-cover" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-ink truncate">{listing.title}</p>
                    {listing.is_sold && (
                      <span className="text-[10px] font-bold uppercase tracking-wider bg-ink-light/20 text-ink-light px-2 py-0.5 rounded-full flex-shrink-0">
                        Solgt
                      </span>
                    )}
                    {(listing.listing_type === "iso") && (
                      <span className="text-[10px] font-bold uppercase tracking-wider bg-forest-light text-forest px-2 py-0.5 rounded-full flex-shrink-0">
                        ISO
                      </span>
                    )}
                    {(listing.listing_type === "bulk") && (
                      <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-light text-amber px-2 py-0.5 rounded-full flex-shrink-0">
                        Bulk
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-ink-light mt-0.5">{listing.profiles?.name} · {listing.views} visninger</p>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <p className="text-sm font-bold text-forest hidden sm:block">
                    {listing.price.toLocaleString("nb-NO")} kr
                  </p>
                  <Link
                    href={`/annonse/${listing.id}`}
                    className="text-xs text-forest hover:underline"
                  >
                    Se
                  </Link>
                  {!listing.is_sold && (
                    <button
                      onClick={() => handleMarkSold(listing.id)}
                      className="text-xs text-ink-light hover:text-ink transition-colors"
                    >
                      Merk solgt
                    </button>
                  )}
                  <button
                    onClick={() => handleDeleteListing(listing.id)}
                    className="text-xs text-ink-light hover:text-red-500 transition-colors"
                  >
                    Slett
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Tab: Medlemmer ── */}
      {activeTab === "medlemmer" && (
        <div className="space-y-10">

          {/* Invite link */}
          <InviteLinkSection
            club={club}
            onRegenerate={async () => {
              const newToken = crypto.randomUUID();
              await supabase.from("clubs").update({ invite_token: newToken }).eq("id", club.id);
              setClub({ ...club, invite_token: newToken });
            }}
          />

          {/* CSV import */}
          <CsvImportSection
            club={club}
            onImported={async () => { if (club) await fetchMemberships(club.id); }}
          />

          {/* Membership requests */}
          <div>
            <div className="mb-5">
              <h2 className="font-display text-xl font-semibold text-ink">Medlemsforespørsler</h2>
              <p className="text-sm text-ink-light mt-1">
                Godkjenn eller avvis forespørsler om å bli med i {club.name}.
              </p>
            </div>

            {memberships.length === 0 && (
              <div className="rounded-xl bg-white border border-border px-6 py-12 text-center">
                <p className="text-sm text-ink-light">Ingen forespørsler ennå.</p>
              </div>
            )}

            <div className="space-y-3">
              {(["pending", "approved", "rejected"] as const).map((status) => {
                const group = memberships.filter((m) => m.status === status);
                if (group.length === 0) return null;
                const labels = { pending: "Venter", approved: "Godkjent", rejected: "Avvist" };
                const colors = {
                  pending: "text-amber bg-amber-light border-amber/30",
                  approved: "text-forest bg-forest-light border-forest/20",
                  rejected: "text-ink-light bg-cream border-border",
                };
                return (
                  <div key={status}>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-ink-light mb-3">
                      {labels[status]} ({group.length})
                    </h3>
                    <div className="bg-white rounded-xl border border-border divide-y divide-border">
                      {group.map((m) => (
                        <div key={m.id} className="px-6 py-4 flex items-start gap-4">
                          <div className="h-9 w-9 rounded-full bg-forest-light flex items-center justify-center text-forest text-xs font-bold flex-shrink-0">
                            {m.profiles?.avatar ?? "?"}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-ink">{m.profiles?.name ?? "Ukjent"}</p>
                            {m.message && (
                              <p className="text-xs text-ink-light mt-0.5 line-clamp-2">{m.message}</p>
                            )}
                            <span className={`mt-1 inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${colors[status]}`}>
                              {labels[status]}
                            </span>
                          </div>
                          {status === "pending" && (
                            <div className="flex gap-2 flex-shrink-0">
                              <button
                                onClick={() => handleMembershipAction(m.id, "approved")}
                                className="px-3 py-1.5 rounded-lg bg-forest text-xs font-semibold text-white hover:bg-forest-mid transition-colors duration-[120ms]"
                              >
                                Godkjenn
                              </button>
                              <button
                                onClick={() => handleMembershipAction(m.id, "rejected")}
                                className="px-3 py-1.5 rounded-lg bg-cream text-xs font-medium text-ink-mid hover:bg-border transition-colors duration-[120ms]"
                              >
                                Avvis
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── Tab: Utseende ── */}
      {activeTab === "utseende" && (
        <div className="max-w-2xl">
          <div className="mb-6">
            <h2 className="font-display text-xl font-semibold text-ink">Klubbens utseende</h2>
            <p className="text-sm text-ink-light mt-1">
              Tilpass farger, logo og informasjon på klubbsiden.
            </p>
          </div>

          <form onSubmit={handleSaveBranding} className="space-y-6">
            {/* Color pickers */}
            <div className="bg-white rounded-xl border border-border p-6 space-y-5">
              <h3 className="font-display text-base font-semibold text-ink">Farger</h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-ink mb-2">Primærfarge</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={branding.color}
                      onChange={(e) => setBranding({ ...branding, color: e.target.value })}
                      className="h-10 w-14 rounded-lg border border-border cursor-pointer"
                    />
                    <input
                      type="text"
                      value={branding.color}
                      onChange={(e) => setBranding({ ...branding, color: e.target.value })}
                      placeholder="#1a3c2e"
                      className="flex-1 rounded-lg border border-border px-3 py-2 text-sm text-ink font-mono focus:outline-none focus:ring-2 focus:ring-forest/20 focus:border-forest"
                    />
                  </div>
                  <p className="text-xs text-ink-light mt-1.5">Brukes på banneret og klikkflater</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-ink mb-2">Sekundærfarge (valgfritt)</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={branding.secondary_color || "#e8843a"}
                      onChange={(e) => setBranding({ ...branding, secondary_color: e.target.value })}
                      className="h-10 w-14 rounded-lg border border-border cursor-pointer"
                    />
                    <input
                      type="text"
                      value={branding.secondary_color}
                      onChange={(e) => setBranding({ ...branding, secondary_color: e.target.value })}
                      placeholder="#e8843a"
                      className="flex-1 rounded-lg border border-border px-3 py-2 text-sm text-ink font-mono focus:outline-none focus:ring-2 focus:ring-forest/20 focus:border-forest"
                    />
                  </div>
                  <p className="text-xs text-ink-light mt-1.5">Brukes på knapper og accenter</p>
                </div>
              </div>

              {/* Live preview */}
              <div className="rounded-xl overflow-hidden border border-border">
                <div
                  className="px-5 py-4 flex items-center gap-3"
                  style={{ backgroundColor: branding.color }}
                >
                  <div
                    className="h-10 w-10 rounded-full flex items-center justify-center text-white text-sm font-bold border-2 border-white/30"
                    style={{ backgroundColor: branding.secondary_color || branding.color }}
                  >
                    {club.initials}
                  </div>
                  <span className="text-white font-display font-bold">{club.name}</span>
                  <button
                    type="button"
                    className="ml-auto rounded-lg px-4 py-1.5 text-xs font-semibold text-white"
                    style={{ backgroundColor: branding.secondary_color || "#e8843a" }}
                  >
                    Bli med
                  </button>
                </div>
                <div className="bg-white px-5 py-3">
                  <p className="text-xs text-ink-light">Forhåndsvisning av banner</p>
                </div>
              </div>
            </div>

            {/* Logo & description */}
            <div className="bg-white rounded-xl border border-border p-6 space-y-5">
              <h3 className="font-display text-base font-semibold text-ink">Logo & beskrivelse</h3>

              <div>
                <label className="block text-sm font-medium text-ink mb-1.5">Logo URL</label>
                <input
                  type="url"
                  value={branding.logo_url}
                  onChange={(e) => setBranding({ ...branding, logo_url: e.target.value })}
                  placeholder="https://eksempel.no/logo.png"
                  className="w-full rounded-lg border border-border px-4 py-2.5 text-sm text-ink placeholder:text-ink-light focus:outline-none focus:ring-2 focus:ring-forest/20 focus:border-forest"
                />
                <p className="text-xs text-ink-light mt-1.5">
                  Lim inn en direkte lenke til logoen. Vises i banneret i stedet for initialene.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-ink mb-1.5">Om klubben</label>
                <textarea
                  rows={3}
                  value={branding.description}
                  onChange={(e) => setBranding({ ...branding, description: e.target.value })}
                  placeholder="Kort beskrivelse av klubben som vises på profilen..."
                  className="w-full rounded-lg border border-border px-4 py-2.5 text-sm text-ink placeholder:text-ink-light focus:outline-none focus:ring-2 focus:ring-forest/20 focus:border-forest resize-none"
                />
              </div>
            </div>

            {/* Email domain gating */}
            <div className="bg-white rounded-xl border border-border p-6 space-y-4">
              <h3 className="font-display text-base font-semibold text-ink">E-postdomene</h3>
              <div>
                <label className="block text-sm font-medium text-ink mb-1.5">
                  Automatisk godkjenning ved e-postdomene
                </label>
                <input
                  type="text"
                  value={branding.member_email_domain}
                  onChange={(e) => setBranding({ ...branding, member_email_domain: e.target.value })}
                  placeholder="brannsk.no"
                  className="w-full rounded-lg border border-border px-4 py-2.5 text-sm text-ink placeholder:text-ink-light focus:outline-none focus:ring-2 focus:ring-forest/20 focus:border-forest"
                />
                <p className="text-xs text-ink-light mt-1.5">
                  Brukere som oppgir en e-post med dette domenet blir automatisk godkjent som medlemmer. Skriv uten @, f.eks. <span className="font-mono">brannsk.no</span>
                </p>
              </div>
            </div>

            {/* Membership gating */}
            <div className="bg-white rounded-xl border border-border p-6">
              <h3 className="font-display text-base font-semibold text-ink mb-4">Tilgangskontroll</h3>
              <label className="flex items-center gap-4 cursor-pointer">
                <div className="relative flex-shrink-0">
                  <input
                    type="checkbox"
                    checked={branding.is_membership_gated}
                    onChange={(e) => setBranding({ ...branding, is_membership_gated: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-10 h-6 bg-border rounded-full peer peer-checked:bg-forest transition-colors duration-[120ms]" />
                  <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full shadow transition-transform duration-[120ms] peer-checked:translate-x-4" />
                </div>
                <div>
                  <span className="text-sm font-medium text-ink">Krev medlemskap for å se annonser</span>
                  <p className="text-xs text-ink-light mt-0.5">
                    Besøkende må søke om og bli godkjent som medlem før de ser lukkede annonser
                  </p>
                </div>
              </label>
            </div>

            <div className="flex items-center gap-4">
              <button
                type="submit"
                disabled={brandingSaving}
                className="px-6 py-2.5 rounded-lg bg-forest text-sm font-semibold text-white hover:bg-forest-mid transition-colors duration-[120ms] disabled:opacity-50"
              >
                {brandingSaving ? "Lagrer..." : "Lagre endringer"}
              </button>
              {brandingSaved && (
                <span className="text-sm text-forest font-medium">Endringer lagret ✓</span>
              )}
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
