"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type ListingSnippet = {
  title: string;
  price: number;
  profiles: { name: string; is_pro: boolean } | null;
  clubs: { is_pro: boolean } | null;
};

function SuccessContent() {
  const params = useSearchParams();
  const listingId = params.get("listing_id");
  const [listing, setListing] = useState<ListingSnippet | null>(null);

  useEffect(() => {
    if (!listingId) return;
    supabase
      .from("listings")
      .select("title, price, profiles!listings_seller_id_fkey(name, is_pro), clubs(is_pro)")
      .eq("id", Number(listingId))
      .maybeSingle()
      .then(({ data }) => setListing(data as ListingSnippet | null));
  }, [listingId]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="max-w-sm w-full space-y-6">
        <div className="text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-forest-light mb-4">
            <svg className="h-8 w-8 text-forest" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
          </div>
          <h1 className="font-display text-2xl font-bold text-ink">Betaling fullført!</h1>
          <p className="mt-2 text-sm text-ink-light">
            Selgeren vil kontakte deg for å avtale levering.
          </p>
        </div>

        {listing && (() => {
          const isPro = listing.clubs?.is_pro || listing.profiles?.is_pro;
          const feeNok = Math.round(listing.price * (isPro ? 2 : 5)) / 100;
          const totalNok = listing.price + feeNok;
          return (
            <div className="rounded-xl border border-border bg-white p-5 space-y-3">
              <p className="text-xs font-semibold text-ink-light uppercase tracking-wider">Kvittering</p>
              <p className="text-sm font-semibold text-ink leading-snug">{listing.title}</p>
              {listing.profiles?.name && (
                <p className="text-xs text-ink-light">
                  Selger: <span className="text-ink font-medium">{listing.profiles.name}</span>
                </p>
              )}
              <div className="border-t border-border pt-3 space-y-1.5">
                <div className="flex justify-between text-xs text-ink-light">
                  <span>Varepris</span>
                  <span>{listing.price.toLocaleString("nb-NO")} kr</span>
                </div>
                <div className="flex justify-between text-xs text-ink-light">
                  <span>Servicegebyr</span>
                  <span>{feeNok.toLocaleString("nb-NO")} kr</span>
                </div>
                <div className="flex justify-between text-sm font-bold text-ink pt-1 border-t border-border">
                  <span>Totalt betalt</span>
                  <span className="text-forest">{totalNok.toLocaleString("nb-NO")} kr</span>
                </div>
              </div>
            </div>
          );
        })()}

        {/* Buyer protection notice */}
        <div className="rounded-xl border border-forest/20 bg-forest-light/50 p-4 space-y-2">
          <p className="text-xs font-semibold text-forest">Kjøperbeskyttelse</p>
          <p className="text-xs text-ink-mid leading-relaxed">
            Pengene holdes trygt av Sportsbytte. Når du mottar varen, trykker du
            <strong> &quot;Mottatt&quot;</strong> i dashbordet ditt, og selgeren får pengene sine.
          </p>
          <p className="text-xs text-ink-light">
            Frigjøres automatisk etter 7 dager hvis du ikke bekrefter.
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <Link
            href="/dashboard?tab=kjøp"
            className="rounded-lg bg-forest px-5 py-2.5 text-sm font-semibold text-white hover:bg-forest-mid transition-colors text-center"
          >
            Bekreft mottak i dashbordet
          </Link>
          {listingId && (
            <Link
              href={`/annonse/${listingId}`}
              className="rounded-lg border border-border px-5 py-2.5 text-sm font-semibold text-ink hover:bg-cream transition-colors text-center"
            >
              Se annonsen
            </Link>
          )}
          <a
            href={`mailto:hei@sportsbytte.no?subject=Problem med kjøp${listingId ? ` (annonse #${listingId})` : ""}&body=Hei,%0A%0AJeg har et problem med kjøp av annonse #${listingId ?? ""}.%0A%0ABeskriv problemet her:%0A`}
            className="text-center text-xs text-ink-light hover:text-forest transition-colors pt-1"
          >
            Problem med kjøpet? Kontakt oss →
          </a>
        </div>
      </div>
    </div>
  );
}

export default function VippsSuccessPage() {
  return (
    <Suspense>
      <SuccessContent />
    </Suspense>
  );
}
