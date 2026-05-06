"use client";

import { Suspense, useState, useEffect, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import type { ListingWithRelations, Category } from "@/lib/queries";
import { ListingCard } from "@/components/ListingCard";
import { ListingCardSkeleton } from "@/components/Skeleton";
import { SavedSearchAlert } from "@/components/SavedSearchAlert";

type KartverketResult = {
  name: string;
  kommune: string;
  type: string;
  lat: number;
  lng: number;
};

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

  const [showFilters, setShowFilters] = useState(false);

  // Instant filters
  const [activeCategory, setActiveCategory] = useState(searchParams.get("kategori") ?? "");
  const [sort, setSort] = useState(searchParams.get("sorter") ?? "nyeste");
  const [condition, setCondition] = useState(searchParams.get("tilstand") ?? "");
  const [radiusKm, setRadiusKm] = useState(25);
  const [giBortOnly, setGiBortOnly] = useState(searchParams.get("gi_bort") === "1");

  // Location filter
  const [locationInput, setLocationInput] = useState("");
  const [locationLat, setLocationLat] = useState<number | null>(null);
  const [locationLng, setLocationLng] = useState<number | null>(null);
  const [locationSuggestions, setLocationSuggestions] = useState<KartverketResult[]>([]);
  const [showLocationSugs, setShowLocationSugs] = useState(false);
  const [locationFetching, setLocationFetching] = useState(false);
  const [geoLoading, setGeoLoading] = useState(false);
  const [geoError, setGeoError] = useState("");
  const locationDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Debounced filters
  const [query, setQuery] = useState(searchParams.get("q") ?? "");
  const [minPrice, setMinPrice] = useState(searchParams.get("fra") ?? "");
  const [maxPrice, setMaxPrice] = useState(searchParams.get("til") ?? "");
  const [sizeFilter, setSizeFilter] = useState(searchParams.get("str") ?? "");

  const [debouncedQuery, setDebouncedQuery] = useState(query);
  const [debouncedMin, setDebouncedMin] = useState("");
  const [debouncedMax, setDebouncedMax] = useState("");
  const [debouncedSize, setDebouncedSize] = useState("");

  useEffect(() => {
    supabase.from("categories").select("*").order("id")
      .then(({ data }) => setCategories(data ?? []));
  }, []);

  useEffect(() => {
    const id = setTimeout(() => setDebouncedQuery(query), 350);
    return () => clearTimeout(id);
  }, [query]);

  useEffect(() => {
    const id = setTimeout(() => { setDebouncedMin(minPrice); setDebouncedMax(maxPrice); }, 600);
    return () => clearTimeout(id);
  }, [minPrice, maxPrice]);

  useEffect(() => {
    const id = setTimeout(() => setDebouncedSize(sizeFilter), 350);
    return () => clearTimeout(id);
  }, [sizeFilter]);

  function handleLocationInput(val: string) {
    setLocationInput(val);
    setLocationLat(null);
    setLocationLng(null);
    setGeoError("");
    if (locationDebounceRef.current) clearTimeout(locationDebounceRef.current);
    if (!val.trim()) {
      setLocationSuggestions([]);
      setShowLocationSugs(false);
      return;
    }
    locationDebounceRef.current = setTimeout(async () => {
      setLocationFetching(true);
      try {
        const res = await fetch(
          `https://ws.geonorge.no/stedsnavn/v1/navn?sok=${encodeURIComponent(val)}*&fuzzy=true&treffPerSide=8&utkoordsys=4258&navneobjekttype=By,Tettsted,Grend,Bygd,Bydel,Bosted,Gate,Veg`
        );
        const json = await res.json();
        const results: KartverketResult[] = (json.navn ?? []).map((item: Record<string, unknown>) => ({
          name: item.skrivemåte as string,
          kommune: (item.kommuner as Array<{ kommunenavn: string }>)?.[0]?.kommunenavn ?? "",
          type: item.navneobjekttype as string ?? "",
          lat: (item.representasjonspunkt as { nord: number })?.nord ?? 0,
          lng: (item.representasjonspunkt as { øst: number })?.øst ?? 0,
        }));
        setLocationSuggestions(results);
        setShowLocationSugs(results.length > 0);
      } catch {
        setLocationSuggestions([]);
      } finally {
        setLocationFetching(false);
      }
    }, 250);
  }

  function selectLocationSuggestion(result: KartverketResult) {
    setLocationInput(result.name);
    setLocationLat(result.lat);
    setLocationLng(result.lng);
    setShowLocationSugs(false);
    setLocationSuggestions([]);
  }

  function handleUseMyLocation() {
    if (!navigator.geolocation) {
      setGeoError("Nettleseren din støtter ikke posisjonsdata.");
      return;
    }
    setGeoLoading(true);
    setGeoError("");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocationLat(pos.coords.latitude);
        setLocationLng(pos.coords.longitude);
        setLocationInput("Min posisjon");
        setGeoLoading(false);
      },
      () => {
        setGeoError("Kunne ikke hente posisjon — sjekk tillatelse i nettleseren.");
        setGeoLoading(false);
      }
    );
  }

  function clearLocation() {
    setLocationInput("");
    setLocationLat(null);
    setLocationLng(null);
    setLocationSuggestions([]);
    setShowLocationSugs(false);
    setGeoError("");
  }

  // Sync URL
  useEffect(() => {
    const params = new URLSearchParams();
    if (debouncedQuery) params.set("q", debouncedQuery);
    if (activeCategory) params.set("kategori", activeCategory);
    if (sort !== "nyeste") params.set("sorter", sort);
    if (condition) params.set("tilstand", condition);
    if (debouncedMin) params.set("fra", debouncedMin);
    if (debouncedMax) params.set("til", debouncedMax);
    if (debouncedSize) params.set("str", debouncedSize);
    if (giBortOnly) params.set("gi_bort", "1");
    const str = params.toString();
    router.replace(`/utforsk${str ? `?${str}` : ""}`, { scroll: false });
  }, [debouncedQuery, activeCategory, sort, condition, debouncedMin, debouncedMax, debouncedSize, giBortOnly, router]);

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

      if (locationLat !== null && locationLng !== null && radiusKm > 0) {
        const latDelta = radiusKm / 111.32;
        const lngDelta = radiusKm / (111.32 * Math.cos(locationLat * Math.PI / 180));
        q = q
          .gte("lat", locationLat - latDelta)
          .lte("lat", locationLat + latDelta)
          .gte("lng", locationLng - lngDelta)
          .lte("lng", locationLng + lngDelta)
          .not("lat", "is", null);
      }

      if (giBortOnly) q = q.eq("listing_type", "gi_bort");

      const min = parseInt(debouncedMin);
      const max = parseInt(debouncedMax);
      if (!isNaN(min) && debouncedMin) q = q.gte("price", min);
      if (!isNaN(max) && debouncedMax) q = q.lte("price", max);

      switch (sort) {
        case "pris-lav": q = q.order("price", { ascending: true }); break;
        case "pris-hoy": q = q.order("price", { ascending: false }); break;
        default: q = q.order("created_at", { ascending: false });
      }

      const { data } = await q;
      if (token !== fetchRef.current) return;

      let result = (data ?? []) as ListingWithRelations[];

      if (sort === "nær-meg" && locationLat !== null && locationLng !== null) {
        result = result
          .filter((l) => (l as unknown as { lat: number }).lat != null)
          .sort((a, b) => {
            const la = a as unknown as { lat: number; lng: number };
            const lb = b as unknown as { lat: number; lng: number };
            return haversineKm(locationLat, locationLng!, la.lat, la.lng)
              - haversineKm(locationLat, locationLng!, lb.lat, lb.lng);
          });
      }

      setListings(result);
      setVisibleCount(PAGE_SIZE);
      setLoading(false);
    })();
  }, [debouncedQuery, activeCategory, sort, condition, debouncedMin, debouncedMax, debouncedSize, locationLat, locationLng, radiusKm, giBortOnly, categories, categoriesReady]);

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
    setRadiusKm(25); setGiBortOnly(false);
    clearLocation();
  }

  const hasActiveFilters = query || activeCategory || condition || minPrice || maxPrice || sizeFilter || locationLat !== null || giBortOnly || sort !== "nyeste";

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
            {locationLat !== null && <option value="nær-meg">Nær meg</option>}
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

      {/* Mobile filter toggle */}
      <div className="md:hidden mb-3 flex items-center gap-2 pt-3 border-t border-border">
        <button
          onClick={() => setShowFilters((v) => !v)}
          className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-colors duration-[120ms] ${showFilters ? "bg-forest text-white" : "bg-cream text-ink-mid hover:bg-border"}`}
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" />
          </svg>
          Filtre
          {hasActiveFilters && <span className="flex h-2 w-2 rounded-full bg-amber" />}
        </button>
        {hasActiveFilters && (
          <button onClick={resetAll} className="text-xs text-ink-light hover:text-forest transition-colors duration-[120ms]">
            Nullstill
          </button>
        )}
      </div>

      {/* Filters row */}
      <div className={`flex-wrap items-center gap-3 mb-8 md:pt-4 md:border-t md:border-border ${showFilters ? "flex" : "hidden md:flex"}`}>

        {/* Condition */}
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

        {/* Size */}
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

        {/* Price */}
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
        </div>

        {/* Location filter */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-semibold text-ink-light uppercase tracking-wider">Sted:</span>
          <div className="relative">
            <input
              type="text"
              value={locationInput}
              onChange={(e) => handleLocationInput(e.target.value)}
              onFocus={() => locationSuggestions.length > 0 && setShowLocationSugs(true)}
              onBlur={() => setTimeout(() => setShowLocationSugs(false), 150)}
              placeholder="Søk etter sted..."
              className="w-40 rounded-lg border border-border bg-white pl-3 pr-7 py-1.5 text-xs text-ink placeholder:text-ink-light focus:outline-none focus:ring-2 focus:ring-forest/20"
            />
            {locationFetching && (
              <div className="absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3 rounded-full border-2 border-forest border-t-transparent animate-spin" />
            )}
            {locationInput && !locationFetching && (
              <button
                type="button"
                onClick={clearLocation}
                className="absolute right-1.5 top-1/2 -translate-y-1/2 text-ink-light hover:text-ink text-xs leading-none"
              >
                ✕
              </button>
            )}
            {showLocationSugs && locationSuggestions.length > 0 && (
              <ul className="absolute z-50 top-full mt-1 w-64 bg-white border border-border rounded-lg shadow-lg py-1 max-h-52 overflow-y-auto text-left">
                {locationSuggestions.map((r, i) => (
                  <li key={i}>
                    <button
                      type="button"
                      onMouseDown={() => selectLocationSuggestion(r)}
                      className="w-full px-3 py-2 text-left hover:bg-cream transition-colors duration-[80ms]"
                    >
                      <p className="text-xs font-medium text-ink">{r.name}</p>
                      <p className="text-[10px] text-ink-light">{r.kommune}{r.type ? ` · ${r.type}` : ""}</p>
                    </button>
                  </li>
                ))}
                <li className="px-3 pt-1 pb-1.5 text-[9px] text-ink-light border-t border-border mt-0.5">
                  © Kartverket Stedsnavn
                </li>
              </ul>
            )}
          </div>

          <button
            type="button"
            onClick={handleUseMyLocation}
            disabled={geoLoading}
            title="Bruk min posisjon"
            className="flex items-center gap-1.5 rounded-[20px] px-3 py-1 text-xs font-medium bg-cream text-ink-mid hover:bg-border transition-colors duration-[120ms] disabled:opacity-60"
          >
            {geoLoading ? (
              <div className="h-3 w-3 rounded-full border-2 border-forest border-t-transparent animate-spin" />
            ) : (
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm6 2.5a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
            Min posisjon
          </button>

          {locationLat !== null && (
            <select
              value={radiusKm}
              onChange={(e) => setRadiusKm(Number(e.target.value))}
              className="rounded-lg border border-border bg-white px-2 py-1 text-xs text-ink focus:outline-none focus:ring-2 focus:ring-forest/20"
            >
              <option value={10}>10 km</option>
              <option value={25}>25 km</option>
              <option value={50}>50 km</option>
              <option value={100}>100 km</option>
              <option value={250}>250 km</option>
            </select>
          )}

          {geoError && (
            <p className="text-[10px] text-red-500">{geoError}</p>
          )}
        </div>

        {/* Gratis toggle */}
        <button
          onClick={() => setGiBortOnly((v) => !v)}
          className={`rounded-[20px] px-3 py-1 text-xs font-medium transition-colors duration-[120ms] ${
            giBortOnly ? "bg-green-600 text-white" : "bg-cream text-ink-mid hover:bg-border"
          }`}
        >
          🎁 Gratis
        </button>

        {hasActiveFilters && (
          <button onClick={resetAll} className="text-xs text-ink-light hover:text-forest transition-colors duration-[120ms] whitespace-nowrap">
            Nullstill alle
          </button>
        )}
      </div>

      {/* Active location indicator */}
      {locationLat !== null && locationInput && (
        <div className="mb-4 flex items-center gap-2 text-xs text-forest">
          <svg className="h-3.5 w-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm6 2.5a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Viser annonser innen {radiusKm} km fra {locationInput}
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
