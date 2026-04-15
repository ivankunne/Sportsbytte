"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import type { ListingWithRelations } from "@/lib/queries";
import { formatDaysAgo } from "@/lib/queries";
import { ConditionBadge } from "@/components/ConditionBadge";
import { CategoryBadge } from "@/components/CategoryBadge";
import { ListingCard } from "@/components/ListingCard";
import { ComingSoonButton } from "@/components/ComingSoonButton";

export default function ListingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [listing, setListing] = useState<ListingWithRelations | null>(null);
  const [clubListings, setClubListings] = useState<ListingWithRelations[]>([]);
  const [sellerListings, setSellerListings] = useState<ListingWithRelations[]>([]);
  const [activeImage, setActiveImage] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    params.then(async ({ id }) => {
      const { data } = await supabase
        .from("listings")
        .select("*, clubs(*), profiles(*)")
        .eq("id", Number(id))
        .single();

      if (!data) {
        setLoading(false);
        return;
      }

      const l = data as ListingWithRelations;
      setListing(l);

      const [{ data: club }, { data: seller }] = await Promise.all([
        supabase
          .from("listings")
          .select("*, clubs(*), profiles(*)")
          .eq("club_id", l.club_id)
          .neq("id", l.id)
          .eq("is_sold", false)
          .limit(4),
        supabase
          .from("listings")
          .select("*, clubs(*), profiles(*)")
          .eq("seller_id", l.seller_id)
          .neq("id", l.id)
          .eq("is_sold", false)
          .limit(2),
      ]);

      setClubListings((club ?? []) as ListingWithRelations[]);
      setSellerListings((seller ?? []) as ListingWithRelations[]);
      setLoading(false);
    });
  }, [params]);

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-20 text-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-forest border-r-transparent" />
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-20 text-center">
        <h1 className="font-display text-3xl font-bold">Annonse ikke funnet</h1>
        <Link href="/utforsk" className="mt-4 inline-block text-forest hover:underline">
          Tilbake til utforsk
        </Link>
      </div>
    );
  }

  const images = listing.images.length > 0 ? listing.images : ["https://picsum.photos/seed/default/800/600"];
  const specs = listing.specs as Record<string, string> | null;

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
      {/* Breadcrumb */}
      <nav className="mb-6 text-sm text-ink-light">
        <Link href="/" className="hover:text-forest">Hjem</Link>
        <span className="mx-2">/</span>
        <Link href="/utforsk" className="hover:text-forest">Utforsk</Link>
        <span className="mx-2">/</span>
        <span className="text-ink">{listing.title}</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 lg:gap-12">
        {/* Left: Photos */}
        <div className="lg:col-span-3">
          <div className="relative aspect-[4/3] rounded-xl overflow-hidden bg-white">
            <Image
              src={images[activeImage]}
              alt={listing.title}
              fill
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 60vw"
              priority
            />
          </div>

          {images.length > 1 && (
            <div className="mt-3 grid grid-cols-4 gap-3">
              {images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setActiveImage(i)}
                  className={`relative aspect-[4/3] rounded-lg overflow-hidden bg-white ${
                    activeImage === i
                      ? "ring-2 ring-forest ring-offset-2"
                      : "opacity-70 hover:opacity-100"
                  } transition-all`}
                >
                  <Image src={img} alt={`Bilde ${i + 1}`} fill className="object-cover" sizes="15vw" />
                </button>
              ))}
            </div>
          )}

          {listing.description && (
            <div className="mt-8">
              <h2 className="font-display text-xl font-semibold text-ink mb-4">Beskrivelse</h2>
              <p className="text-ink-mid leading-relaxed">{listing.description}</p>
            </div>
          )}

          {specs && Object.keys(specs).length > 0 && (
            <div className="mt-8">
              <h2 className="font-display text-xl font-semibold text-ink mb-4">Spesifikasjoner</h2>
              <div className="bg-white rounded-xl overflow-hidden">
                <table className="w-full">
                  <tbody>
                    {Object.entries(specs).map(([key, value], i) => (
                      <tr key={key} className={i > 0 ? "border-t border-border" : ""}>
                        <td className="px-5 py-3 text-sm font-medium text-ink-light w-1/3">{key}</td>
                        <td className="px-5 py-3 text-sm text-ink">{value}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Right: Purchase panel */}
        <div className="lg:col-span-2">
          <div className="lg:sticky lg:top-24 space-y-6">
            <div className="bg-white rounded-xl p-6 border border-border">
              <div className="flex gap-2 mb-2">
                <CategoryBadge category={listing.category} />
                <ConditionBadge condition={listing.condition} size="md" />
              </div>
              <h1 className="font-display text-2xl font-bold text-ink leading-snug">
                {listing.title}
              </h1>

              <div className="flex items-baseline gap-2 mt-4 mb-6">
                <span className="text-3xl font-display font-bold text-forest">
                  {listing.price.toLocaleString("nb-NO")}
                </span>
                <span className="text-lg text-ink-mid">kr</span>
              </div>

              <div className="space-y-3 mb-6">
                <ComingSoonButton
                  feature="Vipps-betaling"
                  className="w-full rounded-lg bg-amber py-3.5 text-sm font-bold text-white hover:brightness-92 transition-colors duration-[120ms]"
                >
                  Kjøp nå
                </ComingSoonButton>
                <ComingSoonButton
                  feature="Meldinger"
                  className="w-full rounded-lg border-2 border-forest py-3 text-sm font-semibold text-forest hover:bg-forest hover:text-white transition-colors duration-[120ms]"
                >
                  Send melding til selger
                </ComingSoonButton>
              </div>

              <div className="flex items-start gap-3 p-4 rounded-xl bg-cream text-sm">
                <svg className="h-5 w-5 text-forest flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0H21M3.375 14.25V3.375c0-.621.504-1.125 1.125-1.125h9.75c.621 0 1.125.504 1.125 1.125v1.5m0 0h3.375c.621 0 1.125.504 1.125 1.125v1.5M15.375 6v11.25" />
                </svg>
                <div>
                  <p className="font-medium text-ink">Frakt med Bring fra 99 kr</p>
                  <p className="text-ink-mid mt-0.5">Label genereres automatisk</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 rounded-xl bg-forest-light text-sm mt-3">
                <svg className="h-5 w-5 text-forest flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                </svg>
                <div>
                  <p className="font-medium text-forest">Kjøperbeskyttelse inkludert</p>
                  <p className="text-forest-mid mt-0.5">Betaling via Vipps</p>
                </div>
              </div>
            </div>

            {/* Seller card */}
            <div className="bg-white rounded-xl p-6 border border-border">
              <h3 className="text-sm font-semibold text-ink-light uppercase tracking-wider mb-4">Selger</h3>
              <div className="flex items-center gap-3 mb-4">
                <div className="h-12 w-12 rounded-full bg-forest-light flex items-center justify-center text-forest font-bold text-sm">
                  {listing.profiles.avatar}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <Link href={`/profil/${listing.profiles.slug}`} className="font-medium text-ink hover:text-forest transition-colors duration-[120ms]">
                      {listing.profiles.name}
                    </Link>
                    <span className="inline-flex items-center gap-1 text-xs text-forest bg-forest-light rounded-full px-2 py-0.5">
                      <svg className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                      </svg>
                      Verifisert
                    </span>
                  </div>
                  <p className="text-xs text-ink-light">
                    Medlem siden {listing.profiles.member_since} • {listing.profiles.rating} ⭐
                  </p>
                </div>
              </div>

              <Link
                href={`/klubb/${listing.clubs.slug}`}
                className="flex items-center gap-2 p-3 rounded-lg bg-cream hover:bg-border transition-colors duration-[120ms]"
              >
                <div
                  className="h-8 w-8 rounded-full flex items-center justify-center text-white text-[10px] font-bold"
                  style={{ backgroundColor: listing.clubs.color }}
                >
                  {listing.clubs.initials}
                </div>
                <div>
                  <p className="text-sm font-medium text-forest">{listing.clubs.name}</p>
                  <p className="text-xs text-ink-light">Verifisert medlem</p>
                </div>
              </Link>

              <div className="mt-4 flex items-center gap-2 text-xs text-ink-light">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                {listing.views} visninger • {formatDaysAgo(listing.created_at)}
              </div>
            </div>
          </div>
        </div>
      </div>

      {clubListings.length > 0 && (
        <section className="mt-16">
          <div className="flex items-end justify-between mb-8">
            <h2 className="font-display text-2xl font-semibold text-ink">
              Andre annonser fra {listing.clubs.name}
            </h2>
            <Link href={`/klubb/${listing.clubs.slug}`} className="text-sm font-medium text-forest hover:text-forest-light transition-colors duration-[120ms]">
              Se alle →
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {clubListings.map((l) => (
              <ListingCard key={l.id} listing={l} />
            ))}
          </div>
        </section>
      )}

      {sellerListings.length > 0 && (
        <section className="mt-12 mb-4">
          <h2 className="font-display text-2xl font-semibold text-ink mb-8">Selger også</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {sellerListings.map((l) => (
              <ListingCard key={l.id} listing={l} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
