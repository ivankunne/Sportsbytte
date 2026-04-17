import Link from "next/link";
import type { Metadata } from "next";
import { getAllClubs } from "@/lib/queries";

export const metadata: Metadata = {
  title: "Klubber",
  description: "Se alle idrettsklubber på Sportsbyttet. Finn din klubb og utforsk brukt sportsutstyr fra medlemmer.",
};

export const revalidate = 60;

export default async function ClubsPage() {
  const clubs = await getAllClubs();

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 sm:py-16">
      <div className="max-w-2xl mb-12">
        <h1 className="font-display text-3xl sm:text-4xl font-bold text-ink">
          Klubber på Sportsbyttet
        </h1>
        <p className="mt-3 text-ink-mid leading-relaxed">
          Finn din klubb og utforsk brukt utstyr fra klubbmedlemmer. Hver klubb
          har sin egen side med annonser, selgere og byttemarked.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {clubs.map((club) => (
          <Link
            key={club.id}
            href={`/klubb/${club.slug}`}
            className="group block bg-white rounded-xl overflow-hidden border border-border hover:shadow-md transition-all duration-300 hover:-translate-y-1"
          >
            <div className="p-6" style={{ backgroundColor: club.color }}>
              <div className="flex items-center gap-4">
                {club.logo_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={club.logo_url}
                    alt={club.name}
                    className="h-14 w-14 rounded-full object-cover border border-white/30 flex-shrink-0"
                  />
                ) : (
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/20 text-white text-lg font-bold font-display border border-white/30 flex-shrink-0">
                    {club.initials}
                  </div>
                )}
                <div>
                  <h2 className="font-display text-xl font-semibold text-white">
                    {club.name}
                  </h2>
                  <p className="text-white/70 text-sm">
                    {club.members.toLocaleString("nb-NO")} medlemmer
                  </p>
                </div>
              </div>
            </div>

            <div className="p-5">
              <div className="flex items-center justify-between text-sm mb-4">
                <div className="text-ink-light">
                  <span className="font-semibold text-forest">{club.active_listings}</span> aktive annonser
                </div>
                <div className="text-ink-light">
                  <span className="font-semibold text-forest">{club.total_sold}</span> solgt
                </div>
                <div className="text-ink-light">{club.rating} ⭐</div>
              </div>

              <span className="text-sm font-medium text-forest group-hover:text-forest-mid transition-colors duration-[120ms]">
                Se klubbsiden →
              </span>
            </div>
          </Link>
        ))}
      </div>

      <div className="mt-16 text-center bg-forest-light rounded-2xl p-10">
        <h2 className="font-display text-2xl font-semibold text-ink">
          Finner du ikke din klubb?
        </h2>
        <p className="mt-2 text-ink-mid max-w-md mx-auto">
          Vi legger til nye klubber hver uke. Registrer din klubb gratis og
          kom i gang på minutter.
        </p>
        <Link
          href="/registrer-klubb"
          className="mt-6 inline-flex items-center justify-center rounded-lg bg-amber px-7 py-3 text-sm font-semibold text-white hover:brightness-92 transition-colors duration-[120ms]"
        >
          Registrer din klubb
        </Link>
      </div>
    </div>
  );
}
