"use client";

import { Suspense, useState, useEffect, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import type {
  ListingWithRelations,
  Club,
  ProfileWithClub,
  Category,
} from "@/lib/queries";
import { ListingCard } from "@/components/ListingCard";

type Tab = "alle" | "utstyr" | "klubber" | "personer" | "kategorier";

export default function SearchPageWrapper() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-7xl px-4 py-20 text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-forest border-r-transparent" />
        </div>
      }
    >
      <SearchPage />
    </Suspense>
  );
}

function SearchPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialQuery = searchParams.get("q") ?? "";

  const [query, setQuery] = useState(initialQuery);
  const [debouncedQuery, setDebouncedQuery] = useState(initialQuery);
  const [activeTab, setActiveTab] = useState<Tab>("alle");
  const [loading, setLoading] = useState(false);

  const [listings, setListings] = useState<ListingWithRelations[]>([]);
  const [clubs, setClubs] = useState<Club[]>([]);
  const [profiles, setProfiles] = useState<ProfileWithClub[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  // Debounce input
  useEffect(() => {
    const id = setTimeout(() => setDebouncedQuery(query), 300);
    return () => clearTimeout(id);
  }, [query]);

  // Sync URL when debounced query changes
  useEffect(() => {
    const params = new URLSearchParams();
    if (debouncedQuery) params.set("q", debouncedQuery);
    router.replace(`/sok${params.toString() ? `?${params}` : ""}`, {
      scroll: false,
    });
  }, [debouncedQuery, router]);

  const runSearch = useCallback(async (q: string) => {
    if (!q.trim()) {
      setListings([]);
      setClubs([]);
      setProfiles([]);
      setCategories([]);
      return;
    }

    setLoading(true);
    const pattern = `%${q.trim()}%`;

    const [listingsRes, clubsRes, profilesRes, categoriesRes] =
      await Promise.all([
        supabase
          .from("listings")
          .select("*, clubs(*), profiles(*)")
          .eq("is_sold", false)
          .or(
            `title.ilike.${pattern},category.ilike.${pattern},description.ilike.${pattern}`
          )
          .order("created_at", { ascending: false })
          .limit(20),
        supabase
          .from("clubs")
          .select("*")
          .ilike("name", pattern)
          .order("members", { ascending: false })
          .limit(10),
        supabase
          .from("profiles")
          .select("*, clubs(*)")
          .or(`name.ilike.${pattern},bio.ilike.${pattern}`)
          .order("total_sold", { ascending: false })
          .limit(10),
        supabase
          .from("categories")
          .select("*")
          .ilike("name", pattern)
          .limit(6),
      ]);

    setListings((listingsRes.data ?? []) as ListingWithRelations[]);
    setClubs(clubsRes.data ?? []);
    setProfiles((profilesRes.data ?? []) as ProfileWithClub[]);
    setCategories(categoriesRes.data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    runSearch(debouncedQuery);
  }, [debouncedQuery, runSearch]);

  const totalResults =
    listings.length + clubs.length + profiles.length + categories.length;
  const hasQuery = debouncedQuery.trim().length > 0;

  const tabs: { id: Tab; label: string; count: number }[] = [
    { id: "alle", label: "Alle", count: totalResults },
    { id: "utstyr", label: "Utstyr", count: listings.length },
    { id: "klubber", label: "Klubber", count: clubs.length },
    { id: "personer", label: "Personer", count: profiles.length },
    { id: "kategorier", label: "Kategorier", count: categories.length },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      {/* Search input */}
      <div className="max-w-2xl mx-auto mb-8">
        <div className="relative">
          <svg
            className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-ink-light"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
            />
          </svg>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Søk etter utstyr, klubber, personer..."
            aria-label="Søk etter utstyr, klubber og personer"
            autoFocus
            className="w-full rounded-lg border border-border bg-white pl-12 pr-5 py-3.5 text-base placeholder:text-ink-light focus:outline-none focus:ring-2 focus:ring-forest/30 focus:border-forest transition-all"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              aria-label="Tøm søk"
              className="absolute right-4 top-1/2 -translate-y-1/2 text-ink-light hover:text-ink transition-colors duration-[120ms]"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      {hasQuery && (
        <div role="tablist" aria-label="Søkeresultater" className="flex gap-1 border-b border-border mb-8 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              role="tab"
              aria-selected={activeTab === tab.id}
              aria-controls={`panel-${tab.id}`}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors duration-[120ms] whitespace-nowrap ${
                activeTab === tab.id
                  ? "border-forest text-forest"
                  : "border-transparent text-ink-light hover:text-ink hover:border-border"
              }`}
            >
              {tab.label}
              {tab.count > 0 && (
                <span
                  className={`text-xs rounded-full px-1.5 py-0.5 ${
                    activeTab === tab.id
                      ? "bg-forest-light text-forest"
                      : "bg-cream text-ink-light"
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-forest border-r-transparent" />
        </div>
      )}

      {/* Empty state */}
      {!loading && hasQuery && totalResults === 0 && (
        <div className="text-center py-16">
          <div className="text-4xl mb-4">🔍</div>
          <h2 className="font-display text-xl font-semibold text-ink">
            Ingen resultater for &ldquo;{debouncedQuery}&rdquo;
          </h2>
          <p className="mt-2 text-sm text-ink-light max-w-md mx-auto">
            Prøv et annet søkeord, eller utforsk kategoriene våre.
          </p>
          <Link
            href="/utforsk"
            className="mt-6 inline-flex items-center justify-center rounded-lg bg-forest px-6 py-2.5 text-sm font-semibold text-white hover:bg-forest-mid transition-colors duration-[120ms]"
          >
            Utforsk alt utstyr
          </Link>
        </div>
      )}

      {/* Landing state (no query yet) */}
      {!hasQuery && !loading && (
        <div className="text-center py-16">
          <div className="text-5xl mb-4">⛷️</div>
          <h2 className="font-display text-2xl font-bold text-ink">
            Hva leter du etter?
          </h2>
          <p className="mt-2 text-ink-light max-w-md mx-auto">
            Søk etter sportsutstyr, klubber eller selgere. Skriv inn et søkeord for å starte.
          </p>
        </div>
      )}

      {/* Results */}
      {!loading && hasQuery && totalResults > 0 && (
        <div className="space-y-12">
          {/* Categories */}
          {categories.length > 0 &&
            (activeTab === "alle" || activeTab === "kategorier") && (
              <section>
                {activeTab === "alle" && (
                  <div className="flex items-center gap-2.5 mb-4">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-forest-light text-forest text-xs">
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" /></svg>
                    </span>
                    <h2 className="font-display text-lg font-semibold text-ink">
                      Kategorier
                    </h2>
                  </div>
                )}
                <div className="flex flex-wrap gap-3">
                  {categories.map((cat) => (
                    <Link
                      key={cat.id}
                      href={`/utforsk?kategori=${cat.slug}`}
                      className="flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-medium text-ink hover:bg-cream transition-colors duration-[120ms] shadow-sm"
                    >
                      <span className="text-lg">{cat.emoji}</span>
                      {cat.name}
                    </Link>
                  ))}
                </div>
              </section>
            )}

          {/* Clubs */}
          {clubs.length > 0 &&
            (activeTab === "alle" || activeTab === "klubber") && (
              <section>
                {activeTab === "alle" && (
                  <div className="flex items-center gap-2.5 mb-4">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-forest-light text-forest text-xs">
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" /></svg>
                    </span>
                    <h2 className="font-display text-lg font-semibold text-ink">
                      Klubber
                    </h2>
                  </div>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {clubs.map((club) => (
                    <Link
                      key={club.id}
                      href={`/klubb/${club.slug}`}
                      className="flex items-center gap-4 bg-white rounded-xl p-4 border border-border hover:shadow-md transition-all hover:-translate-y-0.5"
                    >
                      <div
                        className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full text-white text-sm font-bold"
                        style={{ backgroundColor: club.color }}
                      >
                        {club.initials}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-ink truncate">
                            {club.name}
                          </p>
                          <span className="flex-shrink-0 text-[10px] font-semibold uppercase tracking-wider rounded-full px-2 py-0.5 bg-forest-light text-forest-mid">
                            Klubb
                          </span>
                        </div>
                        <p className="text-xs text-ink-light">
                          {club.members.toLocaleString("nb-NO")} medlemmer •{" "}
                          {club.active_listings} annonser
                        </p>
                      </div>
                      <span className="text-xs text-forest font-medium">
                        {club.rating} ⭐
                      </span>
                    </Link>
                  ))}
                </div>
              </section>
            )}

          {/* Profiles */}
          {profiles.length > 0 &&
            (activeTab === "alle" || activeTab === "personer") && (
              <section>
                {activeTab === "alle" && (
                  <div className="flex items-center gap-2.5 mb-4">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-forest-light text-forest text-xs">
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" /></svg>
                    </span>
                    <h2 className="font-display text-lg font-semibold text-ink">
                      Personer
                    </h2>
                  </div>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {profiles.map((profile) => (
                    <Link
                      key={profile.id}
                      href={`/profil/${profile.slug}`}
                      className="flex items-center gap-4 bg-white rounded-xl p-4 border border-border hover:shadow-md transition-all hover:-translate-y-0.5"
                    >
                      <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-forest-light text-forest text-sm font-bold">
                        {profile.avatar}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-ink truncate">
                            {profile.name}
                          </p>
                          <span className="flex-shrink-0 text-[10px] font-semibold uppercase tracking-wider rounded-full px-2 py-0.5 bg-forest-light text-forest-mid">
                            Person
                          </span>
                        </div>
                        <p className="text-xs text-ink-light truncate">
                          {profile.clubs?.name ?? "Ingen klubb"} •{" "}
                          {profile.total_sold} solgt
                        </p>
                      </div>
                      <span className="text-xs text-forest font-medium">
                        {profile.rating} ⭐
                      </span>
                    </Link>
                  ))}
                </div>
              </section>
            )}

          {/* Listings */}
          {listings.length > 0 &&
            (activeTab === "alle" || activeTab === "utstyr") && (
              <section>
                {activeTab === "alle" && (
                  <div className="flex items-center gap-2.5 mb-4">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-light text-amber text-xs">
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z" /><path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6z" /></svg>
                    </span>
                    <h2 className="font-display text-lg font-semibold text-ink">
                      Utstyr
                    </h2>
                  </div>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {listings.map((listing) => (
                    <ListingCard
                      key={listing.id}
                      listing={listing}
                      showSeller
                    />
                  ))}
                </div>
              </section>
            )}
        </div>
      )}
    </div>
  );
}
