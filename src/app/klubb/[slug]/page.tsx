import type { Metadata } from "next";
import {
  getAllClubs,
  getClubBySlug,
  getListingsByClub,
  getProfilesByClub,
} from "@/lib/queries";
import { ClubAnnouncements } from "@/components/ClubAnnouncements";
import { ClubPageTabs } from "@/components/ClubPageTabs";
import { JoinClubButton } from "@/components/JoinClubButton";
import Link from "next/link";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://sportsbytte.no";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const club = await getClubBySlug(slug);
  if (!club) return {};
  const description = `Kjøp og selg brukt sportsutstyr fra ${club.name}. ${club.active_listings} aktive annonser fra ${club.members} medlemmer.`;
  const pageUrl = `${SITE_URL}/klubb/${club.slug}`;
  return {
    title: club.name,
    description,
    openGraph: {
      title: `${club.name} | Sportsbytte`,
      description: `Brukt sportsutstyr fra ${club.name}-medlemmer.`,
      url: pageUrl,
      siteName: "Sportsbytte",
      locale: "nb_NO",
      type: "website",
      ...(club.logo_url ? { images: [{ url: club.logo_url, width: 400, height: 400, alt: club.name }] } : {}),
    },
    twitter: {
      card: club.logo_url ? "summary" : "summary_large_image",
      title: `${club.name} | Sportsbytte`,
      description: `Brukt sportsutstyr fra ${club.name}-medlemmer.`,
      ...(club.logo_url ? { images: [club.logo_url] } : {}),
    },
  };
}

export const revalidate = 60;

export async function generateStaticParams() {
  const clubs = await getAllClubs();
  return clubs.map((club) => ({ slug: club.slug }));
}

type Props = {
  params: Promise<{ slug: string }>;
};

export default async function ClubPage({ params }: Props) {
  const { slug } = await params;

  const club = await getClubBySlug(slug);
  if (!club) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-20 text-center">
        <h1 className="font-display text-3xl font-bold">Klubb ikke funnet</h1>
        <Link href="/" className="mt-4 inline-block text-forest hover:underline">
          Tilbake til forsiden
        </Link>
      </div>
    );
  }

  const [allListings, sellers] = await Promise.all([
    getListingsByClub(club.id),
    getProfilesByClub(club.id),
  ]);

  const listings = allListings.filter((l) => l.listing_type !== "iso");
  const isoListings = allListings.filter((l) => l.listing_type === "iso");

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SportsOrganization",
    name: club.name,
    url: `${SITE_URL}/klubb/${club.slug}`,
    ...(club.logo_url ? { logo: club.logo_url, image: club.logo_url } : {}),
    ...(club.description ? { description: club.description } : {}),
    numberOfEmployees: { "@type": "QuantitativeValue", value: club.members },
    address: { "@type": "PostalAddress", addressCountry: "NO" },
  };

  const accentColor = club.secondary_color || club.color;

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* ── Hero ─────────────────────────────────────────────────── */}
      <section className="relative" style={{ backgroundColor: club.color }}>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-14 sm:py-20">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-7">

            {/* Logo */}
            {club.logo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={club.logo_url}
                alt={club.name}
                className="h-24 w-24 rounded-2xl object-cover shadow-xl shadow-black/25 ring-2 ring-white/20 flex-shrink-0"
              />
            ) : (
              <div
                className="flex h-24 w-24 flex-shrink-0 items-center justify-center rounded-2xl text-white text-3xl font-bold font-display shadow-xl shadow-black/25 ring-2 ring-white/20"
                style={{ backgroundColor: accentColor }}
              >
                {club.initials}
              </div>
            )}

            {/* Name + description */}
            <div className="flex-1 min-w-0">
              <h1 className="font-display text-4xl sm:text-5xl font-bold text-white leading-tight">
                {club.name}
              </h1>
              <p className="mt-2 text-white/60 text-sm">
                {club.members.toLocaleString("nb-NO")} klubbmedlemmer
              </p>
              {club.description && (
                <p className="mt-3 text-white/80 text-sm sm:text-base max-w-xl leading-relaxed">
                  {club.description}
                </p>
              )}

              {/* Action buttons */}
              <div className="mt-6 flex flex-wrap items-center gap-3">
                <JoinClubButton
                  clubId={club.id}
                  clubName={club.name}
                  isMembershipGated={club.is_membership_gated}
                  memberEmailDomain={club.member_email_domain}
                  accentColor={accentColor}
                />
                <Link
                  href="/selg"
                  className="inline-flex items-center gap-2 rounded-lg bg-white/15 border border-white/25 px-5 py-2.5 text-sm font-semibold text-white hover:bg-white/25 transition-colors duration-[120ms]"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                  </svg>
                  Legg ut utstyr
                </Link>
              </div>

              {/* Admin link — subtle */}
              <Link
                href={`/klubb/${slug}/admin`}
                className="mt-4 inline-block text-xs text-white/40 hover:text-white/70 transition-colors duration-[120ms]"
              >
                Lagleder? Administrer siden →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Membership gating notice ──────────────────────────────── */}
      {club.is_membership_gated && (
        <div className="bg-amber-light border-b border-amber/30">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-3 flex items-center gap-3">
            <svg className="h-4 w-4 text-amber flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 1a4.5 4.5 0 00-4.5 4.5V9H5a2 2 0 00-2 2v6a2 2 0 002 2h10a2 2 0 002-2v-6a2 2 0 00-2-2h-.5V5.5A4.5 4.5 0 0010 1zm3 8V5.5a3 3 0 10-6 0V9h6z" clipRule="evenodd" />
            </svg>
            <p className="text-xs font-medium text-ink-mid">
              Noen annonser i denne klubben er kun synlig for godkjente medlemmer.
            </p>
          </div>
        </div>
      )}

      {/* ── Stats bar ────────────────────────────────────────────── */}
      <section
        className="border-b border-border"
        style={{ backgroundColor: club.color + "10" }}
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-5">
          <div className="flex items-center justify-center gap-8 sm:gap-16 text-center">
            <div>
              <p className="text-2xl font-bold font-display" style={{ color: club.color }}>
                {club.active_listings}
              </p>
              <p className="text-xs text-ink-light mt-0.5">aktive annonser</p>
            </div>
            <div className="w-px h-6 bg-border" />
            <div>
              <p className="text-2xl font-bold font-display" style={{ color: club.color }}>
                {club.total_sold}
              </p>
              <p className="text-xs text-ink-light mt-0.5">solgte varer</p>
            </div>
            <div className="w-px h-6 bg-border" />
            <div>
              <p className="text-2xl font-bold font-display" style={{ color: club.color }}>
                {club.members.toLocaleString("nb-NO")}
              </p>
              <p className="text-xs text-ink-light mt-0.5">medlemmer</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Tabs: Annonser / Ettersøk / Selgere ──────────────────── */}
      <ClubPageTabs
        club={{
          id: club.id,
          name: club.name,
          slug: club.slug,
          color: club.color,
          secondary_color: club.secondary_color,
          logo_url: club.logo_url,
          initials: club.initials,
        }}
        listings={listings}
        isoListings={isoListings}
        sellers={sellers}
      />

      {/* ── Announcements ─────────────────────────────────────────── */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pb-12">
        <ClubAnnouncements clubId={club.id} isAdmin={false} />
      </div>
    </>
  );
}
