"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { QRCodeSVG } from "qrcode.react";
import { supabase } from "@/lib/supabase";
import type { ListingWithRelations } from "@/lib/queries";
import { formatDaysAgo } from "@/lib/queries";
import { showSuccess, showError } from "@/components/Toaster";
import { ConditionBadge } from "@/components/ConditionBadge";
import { CategoryBadge } from "@/components/CategoryBadge";
import { ListingCard } from "@/components/ListingCard";
import { ListingChat } from "@/components/ListingChat";
import { ReportListingButton } from "@/components/ReportListingButton";
import { saveRecentlyViewed } from "@/components/RecentlyViewed";

function getCO2SavedKg(category: string): number {
  const c = category.toLowerCase();
  if (c.includes("sykkel")) return 45;
  if (c.includes("ski") || c.includes("alpint") || c.includes("snowboard")) return 35;
  if (c.includes("langrenn")) return 30;
  if (c.includes("klatring") || c.includes("friluft")) return 20;
  if (c.includes("hockey") || c.includes("ishockey")) return 15;
  if (c.includes("løp") || c.includes("friidrett")) return 12;
  if (c.includes("fotball") || c.includes("håndball") || c.includes("basket")) return 8;
  if (c.includes("tennis") || c.includes("padel") || c.includes("badminton")) return 6;
  if (c.includes("svøm")) return 5;
  return 10;
}

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://sportsbytte.no";

