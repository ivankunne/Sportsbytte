"use client";

import { useState, useEffect, useCallback, type ChangeEvent } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { QRCodeSVG } from "qrcode.react";
import { supabase } from "@/lib/supabase";
import { updateMembershipStatus } from "@/lib/queries";
import { ClubAnnouncements } from "@/components/ClubAnnouncements";
import { showSuccess, showError } from "@/components/Toaster";
import { contrastColor } from "@/lib/color";
import type { Club, ListingWithRelations, Profile } from "@/lib/queries";
import type { MembershipWithProfile } from "@/lib/queries";

type Tab = "oversikt" | "analyse" | "oppslag" | "annonser" | "medlemmer" | "foresporsler" | "utseende" | "utlan" | "lag";

const FREE_CSV_LIMIT = 20;

type Inquiry = {
  id: number;
  created_at: string;
  message: string;
  buyer_name: string;
  buyer_email: string;
  listing_id: number;
  listing?: { title: string; id: number } | null;
};

const TABS: { id: Tab; label: string }[] = [
  { id: "oversikt", label: "Oversikt" },
  { id: "analyse", label: "Analyse" },
  { id: "oppslag", label: "Oppslag" },
  { id: "annonser", label: "Annonser" },
  { id: "medlemmer", label: "Medlemmer" },
  { id: "foresporsler", label: "Forespørsler" },
  { id: "utlan", label: "Utlån" },
  { id: "lag", label: "Lag" },
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
                {copied ? (
                  <span className="flex items-center gap-1.5">
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                    Kopiert
                  </span>
                ) : "Kopier"}
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
  isPro,
  onImported,
}: {
  club: Club;
  isPro: boolean;
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
    if (cappedRows.length === 0) return;
    setImporting(true);
    setImportError("");
    try {
      for (const name of cappedRows) {
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
            .maybeSingle();
          if (error) throw error;
          if (!newProfile) throw new Error("Failed to create profile");
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

  const cappedRows = !isPro && rows.length > FREE_CSV_LIMIT ? rows.slice(0, FREE_CSV_LIMIT) : rows;
  const isOverLimit = !isPro && rows.length > FREE_CSV_LIMIT;

  return (
    <div>
      <div className="mb-5">
        <h2 className="font-display text-xl font-semibold text-ink">Importer fra CSV</h2>
        <p className="text-sm text-ink-light mt-1">
          Last opp en CSV-fil med medlemsnavn for å legge til mange på én gang.
          {!isPro && (
            <span className="ml-1 text-amber font-medium">Gratisplan: maks {FREE_CSV_LIMIT} per import.</span>
          )}
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
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-ink">
                {cappedRows.length}{isOverLimit ? ` av ${rows.length}` : ""} navn{isOverLimit ? " (begrenset)" : " funnet"}:
              </p>
              {isOverLimit && (
                <span className="text-xs text-amber font-medium">Oppgrader til Pro for ubegrenset import</span>
              )}
            </div>
            <div className="max-h-40 overflow-y-auto rounded-lg border border-border bg-cream p-3 space-y-1">
              {cappedRows.map((name, i) => (
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
              {importing ? "Importerer..." : `Importer ${cappedRows.length} medlemmer`}
            </button>
          </div>
        )}

        {importDone && (
          <p className="flex items-center gap-1.5 text-sm font-medium text-forest">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
            Import fullført
          </p>
        )}

        <p className="text-xs text-ink-light border-t border-border pt-4">
          Eksempelformat:{" "}
          <code className="bg-cream px-1 py-0.5 rounded">name,email</code> — én person per linje.
        </p>
      </div>
    </div>
  );
}

// ── Bulk Email Invite Section ─────────────────────────────────────
function BulkEmailInviteSection({ club }: { club: Club }) {
  const [emailText, setEmailText] = useState("");
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{ sent: number; errors: string[] } | null>(null);

  const emails = emailText
    .split(/[\n,;]+/)
    .map((e) => e.trim().toLowerCase())
    .filter((e) => e.includes("@"));

  async function handleSend() {
    if (emails.length === 0) return;
    setSending(true);
    setResult(null);
    const inviteUrl = club.invite_token
      ? `${window.location.origin}/join/${club.invite_token}`
      : `${window.location.origin}/klubb/${club.slug}`;
    try {
      const res = await fetch("/api/club-bulk-invite", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-secret": _adminSecret },
        body: JSON.stringify({ clubName: club.name, inviteUrl, emails }),
      });
      const data = await res.json();
      setResult(data);
      if (data.sent > 0) setEmailText("");
    } catch {
      setResult({ sent: 0, errors: ["Nettverksfeil – prøv igjen"] });
    }
    setSending(false);
  }

  return (
    <div>
      <div className="mb-5">
        <h2 className="font-display text-xl font-semibold text-ink">Inviter via e-post</h2>
        <p className="text-sm text-ink-light mt-1">
          Lim inn e-postadresser (én per linje, komma eller semikolon). Hver person får en invitasjonslenke på e-post.
        </p>
      </div>
      <div className="bg-white rounded-xl border border-border p-6 space-y-4">
        <textarea
          rows={6}
          value={emailText}
          onChange={(e) => setEmailText(e.target.value)}
          placeholder={"navn@example.com\nandre@example.com\ntredje@example.com"}
          className="w-full rounded-lg border border-border px-4 py-3 text-sm text-ink font-mono placeholder:text-ink-light focus:outline-none focus:ring-2 focus:ring-forest/20 focus:border-forest resize-none"
        />
        {emails.length > 0 && (
          <p className="text-xs text-ink-light">
            {emails.length} gyldig{emails.length === 1 ? "" : "e"} e-postadresse{emails.length === 1 ? "" : "r"} funnet
          </p>
        )}
        {result && (
          <div className={`rounded-lg px-4 py-3 text-sm ${result.sent > 0 ? "bg-forest-light border border-forest/20 text-forest" : "bg-red-50 border border-red-200 text-red-700"}`}>
            {result.sent > 0 ? (
              <span className="flex items-center gap-1.5">
                <svg className="h-4 w-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
                {result.sent} invitasjon{result.sent === 1 ? "" : "er"} sendt
                {result.errors.length > 0 && ` (${result.errors.length} feilet)`}
              </span>
            ) : (
              <span>Sending feilet: {result.errors.join(", ")}</span>
            )}
          </div>
        )}
        <button
          type="button"
          onClick={handleSend}
          disabled={sending || emails.length === 0}
          className="px-5 py-2.5 rounded-lg bg-forest text-sm font-semibold text-white hover:bg-forest-mid transition-colors duration-[120ms] disabled:opacity-50"
        >
          {sending ? "Sender..." : `Send ${emails.length > 0 ? emails.length : ""} invitasjon${emails.length === 1 ? "" : "er"}`}
        </button>
      </div>
    </div>
  );
}

// Module-level: never embedded in JSX or logged — cleared on page unload
let _adminSecret = "";

export default function ClubAdminPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const searchParams = useSearchParams();
  const proSuccess = searchParams.get("pro") === "success";

  const [authenticated, setAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [upgrading, setUpgrading] = useState(false);
  const [club, setClub] = useState<Club | null>(null);
  const [listings, setListings] = useState<ListingWithRelations[]>([]);
  const [sellers, setSellers] = useState<Profile[]>([]);
  const [memberships, setMemberships] = useState<MembershipWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [slug, setSlug] = useState("");
  const [activeTab, setActiveTab] = useState<Tab>("oversikt");

  // Teams & loans state
  type Team = { id: number; name: string; description: string | null; created_at: string };
  type LoanItem = { id: number; name: string; description: string | null; condition: string | null; available: boolean };
  const [teams, setTeams] = useState<Team[]>([]);
  const [loanItems, setLoanItems] = useState<LoanItem[]>([]);
  const [newTeamName, setNewTeamName] = useState("");
  const [newTeamDesc, setNewTeamDesc] = useState("");
  const [addingTeam, setAddingTeam] = useState(false);
  const [newLoanName, setNewLoanName] = useState("");
  const [newLoanDesc, setNewLoanDesc] = useState("");
  const [newLoanCondition, setNewLoanCondition] = useState("God");
  const [addingLoan, setAddingLoan] = useState(false);

  // Branding form state
  const [branding, setBranding] = useState({
    color: "",
    secondary_color: "",
    description: "",
    logo_url: "",
    is_membership_gated: false,
    member_email_domain: "",
    lat: "",
    lng: "",
  });
  const [geoFetching, setGeoFetching] = useState(false);
  const [brandingSaving, setBrandingSaving] = useState(false);
  const [logoUploading, setLogoUploading] = useState(false);
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);

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
        .maybeSingle();

      if (!clubData) { setLoading(false); return; }
      setClub(clubData);
      setBranding({
        color: clubData.color ?? "#1a3c2e",
        secondary_color: clubData.secondary_color ?? "",
        description: clubData.description ?? "",
        logo_url: clubData.logo_url ?? "",
        is_membership_gated: clubData.is_membership_gated ?? false,
        member_email_domain: clubData.member_email_domain ?? "",
        lat: clubData.lat != null ? String(clubData.lat) : "",
        lng: clubData.lng != null ? String(clubData.lng) : "",
      });

      const [{ data: listingsData }, { data: sellersData }] = await Promise.all([
        supabase
          .from("listings")
          .select("*, clubs(*), profiles!listings_seller_id_fkey(*)")
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

      // Fetch inquiries for this club's listings
      const { data: inquiriesData } = await supabase
        .from("inquiries")
        .select("*, listing:listing_id(id, title)")
        .in(
          "listing_id",
          ((listingsData ?? []) as ListingWithRelations[]).map((l) => l.id)
        )
        .order("created_at", { ascending: false });
      setInquiries((inquiriesData ?? []) as Inquiry[]);

      // Fetch teams and loan items
      const [{ data: teamsData }, { data: loansData }] = await Promise.all([
        supabase.from("teams").select("*").eq("club_id", clubData.id).order("created_at"),
        supabase.from("loan_items").select("id, name, description, condition, available").eq("club_id", clubData.id).order("created_at"),
      ]);
      setTeams((teamsData ?? []) as Team[]);
      setLoanItems((loansData ?? []) as LoanItem[]);

      setLoading(false);
    });
  }, [params, fetchMemberships]);

  async function handleLogin(e: { preventDefault(): void }) {
    e.preventDefault();
    setAuthError("");
    const res = await fetch("/api/revalidate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-admin-secret": password,
      },
      body: JSON.stringify({ path: "/" }),
    });
    if (res.ok) {
      _adminSecret = password;
      setAuthenticated(true);
    } else {
      setAuthError("Feil passord. Kontakt Sportsbytte for tilgang.");
    }
  }

  async function handleUpgradePro() {
    if (!club) return;
    setUpgrading(true);
    try {
      const res = await fetch("/api/stripe/pro-subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-secret": _adminSecret },
        body: JSON.stringify({ club_slug: slug }),
      });
      const { url, error } = await res.json();
      if (url) {
        window.location.href = url;
      } else {
        showError(error ?? "Kunne ikke starte betaling.");
        setUpgrading(false);
      }
    } catch {
      showError("Noe gikk galt. Prøv igjen.");
      setUpgrading(false);
    }
  }

  async function handleMembershipAction(id: number, status: "approved" | "rejected") {
    await updateMembershipStatus(id, status);
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      fetch("/api/notify-membership", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ type: status, membership_id: id }),
      }).catch(() => {});
    }
    if (club) await fetchMemberships(club.id);
  }

  async function handleSaveBranding(e: { preventDefault(): void }) {
    e.preventDefault();
    if (!club) return;
    setBrandingSaving(true);
    const { error } = await supabase.from("clubs").update({
      color: branding.color,
      secondary_color: branding.secondary_color || null,
      description: branding.description || null,
      logo_url: branding.logo_url || null,
      is_membership_gated: branding.is_membership_gated,
      member_email_domain: branding.member_email_domain || null,
      lat: branding.lat ? parseFloat(branding.lat) : null,
      lng: branding.lng ? parseFloat(branding.lng) : null,
      updated_at: new Date().toISOString(),
    }).eq("id", club.id);
    setBrandingSaving(false);
    if (error) {
      showError(`Kunne ikke lagre: ${error.message}`);
      return;
    }
    setClub({ ...club, ...branding, secondary_color: branding.secondary_color || null, description: branding.description || null, logo_url: branding.logo_url || null, member_email_domain: branding.member_email_domain || null, lat: branding.lat ? parseFloat(branding.lat) : null, lng: branding.lng ? parseFloat(branding.lng) : null });
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      await fetch("/api/revalidate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ path: `/klubb/${slug}` }),
      });
    }
    showSuccess("Endringer lagret");
  }

  async function handleLogoUpload(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !club) return;
    setLogoUploading(true);
    const ext = file.name.split(".").pop() ?? "png";
    const path = `club-logos/${club.id}_${Date.now()}.${ext}`;
    const { data, error } = await supabase.storage
      .from("listing-images")
      .upload(path, file, { upsert: true });
    if (error) {
      showError(`Opplasting feilet: ${error.message}`);
      setLogoUploading(false);
      return;
    }
    const { data: urlData } = supabase.storage
      .from("listing-images")
      .getPublicUrl(data.path);
    setBranding((prev) => ({ ...prev, logo_url: urlData.publicUrl }));
    setLogoUploading(false);
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
  const inquiryCount = inquiries.length;
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
            {tab.id === "foresporsler" && inquiryCount > 0 && (
              <span className="ml-1.5 inline-flex h-4 w-4 items-center justify-center rounded-full bg-forest text-[10px] font-bold text-white">
                {inquiryCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── Tab: Oversikt ── */}
      {activeTab === "oversikt" && (
        <div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
            {[
              { label: "Aktive annonser", value: activeListings.length.toString() },
              { label: "Totalt solgt", value: soldListings.length.toString() },
              { label: "Medlemmer", value: club.members.toLocaleString("nb-NO") },
              { label: "Forespørsler", value: inquiryCount.toString() },
            ].map((stat) => (
              <div key={stat.label} className="bg-white rounded-xl p-5 border border-border">
                <p className="text-xs text-ink-light font-medium uppercase tracking-wider">{stat.label}</p>
                <p className="mt-1 text-2xl font-bold font-display text-ink">{stat.value}</p>
              </div>
            ))}
          </div>

          {/* Pro status / upgrade card */}
          {proSuccess && (
            <div className="mb-6 rounded-xl bg-forest-light border border-forest/20 px-5 py-4 flex items-center gap-3">
              <svg className="h-5 w-5 text-forest flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
              <p className="text-sm font-medium text-forest">
                Takk for kjøpet! Pro aktiveres innen et par minutter.
              </p>
            </div>
          )}
          {club.is_pro ? (
            <div className="mb-6 rounded-xl bg-amber-light border border-amber/30 px-5 py-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <svg className="h-5 w-5 text-amber flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                <p className="text-sm font-semibold text-amber">Pro-plan aktiv — kjøpere betaler 2 % servicegebyr og prioritert synlighet</p>
              </div>
              <button
                onClick={async () => {
                  if (!confirm("Er du sikker på at du vil avbryte Pro-abonnementet?")) return;
                  setUpgrading(true);
                  const res = await fetch("/api/stripe/pro-cancel", {
                    method: "POST",
                    headers: { "Content-Type": "application/json", "x-admin-secret": _adminSecret },
                    body: JSON.stringify({ club_slug: slug }),
                  });
                  if (res.ok) {
                    setClub((c) => c ? { ...c, is_pro: false } : c);
                    showSuccess("Pro-abonnement avbrutt.");
                  } else {
                    showError("Kunne ikke avbryte abonnementet.");
                  }
                  setUpgrading(false);
                }}
                disabled={upgrading}
                className="text-xs text-amber/70 hover:text-amber transition-colors duration-[120ms] flex-shrink-0 disabled:opacity-50"
              >
                Avbryt abonnement
              </button>
            </div>
          ) : (
            <div className="mb-6 rounded-xl border border-border bg-white overflow-hidden">
              <div className="px-6 py-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h3 className="font-display text-base font-semibold text-ink">Oppgrader til Pro</h3>
                  <p className="text-sm text-ink-light mt-0.5">
                    Kjøperne dine betaler lavere servicegebyr, prioritert synlighet og ubegrenset import — 499 kr/mnd
                  </p>
                </div>
                <button
                  onClick={handleUpgradePro}
                  disabled={upgrading}
                  className="flex-shrink-0 rounded-lg bg-amber px-5 py-2.5 text-sm font-semibold text-white hover:brightness-95 transition-all duration-[120ms] disabled:opacity-50"
                >
                  {upgrading ? "Åpner betaling..." : "Oppgrader — 499 kr/mnd"}
                </button>
              </div>
              <div className="border-t border-border px-6 py-3 flex flex-wrap gap-x-6 gap-y-1">
                {["2 % servicegebyr for kjøpere (vs. 5 %)", "Prioritert rekkefølge på /klubber", "Ubegrenset CSV-import"].map((f) => (
                  <span key={f} className="flex items-center gap-1.5 text-xs text-ink-light">
                    <svg className="h-3.5 w-3.5 text-amber flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                    </svg>
                    {f}
                  </span>
                ))}
              </div>
            </div>
          )}

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

            </div>
          </div>
        </div>
      )}

      {/* ── Tab: Analyse ── */}
      {activeTab === "analyse" && (() => {
        const sold = listings.filter((l) => l.is_sold);
        const active = listings.filter((l) => !l.is_sold);
        const totalRevenue = sold.reduce((sum, l) => sum + l.price, 0);
        const avgPrice = sold.length > 0 ? Math.round(totalRevenue / sold.length) : 0;

        // Top categories
        const catMap: Record<string, number> = {};
        for (const l of listings) catMap[l.category] = (catMap[l.category] ?? 0) + 1;
        const topCats = Object.entries(catMap)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 6);
        const maxCat = topCats[0]?.[1] ?? 1;

        // Monthly activity (last 6 months)
        const now = new Date();
        const months: { label: string; count: number }[] = [];
        for (let i = 5; i >= 0; i--) {
          const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
          const label = d.toLocaleDateString("nb-NO", { month: "short" });
          const count = listings.filter((l) => {
            const ld = new Date(l.created_at);
            return ld.getFullYear() === d.getFullYear() && ld.getMonth() === d.getMonth();
          }).length;
          months.push({ label, count });
        }
        const maxMonth = Math.max(...months.map((m) => m.count), 1);

        return (
          <div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
              {[
                { label: "Total omsetning", value: `${totalRevenue.toLocaleString("nb-NO")} kr` },
                { label: "Solgte varer", value: sold.length.toString() },
                { label: "Aktive annonser", value: active.length.toString() },
                { label: "Gjennomsnittspris", value: sold.length > 0 ? `${avgPrice.toLocaleString("nb-NO")} kr` : "—" },
              ].map((s) => (
                <div key={s.label} className="bg-white rounded-xl p-5 border border-border">
                  <p className="text-xs text-ink-light font-medium uppercase tracking-wider">{s.label}</p>
                  <p className="mt-1 text-2xl font-bold font-display text-ink">{s.value}</p>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              {/* Top categories */}
              <div className="bg-white rounded-xl border border-border p-6">
                <h3 className="font-display text-base font-semibold text-ink mb-4">Topp kategorier</h3>
                {topCats.length === 0 ? (
                  <p className="text-sm text-ink-light">Ingen annonser ennå.</p>
                ) : (
                  <div className="space-y-3">
                    {topCats.map(([cat, count]) => (
                      <div key={cat}>
                        <div className="flex items-center justify-between text-sm mb-1">
                          <span className="text-ink font-medium capitalize">{cat}</span>
                          <span className="text-ink-light">{count}</span>
                        </div>
                        <div className="h-2 rounded-full bg-forest-light overflow-hidden">
                          <div
                            className="h-full rounded-full bg-forest transition-all duration-500"
                            style={{ width: `${(count / maxCat) * 100}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Monthly activity */}
              <div className="bg-white rounded-xl border border-border p-6">
                <h3 className="font-display text-base font-semibold text-ink mb-4">Aktivitet siste 6 måneder</h3>
                <div className="flex items-end gap-2 h-32">
                  {months.map((m) => (
                    <div key={m.label} className="flex-1 flex flex-col items-center gap-1">
                      <span className="text-[10px] text-ink-light font-medium">{m.count > 0 ? m.count : ""}</span>
                      <div
                        className="w-full rounded-t-md bg-forest transition-all duration-500"
                        style={{ height: `${Math.max(4, (m.count / maxMonth) * 96)}px` }}
                      />
                      <span className="text-[10px] text-ink-light">{m.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Top sellers */}
            <div className="bg-white rounded-xl border border-border p-6">
              <h3 className="font-display text-base font-semibold text-ink mb-4">Mest aktive selgere</h3>
              {sellers.length === 0 ? (
                <p className="text-sm text-ink-light">Ingen selgere ennå.</p>
              ) : (
                <div className="divide-y divide-border">
                  {sellers.map((seller, i) => (
                    <div key={seller.id} className="flex items-center gap-4 py-3">
                      <span className="text-sm font-bold text-ink-light w-5 text-right flex-shrink-0">{i + 1}</span>
                      <div className="h-9 w-9 rounded-full bg-forest-light flex items-center justify-center text-forest text-xs font-bold flex-shrink-0">
                        {seller.avatar}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-ink truncate">{seller.name}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-sm font-bold text-forest">{seller.total_sold} solgt</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        );
      })()}

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

          {/* Bulk email invite */}
          <BulkEmailInviteSection club={club} />

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
            isPro={club.is_pro ?? false}
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

      {/* ── Tab: Forespørsler ── */}
      {activeTab === "foresporsler" && (
        <div>
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="font-display text-xl font-semibold text-ink">Forespørsler</h2>
              <p className="text-sm text-ink-light mt-1">Meldinger sendt via kontaktskjema på annonsene dine.</p>
            </div>
            <span className="text-sm text-ink-light">{inquiries.length} totalt</span>
          </div>

          {inquiries.length === 0 ? (
            <div className="bg-white rounded-xl border border-border px-6 py-16 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-cream">
                <svg className="h-7 w-7 text-ink-light" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                </svg>
              </div>
              <p className="font-display text-base font-semibold text-ink">Ingen forespørsler ennå</p>
              <p className="mt-1 text-sm text-ink-light">Når noen kontakter deg via en annonse vises meldingen her.</p>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-border divide-y divide-border">
              {inquiries.map((inq) => (
                <div key={inq.id} className="px-6 py-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-full bg-forest-light flex items-center justify-center text-forest text-xs font-bold flex-shrink-0">
                        {inq.buyer_name.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-ink">{inq.buyer_name}</p>
                        <a href={`mailto:${inq.buyer_email}`} className="text-xs text-forest hover:underline">
                          {inq.buyer_email}
                        </a>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      {inq.listing && (
                        <Link href={`/annonse/${inq.listing.id}`} className="text-xs text-forest hover:underline block">
                          {inq.listing.title}
                        </Link>
                      )}
                      <p className="text-xs text-ink-light mt-0.5">
                        {new Date(inq.created_at).toLocaleDateString("nb-NO", { day: "numeric", month: "short", year: "numeric" })}
                      </p>
                    </div>
                  </div>
                  <p className="mt-3 text-sm text-ink-mid bg-cream rounded-lg px-4 py-3">{inq.message}</p>
                  <a
                    href={`mailto:${inq.buyer_email}?subject=Re: ${inq.listing?.title ?? "din forespørsel"}`}
                    className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-forest hover:text-forest-mid transition-colors"
                  >
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                    </svg>
                    Svar via e-post
                  </a>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Tab: Utlån ── */}
      {activeTab === "utlan" && (
        <div className="max-w-2xl space-y-8">
          <div>
            <h2 className="font-display text-xl font-semibold text-ink">Utstyr til utlån</h2>
            <p className="text-sm text-ink-light mt-1">
              Legg inn klubbutstyr som medlemmer kan låne. Utlånsoversikten vises på klubbsiden.
            </p>
          </div>

          {/* Add loan item form */}
          <div className="bg-white rounded-xl border border-border p-6 space-y-4">
            <h3 className="font-display text-base font-semibold text-ink">Legg til utlånsobjekt</h3>
            <div>
              <label className="block text-xs font-medium text-ink mb-1.5">Navn *</label>
              <input
                type="text"
                value={newLoanName}
                onChange={(e) => setNewLoanName(e.target.value)}
                placeholder="f.eks. Keeperhansker str. M"
                className="w-full rounded-lg border border-border px-4 py-2.5 text-sm text-ink placeholder:text-ink-light focus:outline-none focus:ring-2 focus:ring-forest/20 focus:border-forest"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-ink mb-1.5">Beskrivelse</label>
              <textarea
                rows={2}
                value={newLoanDesc}
                onChange={(e) => setNewLoanDesc(e.target.value)}
                placeholder="Kort beskrivelse..."
                className="w-full rounded-lg border border-border px-4 py-2.5 text-sm text-ink placeholder:text-ink-light focus:outline-none focus:ring-2 focus:ring-forest/20 focus:border-forest resize-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-ink mb-1.5">Stand</label>
              <select
                value={newLoanCondition}
                onChange={(e) => setNewLoanCondition(e.target.value)}
                className="rounded-lg border border-border px-3 py-2.5 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-forest/20 focus:border-forest"
              >
                {["Ny", "Meget god", "God", "OK"].map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <button
              type="button"
              disabled={addingLoan || !newLoanName.trim()}
              onClick={async () => {
                if (!club || !newLoanName.trim()) return;
                setAddingLoan(true);
                const { data, error } = await supabase.from("loan_items").insert({
                  club_id: club.id,
                  name: newLoanName.trim(),
                  description: newLoanDesc.trim() || null,
                  condition: newLoanCondition,
                  available: true,
                }).select().maybeSingle();
                if (!error && data) {
                  setLoanItems((prev) => [...prev, data as LoanItem]);
                  setNewLoanName("");
                  setNewLoanDesc("");
                  setNewLoanCondition("God");
                  showSuccess("Utlånsobjekt lagt til");
                } else {
                  showError("Kunne ikke legge til utlånsobjekt");
                }
                setAddingLoan(false);
              }}
              className="px-5 py-2.5 rounded-lg bg-forest text-sm font-semibold text-white hover:bg-forest-mid transition-colors duration-[120ms] disabled:opacity-50"
            >
              {addingLoan ? "Legger til..." : "Legg til"}
            </button>
          </div>

          {/* Loan items list */}
          {loanItems.length > 0 && (
            <div className="bg-white rounded-xl border border-border divide-y divide-border">
              {loanItems.map((item) => (
                  <div key={item.id} className="px-6 py-4 flex items-center gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-medium text-ink">{item.name}</p>
                        {item.condition && (
                          <span className="text-[10px] font-bold uppercase tracking-wider bg-cream text-ink-light px-2 py-0.5 rounded-full">{item.condition}</span>
                        )}
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${item.available ? "bg-forest-light text-forest" : "bg-amber-light text-amber"}`}>
                          {item.available ? "Tilgjengelig" : "Utlånt"}
                        </span>
                      </div>
                      {item.description && (
                        <p className="text-xs text-ink-light mt-0.5">{item.description}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <button
                        type="button"
                        onClick={async () => {
                          await supabase.from("loan_items").update({ available: !item.available }).eq("id", item.id);
                          setLoanItems((prev) => prev.map((i) => i.id === item.id ? { ...i, available: !i.available } : i));
                        }}
                        className="text-xs text-ink-light hover:text-ink transition-colors"
                      >
                        {item.available ? "Merk utlånt" : "Merk tilgjengelig"}
                      </button>
                      <button
                        type="button"
                        onClick={async () => {
                          await supabase.from("loan_items").delete().eq("id", item.id);
                          setLoanItems((prev) => prev.filter((i) => i.id !== item.id));
                        }}
                        className="text-xs text-ink-light hover:text-red-500 transition-colors"
                      >
                        Slett
                      </button>
                    </div>
                  </div>
              ))}
            </div>
          )}

          {loanItems.length === 0 && (
            <div className="rounded-xl bg-white border border-border px-6 py-12 text-center">
              <p className="text-sm text-ink-light">Ingen utlånsobjekter ennå. Legg til det første over.</p>
            </div>
          )}
        </div>
      )}

      {/* ── Tab: Lag ── */}
      {activeTab === "lag" && (
        <div className="max-w-2xl space-y-8">
          <div>
            <h2 className="font-display text-xl font-semibold text-ink">Lag og grupper</h2>
            <p className="text-sm text-ink-light mt-1">
              Organiser klubben i lag (f.eks. Herrelaget, Juniorlaget, G16). Lag vises på klubbsiden.
            </p>
          </div>

          {/* Add team form */}
          <div className="bg-white rounded-xl border border-border p-6 space-y-4">
            <h3 className="font-display text-base font-semibold text-ink">Opprett nytt lag</h3>
            <div>
              <label className="block text-xs font-medium text-ink mb-1.5">Lagnavn *</label>
              <input
                type="text"
                value={newTeamName}
                onChange={(e) => setNewTeamName(e.target.value)}
                placeholder="f.eks. Herrelaget A"
                className="w-full rounded-lg border border-border px-4 py-2.5 text-sm text-ink placeholder:text-ink-light focus:outline-none focus:ring-2 focus:ring-forest/20 focus:border-forest"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-ink mb-1.5">Beskrivelse (valgfritt)</label>
              <input
                type="text"
                value={newTeamDesc}
                onChange={(e) => setNewTeamDesc(e.target.value)}
                placeholder="Kort beskrivelse av laget"
                className="w-full rounded-lg border border-border px-4 py-2.5 text-sm text-ink placeholder:text-ink-light focus:outline-none focus:ring-2 focus:ring-forest/20 focus:border-forest"
              />
            </div>
            <button
              type="button"
              disabled={addingTeam || !newTeamName.trim()}
              onClick={async () => {
                if (!club || !newTeamName.trim()) return;
                setAddingTeam(true);
                const { data, error } = await supabase.from("teams").insert({
                  club_id: club.id,
                  name: newTeamName.trim(),
                  description: newTeamDesc.trim() || null,
                }).select().maybeSingle();
                if (!error && data) {
                  setTeams((prev) => [...prev, data as Team]);
                  setNewTeamName("");
                  setNewTeamDesc("");
                  showSuccess("Lag opprettet");
                } else {
                  showError("Kunne ikke opprette lag");
                }
                setAddingTeam(false);
              }}
              className="px-5 py-2.5 rounded-lg bg-forest text-sm font-semibold text-white hover:bg-forest-mid transition-colors duration-[120ms] disabled:opacity-50"
            >
              {addingTeam ? "Oppretter..." : "Opprett lag"}
            </button>
          </div>

          {/* Teams list */}
          {teams.length > 0 && (
            <div className="bg-white rounded-xl border border-border divide-y divide-border">
              {teams.map((team) => (
                <div key={team.id} className="px-6 py-4 flex items-center gap-4">
                  <div
                    className="h-9 w-9 rounded-lg flex items-center justify-center font-bold text-white text-xs flex-shrink-0"
                    style={{ backgroundColor: club.color }}
                  >
                    {team.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-ink">{team.name}</p>
                    {team.description && (
                      <p className="text-xs text-ink-light mt-0.5">{team.description}</p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={async () => {
                      await supabase.from("teams").delete().eq("id", team.id);
                      setTeams((prev) => prev.filter((t) => t.id !== team.id));
                    }}
                    className="text-xs text-ink-light hover:text-red-500 transition-colors flex-shrink-0"
                  >
                    Slett
                  </button>
                </div>
              ))}
            </div>
          )}

          {teams.length === 0 && (
            <div className="rounded-xl bg-white border border-border px-6 py-12 text-center">
              <p className="text-sm text-ink-light">Ingen lag ennå. Opprett det første over.</p>
            </div>
          )}
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
                      value={branding.secondary_color || branding.color}
                      onChange={(e) => setBranding({ ...branding, secondary_color: e.target.value })}
                      className="h-10 w-14 rounded-lg border border-border cursor-pointer"
                    />
                    <input
                      type="text"
                      value={branding.secondary_color}
                      onChange={(e) => setBranding({ ...branding, secondary_color: e.target.value })}
                      placeholder="Tomt = samme som primærfarge"
                      className="flex-1 rounded-lg border border-border px-3 py-2 text-sm text-ink font-mono focus:outline-none focus:ring-2 focus:ring-forest/20 focus:border-forest"
                    />
                    {branding.secondary_color && (
                      <button
                        type="button"
                        onClick={() => setBranding({ ...branding, secondary_color: "" })}
                        className="text-xs text-ink-light hover:text-red-500 transition-colors flex-shrink-0"
                        title="Fjern sekundærfarge"
                      >
                        Nullstill
                      </button>
                    )}
                  </div>
                  <p className="text-xs text-ink-light mt-1.5">Brukes på knapper og accenter. La stå tomt for å bruke primærfargen.</p>
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
                    className="ml-auto rounded-lg px-4 py-1.5 text-xs font-semibold"
                    style={{ backgroundColor: branding.secondary_color || branding.color, color: contrastColor(branding.secondary_color || branding.color) }}
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
                <label className="block text-sm font-medium text-ink mb-3">Klubblogo</label>
                <div className="flex items-center gap-4">
                  {/* Preview */}
                  <div
                    className="h-16 w-16 rounded-full flex-shrink-0 flex items-center justify-center overflow-hidden border-2 border-border"
                    style={{ backgroundColor: branding.logo_url ? "transparent" : club.color }}
                  >
                    {branding.logo_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={branding.logo_url} alt="Logo" className="h-full w-full object-cover" />
                    ) : (
                      <span className="text-white font-bold text-lg">{club.initials}</span>
                    )}
                  </div>

                  <div className="flex-1 space-y-2">
                    <label className={`inline-flex items-center gap-2 cursor-pointer rounded-lg border border-border px-4 py-2 text-sm font-medium transition-colors duration-[120ms] ${logoUploading ? "opacity-50 cursor-not-allowed" : "hover:bg-cream"}`}>
                      <svg className="h-4 w-4 text-ink-light" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                      </svg>
                      {logoUploading ? "Laster opp..." : "Last opp bilde"}
                      <input
                        type="file"
                        accept="image/*"
                        className="sr-only"
                        disabled={logoUploading}
                        onChange={handleLogoUpload}
                      />
                    </label>
                    {branding.logo_url && (
                      <button
                        type="button"
                        onClick={() => setBranding({ ...branding, logo_url: "" })}
                        className="block text-xs text-ink-light hover:text-red-500 transition-colors duration-[120ms]"
                      >
                        Fjern logo
                      </button>
                    )}
                  </div>
                </div>
                <p className="text-xs text-ink-light mt-2">PNG, JPG eller SVG. Vises i banneret i stedet for initialene.</p>
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

            {/* Location */}
            <div className="bg-white rounded-xl border border-border p-6 space-y-4">
              <div>
                <h3 className="font-display text-base font-semibold text-ink">Klubbens plassering</h3>
                <p className="text-xs text-ink-light mt-0.5">
                  Gjør at kjøpere kan finne annonser fra klubben din via «Nær meg»-søk.
                </p>
              </div>

              {branding.lat && branding.lng ? (
                <div className="flex items-center justify-between gap-4 rounded-xl bg-forest-light border border-forest/20 px-4 py-3">
                  <div className="flex items-center gap-2.5">
                    <svg className="h-5 w-5 text-forest flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm6 2.5a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div>
                      <p className="text-sm font-semibold text-forest">Plassering er satt</p>
                      <p className="text-xs text-forest/70 font-mono">{parseFloat(branding.lat).toFixed(4)}, {parseFloat(branding.lng).toFixed(4)}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setBranding({ ...branding, lat: "", lng: "" })}
                    className="text-xs text-forest/60 hover:text-red-500 transition-colors flex-shrink-0"
                  >
                    Fjern
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <button
                    type="button"
                    disabled={geoFetching}
                    onClick={() => {
                      if (!navigator.geolocation) return;
                      setGeoFetching(true);
                      navigator.geolocation.getCurrentPosition(
                        (pos) => {
                          setBranding((b) => ({
                            ...b,
                            lat: pos.coords.latitude.toFixed(6),
                            lng: pos.coords.longitude.toFixed(6),
                          }));
                          setGeoFetching(false);
                        },
                        () => setGeoFetching(false)
                      );
                    }}
                    className="w-full rounded-xl border-2 border-dashed border-forest/30 px-5 py-4 flex items-center justify-center gap-3 text-sm font-semibold text-forest hover:bg-forest-light hover:border-forest/50 transition-all duration-[120ms] disabled:opacity-50"
                  >
                    <svg className="h-5 w-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm6 2.5a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {geoFetching ? "Henter posisjon..." : "Trykk her for å hente klubbens plassering automatisk"}
                  </button>
                  <p className="text-xs text-ink-light text-center">— eller fyll inn koordinater manuelt —</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-ink mb-1.5">Breddegrad (lat)</label>
                      <input
                        type="number"
                        step="any"
                        value={branding.lat}
                        onChange={(e) => setBranding({ ...branding, lat: e.target.value })}
                        placeholder="59.9139"
                        className="w-full rounded-lg border border-border px-3 py-2 text-sm text-ink placeholder:text-ink-light focus:outline-none focus:ring-2 focus:ring-forest/20 focus:border-forest font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-ink mb-1.5">Lengdegrad (lng)</label>
                      <input
                        type="number"
                        step="any"
                        value={branding.lng}
                        onChange={(e) => setBranding({ ...branding, lng: e.target.value })}
                        placeholder="10.7522"
                        className="w-full rounded-lg border border-border px-3 py-2 text-sm text-ink placeholder:text-ink-light focus:outline-none focus:ring-2 focus:ring-forest/20 focus:border-forest font-mono"
                      />
                    </div>
                  </div>
                </div>
              )}
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
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
