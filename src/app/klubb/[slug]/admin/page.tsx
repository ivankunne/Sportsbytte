"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import type { Club, ListingWithRelations, Profile } from "@/lib/queries";

export default function ClubAdminPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const [authenticated, setAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [club, setClub] = useState<Club | null>(null);
  const [listings, setListings] = useState<ListingWithRelations[]>([]);
  const [sellers, setSellers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [slug, setSlug] = useState("");

  useEffect(() => {
    params.then(async (p) => {
      setSlug(p.slug);

      const { data: clubData } = await supabase
        .from("clubs")
        .select("*")
        .eq("slug", p.slug)
        .single();

      if (!clubData) {
        setLoading(false);
        return;
      }
      setClub(clubData);

      const [{ data: listingsData }, { data: sellersData }] = await Promise.all([
        supabase
          .from("listings")
          .select("*, clubs(*), profiles(*)")
          .eq("club_id", clubData.id)
          .eq("is_sold", false)
          .order("created_at", { ascending: false }),
        supabase
          .from("profiles")
          .select("*")
          .eq("club_id", clubData.id)
          .order("total_sold", { ascending: false })
          .limit(5),
      ]);

      setListings((listingsData ?? []) as ListingWithRelations[]);
      setSellers(sellersData ?? []);
      setLoading(false);
    });
  }, [params]);

  function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    // TODO: Replace with real Supabase auth
    if (password === "demo2026") {
      setAuthenticated(true);
      setError("");
    } else {
      setError("Feil passord. Kontakt Sportsbyttet for tilgang.");
    }
  }

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
          <h1 className="font-display text-xl font-bold text-ink">
            {club.name}
          </h1>
          <p className="text-sm text-ink-light mt-1 mb-6">
            Logg inn for å se administrasjonspanelet
          </p>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label htmlFor="admin-pw" className="sr-only">Passord</label>
              <input
                id="admin-pw"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Skriv inn passord"
                className="w-full rounded-lg border border-border px-4 py-2.5 text-sm text-center focus:outline-none focus:ring-2 focus:ring-forest/20 focus:border-forest"
              />
            </div>
            {error && (
              <p className="text-xs text-red-600">{error}</p>
            )}
            <button
              type="submit"
              className="w-full rounded-lg bg-forest py-2.5 text-sm font-semibold text-white hover:bg-forest-mid transition-colors duration-[120ms]"
            >
              Logg inn
            </button>
          </form>

          <p className="mt-6 text-xs text-ink-light">
            Har du ikke tilgang?{" "}
            <Link href="/kontakt" className="text-forest hover:underline">
              Kontakt oss
            </Link>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
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
        <Link href={`/klubb/${slug}`} className="text-sm font-medium text-forest hover:text-forest-mid transition-colors duration-[120ms]">
          ← Tilbake til klubbsiden
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-10">
        {[
          { label: "Aktive annonser", value: listings.length.toString() },
          { label: "Totalt solgt", value: club.total_sold.toString() },
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
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl border border-border">
            <div className="px-6 py-4 border-b border-border flex items-center justify-between">
              <h2 className="font-display text-lg font-semibold text-ink">Siste annonser</h2>
              <span className="text-xs text-ink-light">{listings.length} annonser</span>
            </div>
            <div className="divide-y divide-border">
              {listings.slice(0, 6).map((listing) => (
                <Link key={listing.id} href={`/annonse/${listing.id}`} className="px-6 py-4 flex items-center gap-4 hover:bg-cream/50 transition-colors duration-[120ms]">
                  <div className="h-12 w-12 rounded-lg bg-cream flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-ink truncate">{listing.title}</p>
                    <p className="text-xs text-ink-light">{listing.profiles.name}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-forest">{listing.price.toLocaleString("nb-NO")} kr</p>
                    <p className="text-xs text-ink-light">{listing.views} visninger</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-border p-6">
            <h2 className="font-display text-lg font-semibold text-ink mb-4">Aktive selgere</h2>
            <div className="space-y-3">
              {sellers.map((seller) => (
                <div key={seller.id} className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-forest-light flex items-center justify-center text-forest text-xs font-bold">
                    {seller.avatar}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-ink">{seller.name}</p>
                    <p className="text-xs text-ink-light">{seller.total_sold} solgt</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-border p-6">
            <h2 className="font-display text-lg font-semibold text-ink mb-4">Hurtighandlinger</h2>
            <p className="text-xs text-ink-light mb-3">Disse funksjonene kommer snart.</p>
            <div className="space-y-2">
              {[
                { label: "Inviter medlemmer", icon: "+" },
                { label: "Opprett byttemarked", icon: "📅" },
                { label: "Rediger klubbinfo", icon: "✏️" },
                { label: "Se fullstendig statistikk", icon: "📊" },
                { label: "Eksporter medlemsliste", icon: "📥" },
              ].map((action) => (
                <button
                  key={action.label}
                  className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm text-ink-light/50 cursor-not-allowed text-left"
                  disabled
                >
                  <span>{action.icon}</span>
                  {action.label}
                  <span className="ml-auto text-[10px] uppercase tracking-wider font-semibold text-ink-light bg-cream rounded-full px-2 py-0.5">Snart</span>
                </button>
              ))}
            </div>
          </div>

          <div className="bg-amber-light rounded-xl p-6 border border-amber">
            <h3 className="font-display text-base font-semibold text-ink">Oppgrader til Pro</h3>
            <p className="mt-1 text-sm text-ink-mid">
              Få avansert statistikk, flere admin-brukere og lavere transaksjonsgebyr.
            </p>
            <Link href="/priser" className="mt-3 inline-block text-sm font-semibold text-amber hover:text-amber-dark transition-colors duration-[120ms]">
              Se planer →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
