import type { Metadata } from "next";
import Link from "next/link";
import {
  getProfileBySlug,
  getReviewsByProfile,
  getAllProfileSlugs,
  formatDaysAgo,
  type ListingWithRelations,
} from "@/lib/queries";
import { supabase } from "@/lib/supabase";
import { ListingCard } from "@/components/ListingCard";
import { ProfileMessageButton } from "@/components/ProfileMessageButton";

export const revalidate = 60;
export const dynamicParams = true;

export async function generateStaticParams() {
  const slugs = await getAllProfileSlugs();
  return slugs.map((slug) => ({ slug }));
}

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const profile = await getProfileBySlug(slug);
  if (!profile) return {};
  return {
    title: `${profile.name} — Selger`,
    description: `Se annonser og vurderinger fra ${profile.name} på Sportsbyttet. ${profile.total_sold} solgte varer.`,
  };
}

export default async function ProfilePage({ params }: Props) {
  const { slug } = await params;
  const seller = await getProfileBySlug(slug);

  if (!seller) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-20 text-center">
        <h1 className="font-display text-3xl font-bold">Bruker ikke funnet</h1>
        <Link href="/" className="mt-4 inline-block text-forest hover:underline">
          Tilbake til forsiden
        </Link>
      </div>
    );
  }

  const { data: listingsRaw } = await supabase
    .from("listings")
    .select("*, clubs(*), profiles(*)")
    .eq("seller_id", seller.id)
    .eq("is_sold", false)
    .order("created_at", { ascending: false });

  const sellerListings = (listingsRaw ?? []) as ListingWithRelations[];

  const reviews = await getReviewsByProfile(seller.id);

  const activeListingCount = sellerListings.length;

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      {/* Profile header */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-border mb-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
          <div className="h-20 w-20 rounded-full bg-forest-light flex items-center justify-center text-forest font-bold text-2xl font-display">
            {seller.avatar}
          </div>

          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h1 className="font-display text-2xl font-bold text-ink">
                {seller.name}
              </h1>
              <span className="inline-flex items-center gap-1 text-xs text-forest bg-forest-light rounded-full px-2.5 py-0.5">
                <svg className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                </svg>
                Verifisert
              </span>
            </div>
            <p className="mt-1 text-sm text-ink-light">{seller.bio}</p>
            <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-ink-light">
              <span>Medlem siden {seller.member_since}</span>
              <span className="h-1 w-1 rounded-full bg-ink-light" />
              <span>{seller.total_sold} solgte varer</span>
            </div>
          </div>

          <ProfileMessageButton sellerName={seller.name} />
        </div>

        {seller.clubs && (
          <div className="mt-6 pt-6 border-t border-border">
            <Link
              href={`/klubb/${seller.clubs.slug}`}
              className="inline-flex items-center gap-3 px-4 py-2 rounded-lg bg-cream hover:bg-cream transition-colors duration-[120ms]"
            >
              <div
                className="h-8 w-8 rounded-full flex items-center justify-center text-white text-[10px] font-bold"
                style={{ backgroundColor: seller.clubs.color }}
              >
                {seller.clubs.initials}
              </div>
              <div>
                <p className="text-sm font-medium text-ink">{seller.clubs.name}</p>
                <p className="text-xs text-ink-light">Verifisert medlem</p>
              </div>
            </Link>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className={`grid gap-4 mb-8 ${seller.rating > 0 ? "grid-cols-3" : "grid-cols-2"}`}>
        <div className="bg-white rounded-xl p-4 text-center border border-border">
          <p className="font-display text-2xl font-bold text-forest">{activeListingCount}</p>
          <p className="text-xs text-ink-light">Aktive annonser</p>
        </div>
        <div className="bg-white rounded-xl p-4 text-center border border-border">
          <p className="font-display text-2xl font-bold text-forest">{seller.total_sold}</p>
          <p className="text-xs text-ink-light">Solgte varer</p>
        </div>
        {seller.rating > 0 && (
          <div className="bg-white rounded-xl p-4 text-center border border-border">
            <div className="flex items-center justify-center gap-1 mb-0.5">
              <svg className="h-5 w-5 text-amber" viewBox="0 0 20 20" fill="currentColor">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              <p className="font-display text-2xl font-bold text-forest">{seller.rating.toFixed(1)}</p>
            </div>
            <p className="text-xs text-ink-light">Vurdering ({reviews.length})</p>
          </div>
        )}
      </div>

      {/* Listings */}
      <div>
        <h2 className="font-display text-xl font-semibold text-ink mb-6">
          Annonser fra {seller.name}
        </h2>

        {sellerListings.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {sellerListings.map((listing) => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-xl p-12 text-center border border-border">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-cream">
              <svg className="h-7 w-7 text-ink-light" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6z" />
              </svg>
            </div>
            <p className="font-display text-base font-semibold text-ink">Ingen aktive annonser</p>
            <p className="mt-1 text-sm text-ink-light">{seller.name} har ingen aktive annonser for øyeblikket.</p>
            <Link href="/utforsk" className="mt-4 inline-block text-sm font-medium text-forest hover:underline">
              Utforsk andre annonser →
            </Link>
          </div>
        )}
      </div>

      {/* Reviews */}
      <div className="mt-12">
        <h2 className="font-display text-xl font-semibold text-ink mb-6">Vurderinger</h2>
        {reviews.length > 0 ? (
          <div className="space-y-4">
            {reviews.map((review) => (
              <div key={review.id} className="bg-white rounded-xl p-5 border border-border">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-full bg-forest-light flex items-center justify-center text-forest text-xs font-bold">
                      {review.author_name[0]}
                    </div>
                    <span className="text-sm font-medium text-ink">{review.author_name}</span>
                  </div>
                  <span className="text-xs text-ink-light">{formatDaysAgo(review.created_at)}</span>
                </div>
                <div className="flex gap-0.5 mb-2">
                  {Array.from({ length: 5 }).map((_, j) => (
                    <svg
                      key={j}
                      className={`h-4 w-4 ${j < review.rating ? "text-amber" : "text-border"}`}
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <p className="text-sm text-ink-light">{review.text}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-xl p-10 text-center border border-border">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-cream">
              <svg className="h-6 w-6 text-ink-light" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
              </svg>
            </div>
            <p className="font-display text-base font-semibold text-ink">Ingen vurderinger ennå</p>
            <p className="mt-1 text-sm text-ink-light">
              Vurderinger vises her etter {seller.name} har gjennomført salg.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
