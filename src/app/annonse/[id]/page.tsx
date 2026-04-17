"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import type { ListingWithRelations } from "@/lib/queries";
import { formatDaysAgo } from "@/lib/queries";
import { showSuccess, showError } from "@/components/Toaster";
import { ConditionBadge } from "@/components/ConditionBadge";
import { CategoryBadge } from "@/components/CategoryBadge";
import { ListingCard } from "@/components/ListingCard";

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
  const [isSold, setIsSold] = useState(false);
  const [confirmSold, setConfirmSold] = useState(false);
  const [contactOpen, setContactOpen] = useState(false);
  const [contactSent, setContactSent] = useState(false);
  const [contactError, setContactError] = useState("");
  const [contact, setContact] = useState({ name: "", email: "", message: "" });
  const [buyModalOpen, setBuyModalOpen] = useState(false);

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
      setIsSold(l.is_sold);

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

  async function handleMarkSold() {
    if (!listing) return;
    const { error } = await supabase.from("listings").update({ is_sold: true }).eq("id", listing.id);
    if (error) { showError("Kunne ikke merke som solgt. Prøv igjen."); return; }
    setIsSold(true);
    setConfirmSold(false);
    showSuccess("Annonsen er merket som solgt!");
  }

  async function handleContact(e: { preventDefault(): void }) {
    e.preventDefault();
    if (!listing) return;
    if (!contact.name.trim() || !contact.email.trim() || !contact.message.trim()) {
      setContactError("Fyll inn alle feltene");
      return;
    }
    setContactError("");
    const res = await fetch("/api/inquiry", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        listing_id: listing.id,
        buyer_name: contact.name.trim(),
        buyer_email: contact.email.trim(),
        message: contact.message.trim(),
        listing_title: listing.title,
        seller_name: listing.profiles?.name ?? "",
      }),
    });
    if (!res.ok) { setContactError("Noe gikk galt. Prøv igjen."); return; }
    setContactSent(true);
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

              {isSold ? (
                <div className="mb-6 rounded-lg bg-ink-light/10 py-3.5 text-sm font-semibold text-ink-light text-center">
                  Solgt
                </div>
              ) : listing.listing_type === "iso" ? (
                <div className="mb-6 rounded-lg bg-amber-light border border-amber/30 py-3.5 px-4 text-sm text-amber-dark text-center font-medium">
                  Dette er et ettersøk — personen ønsker å kjøpe dette utstyret
                </div>
              ) : (
                <div className="space-y-3 mb-6">
                  <button
                    onClick={() => setBuyModalOpen(true)}
                    className="w-full rounded-lg bg-amber py-3.5 text-sm font-bold text-white hover:brightness-95 transition-all duration-[120ms]"
                  >
                    Kjøp nå via Vipps
                  </button>

                  {/* Contact seller */}
                  {!contactOpen ? (
                    <button
                      onClick={() => setContactOpen(true)}
                      className="w-full rounded-lg border-2 border-forest py-3 text-sm font-semibold text-forest hover:bg-forest hover:text-white transition-colors duration-[120ms]"
                    >
                      Send melding til selger
                    </button>
                  ) : (
                    <div className="rounded-xl border border-border p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-semibold text-ink">Send melding</h3>
                        <button
                          onClick={() => { setContactOpen(false); setContactSent(false); setContactError(""); }}
                          className="text-ink-light hover:text-ink transition-colors"
                        >
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                      {contactSent ? (
                        <p className="text-sm text-forest text-center py-3">Melding sendt! Selgeren vil kontakte deg. ✓</p>
                      ) : (
                        <form onSubmit={handleContact} className="space-y-2">
                          <input
                            type="text"
                            required
                            value={contact.name}
                            onChange={(e) => setContact({ ...contact, name: e.target.value })}
                            placeholder="Ditt navn"
                            className="w-full rounded-lg border border-border px-3 py-2 text-sm text-ink placeholder:text-ink-light focus:outline-none focus:ring-2 focus:ring-forest/20 focus:border-forest"
                          />
                          <input
                            type="email"
                            required
                            value={contact.email}
                            onChange={(e) => setContact({ ...contact, email: e.target.value })}
                            placeholder="Din e-post"
                            className="w-full rounded-lg border border-border px-3 py-2 text-sm text-ink placeholder:text-ink-light focus:outline-none focus:ring-2 focus:ring-forest/20 focus:border-forest"
                          />
                          <textarea
                            required
                            rows={3}
                            value={contact.message}
                            onChange={(e) => setContact({ ...contact, message: e.target.value })}
                            placeholder="Din melding til selger..."
                            className="w-full rounded-lg border border-border px-3 py-2 text-sm text-ink placeholder:text-ink-light focus:outline-none focus:ring-2 focus:ring-forest/20 focus:border-forest resize-none"
                          />
                          {contactError && <p className="text-xs text-red-600">{contactError}</p>}
                          <button
                            type="submit"
                            className="w-full rounded-lg bg-forest py-2.5 text-sm font-semibold text-white hover:bg-forest-mid transition-colors duration-[120ms]"
                          >
                            Send melding
                          </button>
                        </form>
                      )}
                    </div>
                  )}

                  {!confirmSold ? (
                    <button
                      onClick={() => setConfirmSold(true)}
                      className="w-full rounded-lg border border-border py-2 text-xs font-medium text-ink-light hover:bg-cream transition-colors duration-[120ms]"
                    >
                      Er du selgeren? Merk som solgt
                    </button>
                  ) : (
                    <div className="rounded-lg border border-amber/40 bg-amber/5 px-4 py-3 text-xs text-ink-mid">
                      <p className="font-medium text-ink mb-2 text-center">Merk annonsen som solgt?</p>
                      <div className="flex gap-2">
                        <button
                          onClick={handleMarkSold}
                          className="flex-1 rounded-lg bg-forest py-1.5 text-xs font-semibold text-white hover:bg-forest-mid transition-colors duration-[120ms]"
                        >
                          Bekreft
                        </button>
                        <button
                          onClick={() => setConfirmSold(false)}
                          className="flex-1 rounded-lg border border-border py-1.5 text-xs font-medium text-ink-light hover:bg-cream transition-colors duration-[120ms]"
                        >
                          Avbryt
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {listing.listing_type !== "iso" && (
                <>
                  <div className="flex items-start gap-3 p-4 rounded-xl bg-cream text-sm">
                    <svg className="h-5 w-5 text-forest flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0H21M3.375 14.25V3.375c0-.621.504-1.125 1.125-1.125h9.75c.621 0 1.125.504 1.125 1.125v1.5m0 0h3.375c.621 0 1.125.504 1.125 1.125v1.5M15.375 6v11.25" />
                    </svg>
                    <div>
                      <p className="font-medium text-ink">Frakt med Bring fra 99 kr</p>
                      <p className="text-ink-mid mt-0.5">Fraktlabel genereres automatisk etter kjøp</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-4 rounded-xl bg-forest-light text-sm mt-3">
                    <svg className="h-5 w-5 text-forest flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                    </svg>
                    <div>
                      <p className="font-medium text-forest">Kjøperbeskyttelse inkludert</p>
                      <p className="text-forest-mid mt-0.5">Trygg betaling via Vipps</p>
                    </div>
                  </div>
                </>
              )}
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
                    {listing.profiles.total_sold} solgte varer
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

      {/* Vipps payment modal */}
      {buyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setBuyModalOpen(false)} />
          <div className="relative bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="bg-forest px-6 py-5 flex items-center justify-between">
              <div>
                <p className="text-white/70 text-xs font-medium">Kjøp</p>
                <h2 className="font-display text-lg font-bold text-white leading-tight">{listing.title}</h2>
              </div>
              <button onClick={() => setBuyModalOpen(false)} className="text-white/60 hover:text-white transition-colors ml-4 flex-shrink-0">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* Price summary */}
              <div className="rounded-xl bg-cream p-4 flex items-center justify-between">
                <span className="text-sm text-ink-light">Pris</span>
                <span className="font-display text-xl font-bold text-forest">{listing.price.toLocaleString("nb-NO")} kr</span>
              </div>

              {/* How it works */}
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-ink-light mb-3">Slik fungerer det</p>
                <ol className="space-y-3">
                  {[
                    { n: "1", text: "Betal trygt med Vipps — pengene holdes av Sportsbyttet" },
                    { n: "2", text: "Selger pakker og sender med Bring — label genereres automatisk" },
                    { n: "3", text: "Du mottar varen og bekrefter — pengene frigjøres til selger" },
                  ].map((step) => (
                    <li key={step.n} className="flex items-start gap-3">
                      <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-forest text-white text-xs font-bold">
                        {step.n}
                      </span>
                      <span className="text-sm text-ink-mid leading-snug pt-0.5">{step.text}</span>
                    </li>
                  ))}
                </ol>
              </div>

              {/* Coming soon notice */}
              <div className="rounded-xl bg-amber-light border border-amber/20 p-4 text-center">
                <p className="text-sm font-semibold text-ink">Betaling via Vipps lanseres snart</p>
                <p className="text-xs text-ink-mid mt-1">I mellomtiden — ta kontakt med selger for å avtale kjøp direkte.</p>
              </div>

              <button
                onClick={() => { setBuyModalOpen(false); setContactOpen(true); }}
                className="w-full rounded-lg bg-forest py-3 text-sm font-semibold text-white hover:bg-forest-mid transition-colors duration-[120ms]"
              >
                Send melding til selger
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
