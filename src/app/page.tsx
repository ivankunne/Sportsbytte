import Link from "next/link";
import { getFeaturedListings, getAllCategories, getAllClubs } from "@/lib/queries";
import { supabase } from "@/lib/supabase";
import { ListingCard } from "@/components/ListingCard";
import { ClubSearch } from "@/components/ClubSearch";

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

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-forest">
        <div className="absolute inset-0 overflow-hidden">
          <svg
            className="absolute -bottom-1 left-0 w-full text-white/5"
            viewBox="0 0 1440 400"
            preserveAspectRatio="none"
            fill="currentColor"
          >
            <path d="M0,400 L0,250 Q200,100 400,200 Q600,320 800,180 Q1000,50 1200,150 Q1350,220 1440,180 L1440,400 Z" />
          </svg>
          <svg
            className="absolute -bottom-1 left-0 w-full text-white/[0.03]"
            viewBox="0 0 1440 400"
            preserveAspectRatio="none"
            fill="currentColor"
          >
            <path d="M0,400 L0,300 Q300,150 600,280 Q900,380 1100,220 Q1300,100 1440,200 L1440,400 Z" />
          </svg>
        </div>

        <div className="relative mx-auto max-w-7xl px-6 sm:px-6 lg:px-12 py-20 sm:py-28 lg:py-36">
          <div className="max-w-2xl">
            <h1 className="font-display text-4xl sm:text-5xl lg:text-[56px] font-bold text-white leading-[1.1] tracking-tight">
              Brukt utstyr.{" "}
              <span className="text-white/70">Ekte kvalitet.</span>{" "}
              <span className="text-amber">Din klubb.</span>
            </h1>
            <p className="mt-6 text-lg sm:text-xl text-white/70 leading-relaxed max-w-xl">
              Kjøp og selg brukt sportsutstyr direkte mellom klubbmedlemmer.
              Trygg betaling, enkel frakt med Bring.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-4">
              <Link
                href="/utforsk"
                className="inline-flex items-center justify-center rounded-lg bg-amber px-7 py-3 text-sm font-medium text-white hover:brightness-92 transition-all duration-[120ms]"
              >
                Utforsk utstyr
              </Link>
              <Link
                href="/registrer-klubb"
                className="inline-flex items-center justify-center rounded-lg border-[1.5px] border-white/40 px-7 py-3 text-sm font-medium text-white hover:bg-white/10 transition-all duration-[120ms]"
              >
                Registrer din klubb
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats bar */}
      <section className="bg-forest-mid text-white">
        <div className="mx-auto max-w-7xl px-6 sm:px-6 lg:px-12 py-5">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-12 text-center">
            <div>
              <span className="text-2xl font-bold font-display">{stats.listings.toLocaleString("nb-NO")}</span>
              <span className="ml-2 text-sm text-white/60">annonser</span>
            </div>
            <div className="hidden sm:block w-px h-6 bg-white/20" />
            <div>
              <span className="text-2xl font-bold font-display">{stats.clubs.toLocaleString("nb-NO")}</span>
              <span className="ml-2 text-sm text-white/60">klubber</span>
            </div>
            <div className="hidden sm:block w-px h-6 bg-white/20" />
            <div>
              <span className="text-2xl font-bold font-display">{stats.sold.toLocaleString("nb-NO")}</span>
              <span className="ml-2 text-sm text-white/60">solgte varer</span>
            </div>
          </div>
        </div>
      </section>

      {/* Featured listings */}
      <section className="mx-auto max-w-7xl px-6 sm:px-6 lg:px-12 py-12 sm:py-16">
        <div className="flex items-end justify-between mb-8">
          <h2 className="font-display text-2xl sm:text-3xl font-semibold text-ink">
            Nylig lagt ut
          </h2>
          <Link
            href="/utforsk"
            className="text-sm font-medium text-forest hover:text-forest-mid transition-colors duration-[120ms]"
          >
            Se alle →
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {featured.map((listing) => (
            <ListingCard key={listing.id} listing={listing} />
          ))}
        </div>
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
                {clubs.length} klubber på Sportsbyttet
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
              desc: "Vipps-betaling, Bring-frakt og kjøperbeskyttelse. Enkelt og trygt.",
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
                Hver klubb får sin egen side på Sportsbyttet — med logo,
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
