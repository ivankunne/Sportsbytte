"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ClubListings } from "./ClubListings";
import type { ListingWithRelations, Profile } from "@/lib/queries";

type ClubInfo = {
  id: number;
  name: string;
  slug: string;
  color: string;
  secondary_color: string | null;
  logo_url?: string | null;
  initials?: string;
};

type Props = {
  club: ClubInfo;
  listings: ListingWithRelations[];
  isoListings: ListingWithRelations[];
  sellers: Profile[];
};

type TabId = "annonser" | "ettersok" | "selgere";

function formatCategory(slug: string) {
  return slug.charAt(0).toUpperCase() + slug.slice(1).replace(/-/g, " ");
}

function ClubAvatar({ club, size = "lg" }: { club: ClubInfo; size?: "sm" | "lg" }) {
  const dim = size === "lg" ? "h-16 w-16 text-2xl" : "h-10 w-10 text-sm";
  if (club.logo_url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={club.logo_url}
        alt={club.name}
        className={`${dim} rounded-xl object-cover`}
      />
    );
  }
  return (
    <div
      className={`${dim} rounded-xl flex items-center justify-center font-bold font-display text-white`}
      style={{ backgroundColor: club.color }}
    >
      {club.initials ?? club.name.slice(0, 2).toUpperCase()}
    </div>
  );
}

