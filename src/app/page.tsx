import Image from "next/image";
import Link from "next/link";
import { getFeaturedListings, getAllCategories, getAllClubs, thumbnailUrl } from "@/lib/queries";
import { supabase } from "@/lib/supabase";
import { ClubSearch } from "@/components/ClubSearch";
import { StatsBar } from "@/components/StatsBar";
import { HomepageListings } from "@/components/HomepageListings";

export const revalidate = 60;

async function getPlatformStats() {
  const [listingsRes, clubsRes, soldRes] = await Promise.all([
    supabase.from("listings").select("id", { count: "exact", head: true }).eq("is_sold", false),
    supabase.from("clubs").select("id", { count: "exact", head: true }),
    supabase.from("clubs").select("total_sold"),
  ]);
  const totalSold = (soldRes.data ?? []).reduce((sum, c) => sum + c.total_sold, 0);
  return {
    listings: listingsRes.count ?? 0,
    clubs: clubsRes.count ?? 0,
    sold: totalSold,
  };
}

export default async function HomePage() {
  const [featured, categories, clubs, stats] = await Promise.all([
    getFeaturedListings(6),
    getAllCategories(),
    getAllClubs(),
    getPlatformStats(),
  ]);

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://sportsbytte.no";
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${siteUrl}/#organization`,
        name: "Sportsbytte",
        url: siteUrl,
        logo: `${siteUrl}/Sportbytte_logo-removebg-preview.png`,
        email: "hei@sportsbytte.no",
        description: "Norges markedsplass for brukt sportsutstyr mellom klubbmedlemmer.",
      },
      {
        "@type": "WebSite",
        "@id": `${siteUrl}/#website`,
        url: siteUrl,
        name: "Sportsbytte",
        publisher: { "@id": `${siteUrl}/#organization` },
        potentialAction: {
          "@type": "SearchAction",
          target: { "@type": "EntryPoint", urlTemplate: `${siteUrl}/utforsk?q={search_term_string}` },
          "query-input": "required name=search_term_string",
        },
      },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      {/* Hero */}
      <section className="bg-white overflow-hidden">
        <div className="mx-auto max-w-7xl px-6 sm:px-6 lg:px-12 py-16 sm:py-20 lg:py-24">
          <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">

            {/* Left: copy */}
            <div>
              <h1 className="font-display text-4xl sm:text-[46px] lg:text-[52px] font-bold text-ink leading-[1.08] tracking-tight">
                Bytt, kjøp og selg brukt sportsutstyr{" "}
                <span className="text-amber">– enkelt og trygt</span>
              </h1>
              <p className="mt-5 text-lg text-ink-mid leading-relaxed max-w-lg">
                Gi utstyret ditt et nytt liv og finn noe nytt å elske.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href="/utforsk"
                  className="inline-flex items-center justify-center rounded-xl bg-amber px-7 py-3.5 text-sm font-semibold text-white hover:bg-forest-mid transition-colors duration-[120ms]"
                >
                  Utforsk utstyr
                </Link>
                <Link
                  href="/selg"
                  className="inline-flex items-center justify-center rounded-xl border border-border px-7 py-3.5 text-sm font-semibold text-ink hover:bg-cream transition-colors duration-[120ms]"
                >
                  Selg utstyr
                </Link>
              </div>
              <div className="mt-8 flex flex-wrap gap-x-6 gap-y-3">
                {["Enkelt å bruke", "Trygge handler", "Bra for miljøet"].map((label) => (
                  <span key={label} className="flex items-center gap-2 text-sm text-ink-mid">
                    <svg className="h-4 w-4 text-amber flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                    </svg>
                    {label}
                  </span>
                ))}
              </div>
            </div>

            {/* Right: image collage from live listings */}
            <div className="relative h-[320px] sm:h-[380px] lg:h-[440px]">
              {[
                "top-0 left-[4%] w-[46%] h-[52%] -rotate-2 z-10",
                "top-[4%] right-0 w-[48%] h-[54%] rotate-1 z-20",
                "bottom-0 left-0 w-[44%] h-[50%] rotate-1 z-10",
                "bottom-[4%] right-[4%] w-[50%] h-[52%] -rotate-1 z-20",
              ].map((pos, i) => {
                const listing = featured[i];
                return (
                  <div key={i} className={`absolute rounded-2xl overflow-hidden shadow-md border border-border bg-cream ${pos}`}>
                    {listing && (
                      <Image
                        src={thumbnailUrl(listing)}
                        alt={listing.title}
                        fill
                        className="object-cover"
                        sizes="25vw"
                      />
                    )}
                  </div>
                );
              })}
            </div>

          </div>
        </div>
      </section>

      {/* Stats bar */}
      <StatsBar listings={stats.listings} clubs={stats.clubs} sold={stats.sold} />

      {/* Listings with filters */}
      <section className="mx-auto max-w-7xl px-6 sm:px-6 lg:px-12 py-12 sm:py-16">
        <div className="flex items-end justify-between mb-8">
          <h2 className="font-display text-2xl sm:text-3xl font-semibold text-ink">
            Annonser
          </h2>
          <Link
            href="/utforsk"
            className="text-sm font-medium text-forest hover:text-forest-mid transition-colors duration-[120ms]"
          >
            Se alle →
          </Link>
        </div>
        <HomepageListings initialCategories={categories} />
      </section>

      {/* Categories */}
      <section className="bg-white border-y border-border">
        <div className="mx-auto max-w-7xl px-6 sm:px-6 lg:px-12 py-12 sm:py-16">
          <h2 className="font-display text-2xl sm:text-3xl font-semibold text-ink mb-8">
            Utforsk etter kategori
          </h2>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {categories.map((cat) => (
              <Link
                key={cat.slug}
                href={`/utforsk?kategori=${cat.slug}`}
                className="group flex flex-col items-center gap-3 rounded-xl bg-cream border border-border p-6 hover:bg-forest hover:border-forest hover:text-white transition-all duration-[120ms]"
              >
                <span className="text-3xl">{cat.emoji}</span>
                <span className="text-sm font-medium text-center group-hover:text-white">
                  {cat.name}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Club search */}
      <section className="bg-white border-y border-border">
        <div className="mx-auto max-w-7xl px-6 sm:px-6 lg:px-12 py-12 sm:py-16">
          <div className="flex items-end justify-between mb-8">
            <div>
              <h2 className="font-display text-2xl sm:text-3xl font-semibold text-ink">
                Finn din klubb
              </h2>
              <p className="mt-1 text-sm text-ink-mid">
                {clubs.length} klubber på Sportsbytte
              </p>
            </div>
          </div>
          <ClubSearch clubs={clubs} />
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-7xl px-6 sm:px-6 lg:px-12 py-12 sm:py-16">
        <h2 className="font-display text-2xl sm:text-3xl font-semibold text-ink text-center mb-12">
          Slik fungerer det
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">
          {[
            {
              step: "01",
              title: "Finn en klubb",
              desc: "Søk opp din idrettsklubb og bli med. Se utstyr fra klubbmedlemmer.",
              icon: (
                <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                </svg>
              ),
            },
            {
              step: "02",
              title: "Legg ut utstyr",
              desc: "Ta bilder, sett pris, velg kategori. Publiser annonsen på sekunder.",
              icon: (
                <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" />
                </svg>
              ),
            },
            {
              step: "03",
              title: "Trygg handel",
              desc: "Kortbetaling via Stripe. Selger og kjøper avtaler levering direkte. Enkelt og trygt.",
              icon: (
                <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                </svg>
              ),
            },
          ].map((item) => (
            <div key={item.step} className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-forest-light text-forest">
                {item.icon}
              </div>
              <span className="text-[11px] font-semibold text-amber uppercase tracking-[0.1em]">
                Steg {item.step}
              </span>
              <h3 className="mt-2 font-display text-xl font-semibold text-ink">
                {item.title}
              </h3>
              <p className="mt-2 text-sm text-ink-mid leading-relaxed">
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section className="bg-white py-12 sm:py-16">
        <div className="mx-auto max-w-7xl px-6 sm:px-6 lg:px-12">
          <h2 className="font-display text-2xl sm:text-3xl font-semibold text-ink text-center mb-10">
            Hva sier laglederne?
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Card 1 */}
            <div className="rounded-xl bg-cream border border-border p-6 flex flex-col gap-4">
              <div className="text-4xl font-display font-bold leading-none text-forest select-none">
                &ldquo;
              </div>
              <p className="text-ink-mid leading-relaxed text-sm -mt-4">
                Vi brukte å ha byttemarked på parkeringsplassen én gang i året.
                Nå er det digitalt og tilgjengelig hele sesongen.
              </p>
              <div className="flex items-center gap-3 mt-2">
                <div className="h-9 w-9 rounded-full bg-forest-light flex items-center justify-center text-forest text-xs font-semibold flex-shrink-0">
                  TA
                </div>
                <div>
                  <p className="text-sm font-medium text-ink">Tone Andersen</p>
                  <p className="text-xs text-ink-light">Leder, Fredrikstad Skiklubb</p>
                </div>
              </div>
            </div>

            {/* Card 2 */}
            <div className="rounded-xl bg-cream border border-border p-6 flex flex-col gap-4">
              <div className="text-4xl font-display font-bold leading-none text-forest select-none">
                &ldquo;
              </div>
              <p className="text-ink-mid leading-relaxed text-sm -mt-4">
                Enkelt for foreldrene å selge unna utstyr barna har vokst ut av.
                Alle penger går rett til familien – ikke videreselgere.
              </p>
              <div className="flex items-center gap-3 mt-2">
                <div className="h-9 w-9 rounded-full bg-forest-light flex items-center justify-center text-forest text-xs font-semibold flex-shrink-0">
                  KH
                </div>
                <div>
                  <p className="text-sm font-medium text-ink">Kjetil Haugen</p>
                  <p className="text-xs text-ink-light">Sportssjef, Drammen FK Bredde</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Club feature section */}
      <section className="bg-forest">
        <div className="mx-auto max-w-7xl px-6 sm:px-6 lg:px-12 py-12 sm:py-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <span className="text-[11px] font-semibold text-amber uppercase tracking-[0.1em]">
                For idrettslag
              </span>
              <h2 className="mt-3 font-display text-3xl sm:text-4xl font-bold text-white leading-tight">
                Din klubb fortjener sin egen markedsplass
              </h2>
              <p className="mt-4 text-white/70 leading-relaxed">
                Hver klubb får sin egen side på Sportsbytte — med logo,
                farger og filtrerte annonser fra medlemmene. Gjør det enkelt
                for lagkamerater å handle og selge brukt utstyr.
              </p>
              <ul className="mt-6 space-y-3">
                {[
                  "Egen klubbside med merkevaren din",
                  "Oversikt over alle annonser fra medlemmer",
                  "Digitale byttemarked og kampanjer",
                  "Statistikk og innsikt for lagleder",
                ].map((item) => (
                  <li key={item} className="flex items-center gap-3 text-white/80 text-sm">
                    <svg className="h-5 w-5 text-amber flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                    </svg>
                    {item}
                  </li>
                ))}
              </ul>
              <Link
                href="/registrer-klubb"
                className="mt-8 inline-flex items-center justify-center rounded-lg bg-amber px-7 py-3 text-sm font-medium text-white hover:brightness-92 transition-all duration-[120ms]"
              >
                Registrer din klubb gratis
              </Link>
            </div>

            <div className="relative">
              <div className="rounded-xl bg-white/10 backdrop-blur-sm p-6 border border-white/10">
                <div className="bg-white rounded-xl overflow-hidden shadow-xl">
                  <div className="bg-forest p-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center text-white text-xs font-bold">
                        BSK
                      </div>
                      <div>
                        <div className="text-white font-medium text-sm">Bergen Skiklubb</div>
                        <div className="text-white/60 text-xs">847 medlemmer</div>
                      </div>
                    </div>
                  </div>
                  <div className="p-4">
                    <div className="flex gap-2 mb-3">
                      {["Alle", "Alpint", "Topptur"].map((c) => (
                        <span
                          key={c}
                          className={`px-3 py-1 rounded-[20px] text-[13px] font-medium ${c === "Alle" ? "bg-forest text-white" : "bg-forest-light text-forest"}`}
                        >
                          {c}
                        </span>
                      ))}
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="rounded-lg bg-cream aspect-[4/3]" />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
