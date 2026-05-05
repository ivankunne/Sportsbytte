"use client";

import { Suspense, useState, useEffect, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import type { ListingWithRelations, Category } from "@/lib/queries";
import { ListingCard } from "@/components/ListingCard";
import { ListingCardSkeleton } from "@/components/Skeleton";
import { SavedSearchAlert } from "@/components/SavedSearchAlert";

const CONDITIONS = [
  { value: "", label: "Alle" },
  { value: "Som ny", label: "Som ny" },
  { value: "Pent brukt", label: "Pent brukt" },
  { value: "Godt brukt", label: "Godt brukt" },
  { value: "Brukt", label: "Brukt" },
];

export default function ExplorePageWrapper() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          <div className="h-10 w-48 rounded-lg bg-cream animate-pulse mb-2" />
          <div className="h-4 w-32 rounded bg-cream animate-pulse mb-8" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => <ListingCardSkeleton key={i} />)}
          </div>
        </div>
      }
    >
      <ExplorePage />
    </Suspense>
  );
}

function ExplorePage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [categories, setCategories] = useState<Category[]>([]);
  const [listings, setListings] = useState<ListingWithRelations[]>([]);
  const [loading, setLoading] = useState(true);

  const PAGE_SIZE = 24;
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  // Instant filters (fire fetch immediately)
  const [activeCategory, setActiveCategory] = useState(searchParams.get("kategori") ?? "");
  const [sort, setSort] = useState(searchParams.get("sorter") ?? "nyeste");
  const [condition, setCondition] = useState(searchParams.get("tilstand") ?? "");
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [geoLoading, setGeoLoading] = useState(false);
  const [geoError, setGeoError] = useState("");
  const [geoErrorPersist, setGeoErrorPersist] = useState("");

  // Debounced filters (text / price / size — wait 350ms after last change)
  const [query, setQuery] = useState(searchParams.get("q") ?? "");
  const [minPrice, setMinPrice] = useState(searchParams.get("fra") ?? "");
  const [maxPrice, setMaxPrice] = useState(searchParams.get("til") ?? "");
  const [sizeFilter, setSizeFilter] = useState(searchParams.get("str") ?? "");

  // Debounced versions used for the actual fetch
  const [debouncedQuery, setDebouncedQuery] = useState(query);
  const [debouncedMin, setDebouncedMin] = useState("");
  const [debouncedMax, setDebouncedMax] = useState("");
  const [debouncedSize, setDebouncedSize] = useState("");

  // Load categories once
  useEffect(() => {
    supabase.from("categories").select("*").order("id")
      .then(({ data }) => setCategories(data ?? []));
  }, []);

  // Debounce text query
  useEffect(() => {
    const id = setTimeout(() => setDebouncedQuery(query), 350);
    return () => clearTimeout(id);
  }, [query]);

  // Debounce price inputs
  useEffect(() => {
    const id = setTimeout(() => { setDebouncedMin(minPrice); setDebouncedMax(maxPrice); }, 600);
    return () => clearTimeout(id);
  }, [minPrice, maxPrice]);

  // Debounce size filter
  useEffect(() => {
    const id = setTimeout(() => setDebouncedSize(sizeFilter), 350);
    return () => clearTimeout(id);
  }, [sizeFilter]);

  // Request geolocation when "nær-meg" sort is selected
  useEffect(() => {
    if (sort !== "nær-meg") return;
    if (userLocation) return;
    if (!navigator.geolocation) {
      setGeoError("Nettleseren din støtter ikke posisjonsdata.");
      return;
    }
    setGeoLoading(true);
    setGeoError("");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setGeoLoading(false);
        setGeoErrorPersist("");
      },
      () => {
        const msg = "Kunne ikke hente posisjon — sjekk at du har gitt tillatelse i nettleseren.";
        setGeoError(msg);
        setGeoErrorPersist(msg);
        setGeoLoading(false);
        setSort("nyeste");
      }
    );
  }, [sort, userLocation]);

  // Sync URL (including condition and price so filters survive back navigation)
  useEffect(() => {
    const params = new URLSearchParams();
    if (debouncedQuery) params.set("q", debouncedQuery);
    if (activeCategory) params.set("kategori", activeCategory);
    if (sort !== "nyeste") params.set("sorter", sort);
    if (condition) params.set("tilstand", condition);
    if (debouncedMin) params.set("fra", debouncedMin);
    if (debouncedMax) params.set("til", debouncedMax);
    if (debouncedSize) params.set("str", debouncedSize);
    const str = params.toString();
    router.replace(`/utforsk${str ? `?${str}` : ""}`, { scroll: false });
  }, [debouncedQuery, activeCategory, sort, condition, debouncedMin, debouncedMax, debouncedSize, router]);

  // Fetch — depends only on settled (debounced) values + instant filters
  const categoriesReady = categories.length > 0;
  const fetchRef = useRef(0);

  useEffect(() => {
    if (!categoriesReady) return;
    const token = ++fetchRef.current;
    setLoading(true);

    (async () => {
      let q = supabase
        .from("listings")
        .select("*, clubs(*), profiles!listings_seller_id_fkey(*)")
        .eq("is_sold", false);

      if (debouncedQuery.trim()) {
        const p = `%${debouncedQuery.trim()}%`;
        q = q.or(`title.ilike.${p},description.ilike.${p},size_range.ilike.${p}`);
      }

      if (activeCategory) {
        const cat = categories.find((c) => c.slug === activeCategory);
        if (cat) q = q.eq("category", cat.name);
      }

      if (condition) q = q.ilike("condition", condition);
      if (debouncedSize.trim()) q = q.ilike("size_range", `%${debouncedSize.trim()}%`);

      const min = parseInt(debouncedMin);
      const max = parseInt(debouncedMax);
      if (!isNaN(min) && debouncedMin) q = q.gte("price", min);
      if (!isNaN(max) && debouncedMax) q = q.lte("price", max);

      switch (sort) {
        case "pris-lav": q = q.order("price", { ascending: true }); break;
        case "pris-hoy": q = q.order("price", { ascending: false }); break;
        case "nær-meg": q = q.order("created_at", { ascending: false }); break;
        default: q = q.order("created_at", { ascending: false });
      }

      const { data } = await q;
      if (token !== fetchRef.current) return;

      let result = (data ?? []) as ListingWithRelations[];

      if (sort === "nær-meg" && userLocation) {
        result = result
          .filter((l) => l.clubs?.lat != null && l.clubs?.lng != null)
          .sort((a, b) => {
            const da = haversineKm(userLocation.lat, userLocation.lng, a.clubs.lat!, a.clubs.lng!);
            const db = haversineKm(userLocation.lat, userLocation.lng, b.clubs.lat!, b.clubs.lng!);
            return da - db;
          });
      }

      setListings(result);
      setVisibleCount(PAGE_SIZE);
      setLoading(false);
    })();
  }, [debouncedQuery, activeCategory, sort, condition, debouncedMin, debouncedMax, debouncedSize, categories, categoriesReady, userLocation]);

  function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number) {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  const uniqueClubs = new Set(listings.map((l) => l.clubs?.name).filter(Boolean));

  function resetAll() {
    setQuery(""); setActiveCategory(""); setSort("nyeste");
    setCondition(""); setMinPrice(""); setMaxPrice(""); setSizeFilter("");
    setUserLocation(null); setGeoError(""); setGeoErrorPersist("");
  }

  const hasActiveFilters = query || activeCategory || condition || minPrice || maxPrice || sizeFilter || sort !== "nyeste";

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 sm:py-12">

      {/* Header + search + sort */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="font-display text-3xl font-bold text-ink">Utforsk utstyr</h1>
          <p className="mt-1 text-sm text-ink-light">
            {loading ? "Laster..." : `${listings.length} annonser fra ${uniqueClubs.size} klubber`}
          </p>
        </div>
        <div className="flex gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:flex-initial">
            <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-light pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Søk etter utstyr..."
              className="w-full sm:w-64 rounded-lg border border-border bg-white pl-10 pr-4 py-2.5 text-sm placeholder:text-ink-light focus:outline-none focus:ring-2 focus:ring-forest/20"
            />
          </div>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="rounded-lg border border-border bg-white px-4 py-2.5 text-sm text-ink-mid focus:outline-none focus:ring-2 focus:ring-forest/20"
          >
            <option value="nyeste">Nyeste</option>
            <option value="pris-lav">Laveste pris</option>
            <option value="pris-hoy">Høyeste pris</option>
            <option value="nær-meg">Nær meg</option>
          </select>
        </div>
      </div>

      {/* Category pills */}
      <div className="flex flex-wrap gap-2 mb-4">
        <button
          onClick={() => setActiveCategory("")}
          className={`rounded-[20px] px-4 py-1.5 text-sm font-medium transition-colors duration-[120ms] ${!activeCategory ? "bg-forest text-white" : "bg-forest-light text-forest hover:bg-forest hover:text-white"}`}
        >
          Alle
        </button>
        {categories.map((cat) => (
          <button
            key={cat.slug}
            onClick={() => setActiveCategory(activeCategory === cat.slug ? "" : cat.slug)}
            className={`rounded-[20px] px-4 py-1.5 text-sm font-medium transition-colors duration-[120ms] ${activeCategory === cat.slug ? "bg-forest text-white" : "bg-forest-light text-forest hover:bg-forest hover:text-white"}`}
          >
            {cat.emoji} {cat.name}
          </button>
        ))}
      </div>

      {/* Condition + price row */}
      <div className="flex flex-wrap items-center gap-3 mb-8 pt-4 border-t border-border">
        <span className="text-xs font-semibold text-ink-light uppercase tracking-wider">Tilstand:</span>
        {CONDITIONS.map(({ value, label }) => (
          <button
            key={label}
            onClick={() => setCondition(condition === value ? "" : value)}
            className={`rounded-[20px] px-3 py-1 text-xs font-medium transition-colors duration-[120ms] ${
              condition === value && value !== ""
                ? "bg-ink text-white"
                : value === "" && condition === ""
                ? "bg-ink text-white"
                : "bg-cream text-ink-mid hover:bg-border"
            }`}
          >
            {label}
          </button>
        ))}

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-ink-light uppercase tracking-wider">Str:</span>
          <input
            type="text"
            value={sizeFilter}
            onChange={(e) => setSizeFilter(e.target.value)}
            placeholder="F.eks. M, 42"
            className="w-24 rounded-lg border border-border bg-white px-3 py-1.5 text-xs text-ink placeholder:text-ink-light focus:outline-none focus:ring-2 focus:ring-forest/20"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-ink-light uppercase tracking-wider">Pris:</span>
          <input
            type="number"
            value={minPrice}
            onChange={(e) => setMinPrice(e.target.value)}
            placeholder="Fra"
            className="w-20 rounded-lg border border-border bg-white px-3 py-1.5 text-xs text-ink placeholder:text-ink-light focus:outline-none focus:ring-2 focus:ring-forest/20"
          />
          <span className="text-xs text-ink-light">–</span>
          <input
            type="number"
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
            placeholder="Til"
            className="w-20 rounded-lg border border-border bg-white px-3 py-1.5 text-xs text-ink placeholder:text-ink-light focus:outline-none focus:ring-2 focus:ring-forest/20"
          />
          <span className="text-xs text-ink-light">kr</span>
          {hasActiveFilters && (
            <button onClick={resetAll} className="ml-1 text-xs text-ink-light hover:text-forest transition-colors duration-[120ms] whitespace-nowrap">
              Nullstill
            </button>
          )}
        </div>
      </div>


      {/* Geo status */}
      {geoErrorPersist && (
        <div className="mb-4 flex items-center gap-2 rounded-lg bg-red-50 border border-red-200 px-3 py-2">
          <svg className="h-4 w-4 text-red-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126z" />
          </svg>
          <p className="text-xs text-red-600">{geoErrorPersist}</p>
          <button onClick={() => setGeoErrorPersist("")} className="ml-auto text-red-400 hover:text-red-600 text-xs">✕</button>
        </div>
      )}
      {sort === "nær-meg" && !geoErrorPersist && (geoLoading || userLocation) && (
        <div className="mb-4">
          {geoLoading && (
            <div className="flex items-center gap-2 text-xs text-ink-light">
              <div className="h-3.5 w-3.5 rounded-full border-2 border-forest border-t-transparent animate-spin" />
              Henter posisjon...
            </div>
          )}
          {userLocation && !geoLoading && (
            <div className="flex items-center gap-1.5 text-xs text-forest">
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm6 2.5a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Sortert etter avstand fra deg
            </div>
          )}
        </div>
      )}

      {/* Save search alert */}
      <div className="mb-6">
        <SavedSearchAlert
          defaultKeywords={query}
          defaultCategory={activeCategory}
        />
      </div>

      {/* Results */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, i) => <ListingCardSkeleton key={i} />)}
        </div>
      ) : listings.length > 0 ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {listings.slice(0, visibleCount).map((listing) => (
              <ListingCard key={listing.id} listing={listing} showSeller />
            ))}
          </div>
          {visibleCount < listings.length && (
            <div className="mt-10 text-center">
              <button
                onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
                className="rounded-lg border border-border px-8 py-3 text-sm font-semibold text-ink hover:bg-cream transition-colors duration-[120ms]"
              >
                Vis flere ({listings.length - visibleCount} gjenstår)
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-20">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-cream">
            <svg className="h-7 w-7 text-ink-light" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
          </div>
          <h2 className="font-display text-xl font-semibold text-ink">Ingen annonser funnet</h2>
          <p className="mt-2 text-sm text-ink-light">Prøv å fjerne filtre eller søk med et annet ord.</p>
          <button onClick={resetAll} className="mt-4 text-sm font-medium text-forest hover:text-forest-mid transition-colors duration-[120ms]">
            Nullstill alle filtre
          </button>
        </div>
      )}
    </div>
  );
}
