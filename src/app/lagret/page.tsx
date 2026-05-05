"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import type { ListingWithRelations } from "@/lib/queries";
import { ListingCard } from "@/components/ListingCard";
import { ListingCardSkeleton } from "@/components/Skeleton";

export default function LagretPage() {
  const [listings, setListings] = useState<ListingWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const [loggedIn, setLoggedIn] = useState<boolean | null>(null);

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { setLoggedIn(false); setLoading(false); return; }
      setLoggedIn(true);

      const { data: profile } = await supabase
        .from("profiles").select("id").eq("auth_user_id", session.user.id).maybeSingle();
      if (!profile) { setLoading(false); return; }

      const { data: saved } = await supabase
        .from("saved_listings")
        .select("listing_id")
        .eq("profile_id", profile.id);

      if (!saved || saved.length === 0) { setLoading(false); return; }

      const ids = saved.map((s) => s.listing_id);
      const { data: raw } = await supabase
        .from("listings")
        .select("*, clubs(*), profiles!listings_seller_id_fkey(*)")
        .in("id", ids)
        .order("created_at", { ascending: false });

      setListings((raw ?? []) as ListingWithRelations[]);
      setLoading(false);
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="h-8 w-40 rounded-lg bg-cream animate-pulse mb-8" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, i) => <ListingCardSkeleton key={i} />)}
        </div>
      </div>
    );
  }

  if (!loggedIn) {
    return (
      <div className="mx-auto max-w-sm px-4 py-20 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-cream">
          <svg className="h-7 w-7 text-ink-light" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
          </svg>
        </div>
        <h1 className="font-display text-2xl font-bold text-ink">Logg inn for å se lagrede annonser</h1>
        <p className="mt-2 text-sm text-ink-light">Lagre annonser ved å trykke på hjertet.</p>
        <Link href="/dashboard" className="mt-6 inline-block rounded-lg bg-forest px-6 py-2.5 text-sm font-semibold text-white hover:bg-forest-mid transition-colors">
          Logg inn
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-3xl font-bold text-ink">Lagrede annonser</h1>
          <p className="mt-1 text-sm text-ink-light">
            {listings.length === 0 ? "Ingen lagrede annonser ennå" : `${listings.length} lagrede annonser`}
          </p>
        </div>
        <Link href="/utforsk" className="text-sm font-medium text-forest hover:text-forest-mid transition-colors">
          Utforsk utstyr →
        </Link>
      </div>

      {listings.length === 0 ? (
        <div className="text-center py-20">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-cream">
            <svg className="h-7 w-7 text-ink-light" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
            </svg>
          </div>
          <h2 className="font-display text-xl font-semibold text-ink">Ingen lagrede annonser</h2>
          <p className="mt-2 text-sm text-ink-light">Trykk på hjertet på en annonse for å lagre den her.</p>
          <Link href="/utforsk" className="mt-4 inline-block text-sm font-medium text-forest hover:underline">
            Utforsk utstyr
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {listings.map((listing) => (
            <ListingCard key={listing.id} listing={listing} initialSaved />
          ))}
        </div>
      )}
    </div>
  );
}