export function ListingDetail({ id }: { id: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [listing, setListing] = useState<ListingWithRelations | null>(null);
  const [clubListings, setClubListings] = useState<ListingWithRelations[]>([]);
  const [sellerListings, setSellerListings] = useState<ListingWithRelations[]>([]);
  const [relatedListings, setRelatedListings] = useState<ListingWithRelations[]>([]);
  const [activeImage, setActiveImage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isSold, setIsSold] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [checkingOut, setCheckingOut] = useState(false);
  const [showCheckoutConfirm, setShowCheckoutConfirm] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [qrOpen, setQrOpen] = useState(false);
  const [publishedModal, setPublishedModal] = useState(false);
  const [canNativeShare, setCanNativeShare] = useState(false);
  const [demoCTAOpen, setDemoCTAOpen] = useState(false);
  const [ratingValue, setRatingValue] = useState(0);
  const [ratingHover, setRatingHover] = useState(0);
  const [ratingName, setRatingName] = useState("");
  const [ratingComment, setRatingComment] = useState("");
  const [ratingSubmitted, setRatingSubmitted] = useState(false);
  const [ratingLoading, setRatingLoading] = useState(false);
  const [isMembersOnly, setIsMembersOnly] = useState(false);
  const [isApprovedMember, setIsApprovedMember] = useState(false);
  const [offerOpen, setOfferOpen] = useState(false);
  const [offerAmount, setOfferAmount] = useState("");
  const [offerMessage, setOfferMessage] = useState("");
  const [offerSubmitting, setOfferSubmitting] = useState(false);
  const [myProfileId, setMyProfileId] = useState<number | null>(null);
  const [isBlocked, setIsBlocked] = useState(false);
  const [blockLoading, setBlockLoading] = useState(false);
  const shareRef = useRef<HTMLDivElement>(null);

  // Close share dropdown on outside click
  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (shareRef.current && !shareRef.current.contains(e.target as Node)) {
        setShareOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("listings")
        .select("*, clubs(*), profiles!listings_seller_id_fkey(*)")
        .eq("id", Number(id))
        .maybeSingle();

      if (!data) {
        setLoading(false);
        return;
      }

      const l = data as ListingWithRelations;
      setListing(l);
      setIsSold(l.is_sold);

      // Save to recently viewed
      saveRecentlyViewed({
        id: l.id,
        title: l.title,
        price: l.price,
        image: l.images?.[0] ?? "",
        listing_type: l.listing_type ?? undefined,
      });

      // Fire-and-forget view increment
      fetch("/api/listing-view", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listing_id: Number(id) }),
      }).catch(() => {});

      // Check members_only access
      if (l.members_only && l.club_id) {
        setIsMembersOnly(true);
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          const { data: prof } = await supabase.from("profiles").select("id").eq("auth_user_id", session.user.id).maybeSingle();
          if (prof) {
            const { data: mem } = await supabase.from("memberships").select("status").eq("club_id", l.club_id).eq("profile_id", prof.id).eq("status", "approved").maybeSingle();
            setIsApprovedMember(!!mem);
          }
        }
      }

      const cutoff = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString();
      const soldFilter = `is_sold.eq.false,and(is_sold.eq.true,updated_at.gt.${cutoff})`;
      const clubQuery = l.club_id
        ? supabase
            .from("listings")
            .select("*, clubs(*), profiles!listings_seller_id_fkey(*)")
            .eq("club_id", l.club_id)
            .neq("id", l.id)
            .or(soldFilter)
            .limit(4)
        : Promise.resolve({ data: [] });
      const listingLat = (l as unknown as { lat: number | null }).lat;
      const listingLng = (l as unknown as { lat: number | null; lng: number | null }).lng;
      const latDelta = 50 / 111.32;
      const lngDelta = listingLat ? 50 / (111.32 * Math.cos(listingLat * Math.PI / 180)) : latDelta;

      const [{ data: club }, { data: seller }, { data: relClub }, { data: relNearby }] = await Promise.all([
        clubQuery,
        supabase
          .from("listings")
          .select("*, clubs(*), profiles!listings_seller_id_fkey(*)")
          .eq("seller_id", l.seller_id)
          .neq("id", l.id)
          .or(soldFilter)
          .limit(2),
        l.club_id
          ? supabase
              .from("listings")
              .select("*, clubs(*), profiles!listings_seller_id_fkey(*)")
              .eq("category", l.category)
              .eq("club_id", l.club_id)
              .eq("is_sold", false)
              .neq("id", l.id)
              .limit(4)
          : Promise.resolve({ data: [] as unknown[] }),
        listingLat && listingLng
          ? supabase
              .from("listings")
              .select("*, clubs(*), profiles!listings_seller_id_fkey(*)")
              .eq("category", l.category)
              .eq("is_sold", false)
              .neq("id", l.id)
              .gte("lat", listingLat - latDelta)
              .lte("lat", listingLat + latDelta)
              .gte("lng", listingLng - lngDelta)
              .lte("lng", listingLng + lngDelta)
              .not("lat", "is", null)
              .limit(4)
          : Promise.resolve({ data: [] as unknown[] }),
      ]);

      setClubListings((club ?? []) as ListingWithRelations[]);
      setSellerListings((seller ?? []) as ListingWithRelations[]);

      const seen = new Set<number>([l.id]);
      const related: ListingWithRelations[] = [];
      for (const item of [...(relClub ?? []), ...(relNearby ?? [])]) {
        const r = item as ListingWithRelations;
        if (!seen.has(r.id) && related.length < 4) {
          seen.add(r.id);
          related.push(r);
        }
      }
      setRelatedListings(related);
      setLoading(false);
    })();
  }, [id]);

  // Detect native share support after mount
  useEffect(() => {
    setCanNativeShare(typeof navigator !== "undefined" && !!navigator.share);
  }, []);

  // Show publish success modal when redirected from /selg
  useEffect(() => {
    if (searchParams.get("published") === "1") {
      setPublishedModal(true);
      router.replace(`/annonse/${id}`, { scroll: false });
    }
  }, [searchParams, id, router]);

  // Load viewer's profile + blocked status once listing is available
  useEffect(() => {
    if (!listing) return;
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const { data: prof } = await supabase.from("profiles").select("id").eq("auth_user_id", session.user.id).maybeSingle();
      if (!prof || prof.id === listing.profiles.id) return;
      setMyProfileId(prof.id);
      const { data: blockRow } = await supabase
        .from("blocked_users")
        .select("id")
        .eq("blocker_id", prof.id)
        .eq("blocked_id", listing.profiles.id)
        .maybeSingle();
      setIsBlocked(!!blockRow);
    })();
  }, [listing?.profiles.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Realtime: update quantity / sold state when webhook fires
  useEffect(() => {
    const channel = supabase
      .channel(`listing-${id}`)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "listings", filter: `id=eq.${id}` }, (payload) => {
        const updated = payload.new as { quantity?: number | null; is_sold?: boolean };
        setListing((prev) => prev ? { ...prev, quantity: updated.quantity ?? prev.quantity, is_sold: updated.is_sold ?? prev.is_sold } : prev);
        if (updated.is_sold) setIsSold(true);
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [id]);

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


  const images = listing.images.length > 0 ? listing.images : ["/placeholder-listing.svg"];
  const specs = listing.specs as Record<string, string> | null;

  const listingUrl = `${SITE_URL}/annonse/${id}`;

  async function copyLink() {
    await navigator.clipboard.writeText(listingUrl);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  }

  function shareWhatsApp() {
    const text = encodeURIComponent(`${listing!.title} — ${listing!.price.toLocaleString("nb-NO")} kr\n${listingUrl}`);
    window.open(`https://wa.me/?text=${text}`, "_blank");
    setShareOpen(false);
  }

  async function handleNativeShare() {
    try {
      await navigator.share({
        title: listing!.title,
        text: `${listing!.title} — ${listing!.price.toLocaleString("nb-NO")} kr`,
        url: listingUrl,
      });
    } catch {}
    setShareOpen(false);
  }

  async function handleRate() {
    if (!listing || ratingValue === 0) return;
    setRatingLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Logg inn for å gi vurdering");
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          profile_id: listing.profiles.id,
          rating: ratingValue,
          text: ratingComment,
        }),
      });
      const reviewRes = await res.json();
      if (!res.ok) {
        if (reviewRes.error === "already_reviewed") {
          setRatingSubmitted(true);
          showError("Du har allerede vurdert denne selgeren.");
        } else if (reviewRes.error === "no_purchase") {
          showError("Du kan bare vurdere selgere du har kjøpt fra.");
        } else {
          throw new Error();
        }
        return;
      }
      setRatingSubmitted(true);
      showSuccess("Vurdering sendt! Takk for tilbakemeldingen.");
    } catch {
      showError("Kunne ikke sende vurdering. Prøv igjen.");
    } finally {
      setRatingLoading(false);
    }
  }

  async function handleBuyNow() {
    setCheckingOut(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        showError("Logg inn for å kjøpe");
        setCheckingOut(false);
        return;
      }
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ listing_id: Number(id) }),
      });
      const json = await res.json();
      if (json.url) {
        window.location.href = json.url;
      } else {
        if (json.error === "seller_onboarding_incomplete") {
          showError("Selgeren har ikke fullført betalingsoppsettet sitt ennå. Send dem en melding og be dem fullføre det.");
        } else if (json.error === "members_only") {
          showError("Denne annonsen er kun for godkjente klubbmedlemmer.");
        } else {
          showError(json.error ?? "Noe gikk galt");
        }
        setCheckingOut(false);
      }
    } catch {
      showError("Noe gikk galt");
      setCheckingOut(false);
    }
  }

  async function handleBlockUser() {
    if (!myProfileId) return;
    setBlockLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      await fetch("/api/block-user", {
        method: isBlocked ? "DELETE" : "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({ blocked_id: listing!.profiles.id }),
      });
      setIsBlocked((v) => !v);
      showSuccess(isBlocked ? "Blokkering fjernet." : "Bruker blokkert.");
    } catch {
      showError("Noe gikk galt.");
    } finally {
      setBlockLoading(false);
    }
  }

  async function handleSubmitOffer() {
    const amt = parseInt(offerAmount);
    if (!amt || amt <= 0) return;
    setOfferSubmitting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { showError("Logg inn for å gi bud"); setOfferSubmitting(false); return; }
      const res = await fetch("/api/offers", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({ listing_id: Number(id), amount: amt, message: offerMessage }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Noe gikk galt");
      // Close the offer modal and open the chat where the bid message now lives
      setOfferOpen(false);
      setOfferAmount("");
      setOfferMessage("");
      setChatOpen(true);
    } catch (err) {
      showError(err instanceof Error ? err.message : "Noe gikk galt");
    } finally {
      setOfferSubmitting(false);
    }
  }

  function Stars({ value, interactive = false }: { value: number; interactive?: boolean }) {
    const display = interactive ? (ratingHover || ratingValue) : value;
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((i) => (
          <svg
            key={i}
            className={`${interactive ? "h-7 w-7 cursor-pointer" : "h-3.5 w-3.5"} ${i <= Math.round(display) ? "text-amber" : "text-border"} transition-colors`}
            viewBox="0 0 20 20"
            fill="currentColor"
            onClick={interactive ? () => setRatingValue(i) : undefined}
            onMouseEnter={interactive ? () => setRatingHover(i) : undefined}
            onMouseLeave={interactive ? () => setRatingHover(0) : undefined}
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
      </div>
    );
  }

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

      {listing.is_demo && (
        <div className="mb-6 rounded-xl border border-yellow-300 bg-yellow-50 px-5 py-4 flex items-start gap-3">
          <svg className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
          </svg>
          <div>
            <p className="text-sm font-semibold text-yellow-800">Dette er en eksempel-annonse</p>
            <p className="text-xs text-yellow-700 mt-0.5">Annonsen er kun for demonstrasjon og kan ikke kjøpes. Registrer klubben din for å legge ut ekte annonser.</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-8 lg:gap-12">
        {/* Left: Photos */}
        <div className="md:col-span-2 lg:col-span-3">
          <div
            className="relative aspect-[4/3] rounded-xl overflow-hidden bg-white cursor-zoom-in"
            onClick={() => setLightboxOpen(true)}
          >
            <Image
              src={images[activeImage]}
              alt={listing.title}
              fill
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 60vw"
              priority
            />
            <div className="absolute bottom-3 right-3 rounded-full bg-black/30 p-2 text-white backdrop-blur-sm">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607zM10.5 7.5v6m3-3h-6" />
              </svg>
            </div>
            {listing.is_demo && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
                <span className="rotate-[-35deg] text-white/20 font-black text-7xl tracking-widest select-none">
                  EKSEMPEL
                </span>
              </div>
            )}
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
        <div className="md:col-span-1 lg:col-span-2">
          <div className="lg:sticky lg:top-24 space-y-6">
            <div className="bg-white rounded-xl p-6 border border-border">
              <div className="flex gap-2 mb-2">
                <CategoryBadge category={listing.category} />
                <ConditionBadge condition={listing.condition} size="md" />
              </div>
              <h1 className="font-display text-2xl font-bold text-ink leading-snug">
                {listing.title}
              </h1>

              <div className="flex items-baseline gap-2 mt-4 mb-2">
                {listing.listing_type === "gi_bort" ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-green-100 border border-green-300 px-3 py-1 text-lg font-bold text-green-800">
                    🎁 Gratis
                  </span>
                ) : (
                  <>
                    <span className="text-3xl font-display font-bold text-forest">
                      {listing.price.toLocaleString("nb-NO")}
                    </span>
                    <span className="text-lg text-ink-mid">kr</span>
                  </>
                )}
              </div>
              {listing.location && (
                <div className="flex items-center gap-2 mt-3 mb-1 px-3 py-2 rounded-lg bg-cream border border-border">
                  <svg className="h-4 w-4 text-forest flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm6 2.5a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <p className="text-[10px] font-semibold text-ink-light uppercase tracking-wider">Hentested</p>
                    <p className="text-sm font-medium text-ink">{listing.location}</p>
                  </div>
                </div>
              )}
              {listing.listing_type === "bulk" && listing.quantity !== null && listing.quantity > 0 && (
                <p className="text-xs text-ink-light mb-1">{listing.quantity} igjen på lager</p>
              )}
              {listing.listing_type === "bulk" && listing.size_range && (
                <p className="text-xs text-ink-light mb-5">Størrelser: {listing.size_range}</p>
              )}

              {listing.is_demo ? (
                <div className="mb-6">
                  <button
                    onClick={() => setDemoCTAOpen(true)}
                    className="w-full rounded-lg bg-yellow-400 py-3.5 text-sm font-bold text-yellow-900 hover:bg-yellow-300 transition-colors duration-[120ms] flex items-center justify-center gap-2"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    Registrer klubben din
                  </button>
                  <p className="text-xs text-ink-light text-center mt-2">Dette er en demo-annonse — kjøp er ikke mulig</p>
                </div>
              ) : isSold ? (
                <div className="mb-6 space-y-4">
                  <div className="rounded-lg bg-ink-light/10 py-3.5 text-sm font-semibold text-ink-light text-center">
                    Solgt
                  </div>
                  {ratingSubmitted ? (
                    <div className="rounded-lg bg-forest-light border border-forest/20 px-4 py-3 text-sm text-forest text-center font-medium">
                      Takk for vurderingen!
                    </div>
                  ) : (
                    <div className="rounded-lg border border-border bg-cream px-4 py-4 space-y-3">
                      <p className="text-xs font-semibold text-ink">Var du kjøperen? Gi selgeren en vurdering</p>
                      <Stars value={ratingValue} interactive />
                      <input
                        type="text"
                        value={ratingName}
                        onChange={(e) => setRatingName(e.target.value)}
                        placeholder="Ditt navn"
                        className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-forest/20"
                      />
                      <textarea
                        value={ratingComment}
                        onChange={(e) => setRatingComment(e.target.value)}
                        placeholder="Kommentar (valgfritt)"
                        rows={2}
                        className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-forest/20 resize-none"
                      />
                      <button
                        onClick={handleRate}
                        disabled={ratingValue === 0 || !ratingName.trim() || ratingLoading}
                        className="w-full rounded-lg bg-forest py-2 text-xs font-semibold text-white hover:bg-forest-mid transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {ratingLoading ? "Sender..." : "Send vurdering"}
                      </button>
                    </div>
                  )}
                </div>
              ) : listing.listing_type === "gi_bort" ? (
                <div className="mb-6 space-y-3">
                  <div className="rounded-lg bg-green-50 border border-green-200 py-3.5 px-4 text-sm text-green-800 text-center font-medium">
                    🎁 Denne gjenstanden gis bort gratis
                  </div>
                  <button
                    onClick={() => setChatOpen(true)}
                    className="w-full rounded-lg bg-forest py-3.5 text-sm font-bold text-white hover:bg-forest-mid transition-colors duration-[120ms] flex items-center justify-center gap-2"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
                    </svg>
                    Kontakt selger
                  </button>
                </div>
              ) : listing.listing_type === "iso" ? (
                <div className="mb-6 rounded-lg bg-amber-light border border-amber/30 py-3.5 px-4 text-sm text-amber-dark text-center font-medium">
                  Dette er et ettersøk — personen ønsker å kjøpe dette utstyret
                </div>
              ) : isMembersOnly && !isApprovedMember ? (
                <div className="mb-6 rounded-lg border border-border bg-cream px-4 py-5 text-center space-y-2">
                  <svg className="mx-auto h-6 w-6 text-ink-light" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                  </svg>
                  <p className="text-sm font-semibold text-ink">Kun for klubbmedlemmer</p>
                  <p className="text-xs text-ink-light">Du må være godkjent medlem av klubben for å kjøpe denne annonsen.</p>
                  {listing.club_id && (listing.clubs as { slug?: string })?.slug && (
                    <Link
                      href={`/klubb/${(listing.clubs as { slug: string }).slug}`}
                      className="inline-block mt-1 text-xs font-semibold text-forest hover:underline"
                    >
                      Søk om medlemskap →
                    </Link>
                  )}
                </div>
              ) : (
                <div className="space-y-3 mb-6">
                  {(listing.profiles as { stripe_account_id?: string | null; stripe_onboarding_complete?: boolean }).stripe_account_id &&
                   (listing.profiles as { stripe_onboarding_complete?: boolean }).stripe_onboarding_complete && (
                    <button
                      onClick={() => setShowCheckoutConfirm(true)}
                      disabled={checkingOut}
                      className="w-full rounded-lg bg-ink py-3.5 text-sm font-bold text-white hover:bg-ink/90 transition-colors duration-[120ms] flex items-center justify-center gap-2 disabled:opacity-60"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
                      </svg>
                      {checkingOut ? "Åpner betaling..." : `Kjøp nå — ${listing.price.toLocaleString("nb-NO")} kr`}
                    </button>
                  )}
                  {(listing.profiles as { stripe_account_id?: string | null; stripe_onboarding_complete?: boolean }).stripe_account_id &&
                   (listing.profiles as { stripe_onboarding_complete?: boolean }).stripe_onboarding_complete && (() => {
                    const isPro = (listing.clubs as { is_pro?: boolean })?.is_pro || (listing.profiles as { is_pro?: boolean })?.is_pro;
                    const feeNok = Math.round(listing.price * (isPro ? 2 : 5)) / 100;
                    return (
                      <p className="text-xs text-ink-light text-center -mt-1">
                        + {feeNok.toLocaleString("nb-NO")} kr servicegebyr · totalt {(listing.price + feeNok).toLocaleString("nb-NO")} kr
                      </p>
                    );
                  })()}
                  <button
                    onClick={() => setChatOpen(true)}
                    className="w-full rounded-lg bg-forest py-3.5 text-sm font-bold text-white hover:bg-forest-mid transition-colors duration-[120ms] flex items-center justify-center gap-2"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
                    </svg>
                    Send melding til selger
                  </button>
                  <button
                    onClick={() => setOfferOpen(true)}
                    className="w-full rounded-lg border border-border py-3 text-sm font-semibold text-ink hover:bg-cream transition-colors duration-[120ms] flex items-center justify-center gap-2"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Gi bud
                  </button>
                </div>
              )}

              {listing.listing_type !== "iso" && (() => {
                const dm = listing.delivery_method;
                const label =
                  dm === "pickup" ? "Hentes av kjøper" :
                  dm === "shipping" ? "Kan sendes" :
                  "Henting eller sending";
                const desc =
                  dm === "pickup" ? "Avtal sted og tidspunkt med selger" :
                  dm === "shipping" ? "Kjøper betaler frakt — avtal detaljer med selger" :
                  "Avtal leveringsmåte direkte med selger";
                const icon =
                  dm === "pickup" ? (
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm6 2.5a9 9 0 11-18 0 9 9 0 0118 0z" />
                  ) : dm === "shipping" ? (
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0H21M3.375 14.25V3.375c0-.621.504-1.125 1.125-1.125h9.75c.621 0 1.125.504 1.125 1.125v1.5m0 0h3.375c.621 0 1.125.504 1.125 1.125v1.5M15.375 6v11.25" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 9.75a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375m-13.5 3.01c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.184-4.183a1.14 1.14 0 01.778-.332 48.294 48.294 0 005.83-.498c1.585-.233 2.708-1.626 2.708-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
                  );
                return (
                  <div className="flex items-start gap-3 p-4 rounded-xl bg-cream text-sm">
                    <svg className="h-5 w-5 text-forest flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      {icon}
                    </svg>
                    <div>
                      <p className="font-medium text-ink">{label}</p>
                      <p className="text-ink-mid mt-0.5">{desc}</p>
                    </div>
                  </div>
                );
              })()}

              {/* Carbon savings badge */}
              {listing.listing_type !== "iso" && !listing.is_sold && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-green-50 border border-green-200 text-xs text-green-800 mt-3">
                  <span className="text-base leading-none">🌱</span>
                  <span>
                    Kjøp brukt sparer ca.{" "}
                    <strong>{getCO2SavedKg(listing.category)} kg CO₂</strong>{" "}
                    sammenlignet med nytt
                  </span>
                </div>
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
                  </div>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    {listing.profiles.rating > 0 ? (
                      <>
                        <Stars value={listing.profiles.rating} />
                        <span className="text-xs text-ink-light">{listing.profiles.rating.toFixed(1)}</span>
                      </>
                    ) : (
                      <p className="text-xs text-ink-light">{listing.profiles.total_sold} solgte varer</p>
                    )}
                  </div>
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

              <div className="mt-4 flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs text-ink-light">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  {listing.views} visninger • {formatDaysAgo(listing.created_at)}
                </div>
                <div className="relative" ref={shareRef}>
                  <button
                    onClick={canNativeShare ? handleNativeShare : () => setShareOpen((o) => !o)}
                    aria-label="Del annonse"
                    className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-ink-mid hover:bg-cream transition-colors duration-[120ms]"
                  >
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z" />
                    </svg>
                    Del
                  </button>
                  {shareOpen && (
                    <div className="absolute right-0 bottom-full mb-2 w-52 rounded-xl border border-border bg-white shadow-lg py-1 z-10">
                      {canNativeShare && (
                        <button
                          onClick={handleNativeShare}
                          className="flex w-full items-center gap-2.5 px-3 py-2 text-xs text-ink hover:bg-cream transition-colors font-medium"
                        >
                          <svg className="h-4 w-4 text-forest" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z" />
                          </svg>
                          Del via Spond, Signal, WhatsApp...
                        </button>
                      )}
                      <button
                        onClick={shareWhatsApp}
                        className="flex w-full items-center gap-2.5 px-3 py-2 text-xs text-ink hover:bg-cream transition-colors"
                      >
                        <svg className="h-4 w-4 text-[#25D366]" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                        </svg>
                        Del på WhatsApp
                      </button>
                      <button
                        onClick={copyLink}
                        className="flex w-full items-center gap-2.5 px-3 py-2 text-xs text-ink hover:bg-cream transition-colors"
                      >
                        {linkCopied ? (
                          <svg className="h-4 w-4 text-forest" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                          </svg>
                        ) : (
                          <svg className="h-4 w-4 text-ink-light" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                        )}
                        {linkCopied ? "Kopiert!" : "Kopier lenke"}
                      </button>
                      <button
                        onClick={() => { setShareOpen(false); setQrOpen(true); }}
                        className="flex w-full items-center gap-2.5 px-3 py-2 text-xs text-ink hover:bg-cream transition-colors"
                      >
                        <svg className="h-4 w-4 text-ink-light" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 013.75 9.375v-4.5zM3.75 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 01-1.125-1.125v-4.5zM13.5 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0113.5 9.375v-4.5z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 6.75h.75v.75h-.75v-.75zM6.75 16.5h.75v.75h-.75v-.75zM16.5 6.75h.75v.75h-.75v-.75zM13.5 13.5h.75v.75h-.75v-.75zM13.5 18.75h.75v.75h-.75v-.75zM18.75 13.5h.75v.75h-.75v-.75zM18.75 18.75h.75v.75h-.75v-.75zM16.5 16.5h.75v.75h-.75v-.75z" />
                        </svg>
                        Vis QR-kode
                      </button>
                    </div>
                  )}
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-border flex items-center justify-between">
                {myProfileId ? (
                  <button
                    onClick={handleBlockUser}
                    disabled={blockLoading}
                    className="flex items-center gap-1.5 text-xs text-ink-light hover:text-red-500 transition-colors disabled:opacity-50"
                  >
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                    </svg>
                    {isBlocked ? "Fjern blokkering" : "Blokker bruker"}
                  </button>
                ) : <span />}
                <ReportListingButton listingId={Number(id)} />
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

      {relatedListings.length > 0 && (
        <section className="mt-12 mb-4">
          <h2 className="font-display text-2xl font-semibold text-ink mb-8">
            Andre {listing.category.toLowerCase()} i nærheten
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {relatedListings.map((l) => (
              <ListingCard key={l.id} listing={l} />
            ))}
          </div>
        </section>
      )}

      {/* Demo CTA modal */}
      {demoCTAOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setDemoCTAOpen(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-yellow-100">
                <svg className="h-5 w-5 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h2 className="font-display text-xl font-bold text-ink">Klar til å starte?</h2>
            </div>
            <p className="text-sm text-ink-mid leading-relaxed">
              Dette er en eksempel-annonse som viser hvordan markedsplassen fungerer. Registrer klubben din gratis for å legge ut ekte annonser og nå alle klubbmedlemmene.
            </p>
            <ul className="space-y-2 text-sm text-ink-mid">
              {["Gratis å komme i gang", "Enkel oppsett på under 5 minutter", "Trygg betaling via Stripe"].map((item) => (
                <li key={item} className="flex items-center gap-2">
                  <svg className="h-4 w-4 text-forest flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                  </svg>
                  {item}
                </li>
              ))}
            </ul>
            <div className="flex flex-col gap-2 pt-1">
              <Link
                href="/registrer-klubb"
                className="w-full rounded-lg bg-forest py-3 text-sm font-bold text-white hover:bg-forest-mid transition-colors text-center"
              >
                Registrer klubben din
              </Link>
              <button
                onClick={() => setDemoCTAOpen(false)}
                className="w-full rounded-lg border border-border py-2.5 text-sm font-medium text-ink-mid hover:bg-cream transition-colors"
              >
                Lukk
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Checkout confirmation */}
      {showCheckoutConfirm && (() => {
        const isPro = (listing.clubs as { is_pro?: boolean })?.is_pro || (listing.profiles as { is_pro?: boolean })?.is_pro;
        const feeNok = Math.round(listing.price * (isPro ? 2 : 5)) / 100;
        const totalNok = listing.price + feeNok;
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              onClick={() => !checkingOut && setShowCheckoutConfirm(false)}
            />
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-5">
              <h2 className="font-display text-xl font-bold text-ink">Bekreft kjøp</h2>

              <div className="flex items-center gap-3 p-4 rounded-xl bg-cream">
                {listing.images[0] && listing.images[0] !== "/placeholder-listing.svg" ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={listing.images[0]} alt="" className="h-14 w-14 rounded-lg object-cover flex-shrink-0" />
                ) : (
                  <div className="h-14 w-14 rounded-lg bg-border flex-shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-ink leading-snug">{listing.title}</p>
                  <p className="text-xs text-ink-light mt-0.5">{listing.profiles.name}</p>
                </div>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-ink-mid">
                  <span>Varepris</span>
                  <span>{listing.price.toLocaleString("nb-NO")} kr</span>
                </div>
                <div className="flex justify-between text-ink-mid">
                  <span>Servicegebyr</span>
                  <span>{feeNok.toLocaleString("nb-NO")} kr</span>
                </div>
                <div className="flex justify-between font-bold text-ink border-t border-border pt-2 mt-2">
                  <span>Totalt</span>
                  <span className="text-forest">{totalNok.toLocaleString("nb-NO")} kr</span>
                </div>
              </div>

              <div className="flex items-center gap-2 rounded-lg bg-forest-light px-3 py-2.5 text-xs text-forest">
                <svg className="h-4 w-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                </svg>
                Trygt kjøp — betaling håndteres sikkert via Stripe
              </div>

              <div className="flex flex-col gap-2 pt-1">
                <button
                  onClick={handleBuyNow}
                  disabled={checkingOut}
                  className="w-full rounded-lg bg-ink py-3 text-sm font-bold text-white hover:bg-ink/90 transition-colors disabled:opacity-60"
                >
                  {checkingOut ? "Åpner betaling..." : `Betal ${totalNok.toLocaleString("nb-NO")} kr`}
                </button>
                <button
                  onClick={() => setShowCheckoutConfirm(false)}
                  disabled={checkingOut}
                  className="w-full rounded-lg border border-border py-2.5 text-sm font-medium text-ink-mid hover:bg-cream transition-colors disabled:opacity-40"
                >
                  Avbryt
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Image lightbox */}
      {lightboxOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90" onClick={() => setLightboxOpen(false)}>
          <button
            aria-label="Lukk"
            className="absolute top-4 right-4 rounded-full bg-white/10 p-2 text-white hover:bg-white/20 transition-colors"
            onClick={() => setLightboxOpen(false)}
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          {images.length > 1 && (
            <button
              aria-label="Forrige bilde"
              className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-3 text-white hover:bg-white/20 transition-colors"
              onClick={(e) => { e.stopPropagation(); setActiveImage((activeImage - 1 + images.length) % images.length); }}
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
              </svg>
            </button>
          )}
          <div className="relative w-full max-w-4xl max-h-[90vh] mx-8" onClick={(e) => e.stopPropagation()}>
            <Image
              src={images[activeImage]}
              alt={listing.title}
              width={1200}
              height={900}
              className="object-contain w-full max-h-[90vh] rounded-lg"
            />
          </div>
          {images.length > 1 && (
            <button
              aria-label="Neste bilde"
              className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-3 text-white hover:bg-white/20 transition-colors"
              onClick={(e) => { e.stopPropagation(); setActiveImage((activeImage + 1) % images.length); }}
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
            </button>
          )}
          {images.length > 1 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
              {images.map((_, i) => (
                <button
                  key={i}
                  onClick={(e) => { e.stopPropagation(); setActiveImage(i); }}
                  className={`h-2 w-2 rounded-full transition-colors ${i === activeImage ? "bg-white" : "bg-white/40"}`}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Chat */}
      {listing && (
        <ListingChat
          listing={listing}
          open={chatOpen}
          onClose={() => setChatOpen(false)}
        />
      )}

      {/* QR code modal */}
      {qrOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setQrOpen(false)} />
          <div className="relative bg-white rounded-2xl p-7 max-w-xs w-full text-center space-y-4 shadow-2xl">
            <h3 className="font-display text-lg font-bold text-ink">QR-kode</h3>
            <div className="flex justify-center">
              <QRCodeSVG value={listingUrl} size={200} includeMargin />
            </div>
            <p className="text-xs text-ink-light">Vis ved salgsarrangement — kjøpere skanner for å åpne og betale direkte</p>
            <button
              onClick={() => setQrOpen(false)}
              className="w-full rounded-lg border border-border py-2.5 text-sm font-medium text-ink hover:bg-cream transition-colors"
            >
              Lukk
            </button>
          </div>
        </div>
      )}

      {/* Publish success modal */}
      {publishedModal && listing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setPublishedModal(false)} />
          <div className="relative bg-white rounded-2xl p-7 max-w-sm w-full text-center space-y-5 shadow-2xl">
            <div className="text-5xl">🎉</div>
            <div>
              <h2 className="font-display text-2xl font-bold text-ink">Annonsen er publisert!</h2>
              <p className="text-sm text-ink-mid mt-1">Del i klubbgruppen for å nå flest mulig kjøpere.</p>
            </div>

            <div className="space-y-2.5">
              {canNativeShare && (
                <button
                  onClick={() => { handleNativeShare(); setPublishedModal(false); }}
                  className="w-full rounded-lg bg-forest py-3 text-sm font-bold text-white hover:bg-forest-mid transition-colors flex items-center justify-center gap-2"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z" />
                  </svg>
                  Del via Spond, WhatsApp, Signal...
                </button>
              )}
              <button
                onClick={() => { shareWhatsApp(); }}
                className="w-full rounded-lg border border-[#25D366] py-2.5 text-sm font-semibold text-[#25D366] hover:bg-[#25D366]/5 transition-colors flex items-center justify-center gap-2"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                Del på WhatsApp
              </button>
              <button
                onClick={copyLink}
                className="w-full rounded-lg border border-border py-2.5 text-sm font-medium text-ink-mid hover:bg-cream transition-colors"
              >
                {linkCopied ? "✓ Lenke kopiert!" : "Kopier lenke"}
              </button>
            </div>

            <div className="pt-1 space-y-2">
              <div className="flex justify-center">
                <QRCodeSVG value={listingUrl} size={140} includeMargin />
              </div>
              <p className="text-xs text-ink-light">QR-kode for salgsarrangement</p>
            </div>

            <button
              onClick={() => setPublishedModal(false)}
              className="text-xs text-ink-light hover:text-ink transition-colors"
            >
              Gå til annonsen →
            </button>
          </div>
        </div>
      )}
      {/* Gi bud modal */}
      {offerOpen && listing && !listing.is_sold && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => { if (!offerSubmitting) setOfferOpen(false); }} />
          <div className="relative bg-white rounded-2xl p-7 max-w-sm w-full shadow-2xl space-y-5">
            <div>
              <h3 className="font-display text-xl font-bold text-ink">Gi bud</h3>
              <p className="text-sm text-ink-mid mt-1">Prisantydning: {listing.price.toLocaleString("nb-NO")} kr</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-ink mb-1.5">Ditt bud (NOK)</label>
              <div className="relative">
                <input
                  type="number"
                  value={offerAmount}
                  onChange={(e) => setOfferAmount(e.target.value)}
                  placeholder="0"
                  className="w-full rounded-lg border border-border px-4 py-3 text-2xl font-bold text-forest placeholder:text-ink-light/40 focus:outline-none focus:ring-2 focus:ring-forest/20"
                  autoFocus
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-lg text-ink-light">kr</span>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-ink mb-1.5">Melding (valgfritt)</label>
              <textarea
                value={offerMessage}
                onChange={(e) => setOfferMessage(e.target.value)}
                rows={2}
                placeholder="Begrunn budet ditt, spør om detaljer..."
                className="w-full rounded-lg border border-border px-4 py-2.5 text-sm text-ink placeholder:text-ink-light focus:outline-none focus:ring-2 focus:ring-forest/20 resize-none"
              />
            </div>
            <div className="flex gap-2 pt-1">
              <button
                onClick={() => setOfferOpen(false)}
                className="flex-1 rounded-lg border border-border py-2.5 text-sm font-medium text-ink-mid hover:bg-cream transition-colors"
              >
                Avbryt
              </button>
              <button
                onClick={handleSubmitOffer}
                disabled={offerSubmitting || !offerAmount || parseInt(offerAmount) <= 0}
                className="flex-1 rounded-lg bg-forest py-2.5 text-sm font-semibold text-white hover:bg-forest-mid transition-colors disabled:opacity-50"
              >
                {offerSubmitting ? "Sender..." : "Send bud"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