export function ClubPageTabs({ club, listings, isoListings, sellers }: Props) {
  const [activeTab, setActiveTab] = useState<TabId>("annonser");

  const tabs: Array<{ id: TabId; label: string; count: number }> = [
    { id: "annonser", label: "Annonser", count: listings.length },
    ...(isoListings.length > 0
      ? [{ id: "ettersok" as TabId, label: "Ettersøk", count: isoListings.length }]
      : []),
    { id: "selgere", label: "Selgere", count: sellers.length },
  ];

  // Category breakdown — top 4 by count
  const categoryCounts = listings.reduce<Record<string, number>>((acc, l) => {
    acc[l.category] = (acc[l.category] || 0) + 1;
    return acc;
  }, {});
  const topCategories = Object.entries(categoryCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4);
  const maxCount = topCategories[0]?.[1] ?? 1;
  const showCategoryWidget = topCategories.length > 1;

  return (
    <div>
      {/* Tab bar */}
      <div className="bg-white border-b border-border">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`relative px-5 py-4 text-sm font-semibold transition-colors duration-[120ms] flex items-center gap-2 ${
                  activeTab === tab.id
                    ? "text-ink"
                    : "text-ink-light hover:text-ink-mid"
                }`}
              >
                {tab.label}
                {tab.count > 0 && (
                  <span
                    className="text-xs font-medium rounded-full px-2 py-0.5 transition-all duration-[120ms]"
                    style={
                      activeTab === tab.id
                        ? { backgroundColor: club.color + "20", color: club.color }
                        : {}
                    }
                  >
                    {tab.count}
                  </span>
                )}
                {activeTab === tab.id && (
                  <span
                    className="absolute bottom-0 left-0 right-0 h-[3px] rounded-t-full"
                    style={{ backgroundColor: club.color }}
                  />
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tab content */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 sm:py-10">

        {/* ── Annonser ──────────────────────────────────────────────── */}
        {activeTab === "annonser" && (
          listings.length === 0 ? (
            <div className="py-20 flex flex-col items-center gap-4">
              <ClubAvatar club={club} />
              <p className="text-sm font-semibold text-ink">Ingen annonser ennå</p>
              <p className="text-xs text-ink-light">
                Bli den første til å legge ut utstyr fra {club.name}.
              </p>
              <Link
                href="/selg"
                className="mt-2 inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-semibold text-white transition-colors"
                style={{ backgroundColor: club.color }}
              >
                Legg ut utstyr
              </Link>
            </div>
          ) : (
            <div>
              {showCategoryWidget && (
                <div className="mb-8 bg-white rounded-xl border border-border p-5">
                  <p
                    className="text-xs font-semibold uppercase tracking-wider mb-4"
                    style={{ color: club.color }}
                  >
                    Til salgs i {club.name}
                  </p>
                  <div className="space-y-2.5">
                    {topCategories.map(([cat, count]) => (
                      <div key={cat} className="flex items-center gap-3">
                        <span className="w-28 text-xs font-medium text-ink-mid truncate shrink-0">
                          {formatCategory(cat)}
                        </span>
                        <div className="flex-1 h-2 rounded-full bg-border overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{
                              width: `${(count / maxCount) * 100}%`,
                              backgroundColor: club.color,
                            }}
                          />
                        </div>
                        <span className="w-6 text-right text-xs text-ink-light shrink-0">
                          {count}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <ClubListings
                clubId={club.id}
                clubName={club.name}
                initialListings={listings}
              />
            </div>
          )
        )}

        {/* ── Ettersøk ──────────────────────────────────────────────── */}
        {activeTab === "ettersok" && (
          <div>
            <p className="text-sm text-ink-light mb-6">
              <span className="font-bold" style={{ color: club.color }}>
                {isoListings.length}
              </span>{" "}
              {isoListings.length === 1 ? "medlem søker" : "medlemmer søker"} etter utstyr
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {isoListings.map((iso) => (
                <Link
                  key={iso.id}
                  href={`/annonse/${iso.id}`}
                  className="flex items-start gap-4 bg-white rounded-xl p-4 border border-border hover:shadow-md transition-all hover:-translate-y-0.5"
                >
                  <div
                    className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full font-bold text-sm text-white"
                    style={{ backgroundColor: club.color }}
                  >
                    {(iso.profiles as { avatar?: string } | null)?.avatar ?? "?"}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-ink truncate">{iso.title}</p>
                    <p className="text-xs text-ink-light mt-0.5 truncate">
                      {(iso.profiles as { name?: string } | null)?.name}
                    </p>
                    <p className="text-xs font-medium mt-1" style={{ color: club.color }}>
                      {formatCategory(iso.category)}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* ── Selgere ───────────────────────────────────────────────── */}
        {activeTab === "selgere" && (
          sellers.length === 0 ? (
            <div className="py-20 flex flex-col items-center gap-4">
              <ClubAvatar club={club} />
              <p className="text-sm font-semibold text-ink">Ingen aktive selgere ennå</p>
              <p className="text-xs text-ink-light">
                Medlemmer som legger ut utstyr vises her.
              </p>
            </div>
          ) : (
            <div>
              <p
                className="text-xs font-semibold uppercase tracking-wider mb-6"
                style={{ color: club.color }}
              >
                {sellers.length} aktive {sellers.length === 1 ? "selger" : "selgere"}
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {sellers.map((seller) => (
                  <Link
                    key={seller.id}
                    href={`/profil/${seller.slug}`}
                    className="flex flex-col items-center gap-3 p-5 bg-white rounded-2xl border border-border hover:shadow-md hover:-translate-y-0.5 transition-all"
                  >
                    {seller.avatar_url ? (
                      <Image
                        src={seller.avatar_url}
                        alt={seller.name}
                        width={56}
                        height={56}
                        className="h-14 w-14 rounded-full object-cover"
                      />
                    ) : (
                      <div
                        className="h-14 w-14 rounded-full flex items-center justify-center text-white font-bold font-display text-xl"
                        style={{ backgroundColor: club.color }}
                      >
                        {seller.avatar}
                      </div>
                    )}
                    <div className="text-center">
                      <p className="text-sm font-semibold text-ink">{seller.name}</p>
                      {seller.rating > 0 ? (
                        <span className="flex items-center justify-center gap-0.5 text-xs text-ink-light mt-1">
                          <svg className="h-3 w-3 text-amber" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                          {seller.rating.toFixed(1)}
                        </span>
                      ) : (
                        <p className="text-xs text-ink-light mt-1">{seller.total_sold} solgt</p>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )
        )}
      </div>
    </div>
  );
}
