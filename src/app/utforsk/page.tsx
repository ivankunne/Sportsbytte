"use client";

import { Suspense, useState, useEffect, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import type { ListingWithRelations, Category } from "@/lib/queries";
import { ListingCard } from "@/components/ListingCard";

export default function ExplorePageWrapper() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-7xl px-4 py-20 text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-forest border-r-transparent" />
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

  const initialCategory = searchParams.get("kategori") ?? "";
  const initialQuery = searchParams.get("q") ?? "";
  const initialSort = searchParams.get("sorter") ?? "nyeste";

  const [categories, setCategories] = useState<Category[]>([]);
  const [listings, setListings] = useState<ListingWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState(initialQuery);
  const [activeCategory, setActiveCategory] = useState(initialCategory);
  const [sort, setSort] = useState(initialSort);

  // Load categories once
  useEffect(() => {
    supabase
      .from("categories")
      .select("*")
      .order("id")
      .then(({ data }) => setCategories(data ?? []));
  }, []);

  // Search listings when filters change
  const fetchListings = useCallback(async () => {
    setLoading(true);

    let q = supabase
      .from("listings")
      .select("*, clubs(*), profiles(*)")
      .eq("is_sold", false);

    if (query.trim()) {
      const pattern = `%${query.trim()}%`;
      q = q.or(`title.ilike.${pattern},description.ilike.${pattern}`);
    }

    if (activeCategory) {
      const cat = categories.find((c) => c.slug === activeCategory);
      if (cat) q = q.eq("category", cat.name);
    }

    switch (sort) {
      case "pris-lav":
        q = q.order("price", { ascending: true });
        break;
      case "pris-hoy":
        q = q.order("price", { ascending: false });
        break;
      default:
        q = q.order("created_at", { ascending: false });
    }

    const { data } = await q;
    setListings((data ?? []) as ListingWithRelations[]);
    setLoading(false);
  }, [query, activeCategory, sort, categories]);

  // Debounce search query
  const [debouncedQuery, setDebouncedQuery] = useState(query);
  useEffect(() => {
    const id = setTimeout(() => setDebouncedQuery(query), 300);
    return () => clearTimeout(id);
  }, [query]);

  useEffect(() => {
    if (categories.length > 0) fetchListings();
  }, [debouncedQuery, activeCategory, sort, categories, fetchListings]);

  // Sync URL
  useEffect(() => {
    const params = new URLSearchParams();
    if (debouncedQuery) params.set("q", debouncedQuery);
    if (activeCategory) params.set("kategori", activeCategory);
    if (sort !== "nyeste") params.set("sorter", sort);
    const str = params.toString();
    router.replace(`/utforsk${str ? `?${str}` : ""}`, { scroll: false });
  }, [debouncedQuery, activeCategory, sort, router]);

  const uniqueClubs = new Set(listings.map((l) => l.clubs?.name).filter(Boolean));

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="font-display text-3xl font-bold text-ink">
            Utforsk utstyr
          </h1>
          <p className="mt-1 text-sm text-ink-light">
            {loading ? "Laster..." : `${listings.length} annonser fra ${uniqueClubs.size} klubber`}
          </p>
        </div>

        <div className="flex gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:flex-initial">
            <svg
              className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-light pointer-events-none"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Søk etter utstyr..."
              aria-label="Søk etter utstyr"
              className="w-full sm:w-64 rounded-lg border border-border bg-white pl-10 pr-4 py-2.5 text-sm placeholder:text-ink-light focus:outline-none focus:ring-2 focus:ring-forest/20"
            />
          </div>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            aria-label="Sorter annonser"
            className="rounded-lg border border-border bg-white px-4 py-2.5 text-sm text-ink-mid focus:outline-none focus:ring-2 focus:ring-forest/20"
          >
            <option value="nyeste">Nyeste</option>
            <option value="pris-lav">Laveste pris</option>
            <option value="pris-hoy">Høyeste pris</option>
          </select>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-8">
        <button
          onClick={() => setActiveCategory("")}
          className={`rounded-[20px] px-4 py-1.5 text-sm font-medium transition-colors duration-[120ms] ${
            !activeCategory
              ? "bg-forest text-white"
              : "bg-forest-light text-forest hover:bg-forest hover:text-white"
          }`}
        >
          Alle
        </button>
        {categories.map((cat) => (
          <button
            key={cat.slug}
            onClick={() =>
              setActiveCategory(activeCategory === cat.slug ? "" : cat.slug)
            }
            className={`rounded-[20px] px-4 py-1.5 text-sm font-medium transition-colors duration-[120ms] ${
              activeCategory === cat.slug
                ? "bg-forest text-white"
                : "bg-forest-light text-forest hover:bg-forest hover:text-white"
            }`}
          >
            {cat.emoji} {cat.name}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-forest border-r-transparent" />
        </div>
      ) : listings.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {listings.map((listing) => (
            <ListingCard key={listing.id} listing={listing} showSeller />
          ))}
        </div>
      ) : (
        <div className="text-center py-20">
          <div className="text-4xl mb-4">🔍</div>
          <h2 className="font-display text-xl font-semibold text-ink">
            Ingen annonser funnet
          </h2>
          <p className="mt-2 text-sm text-ink-light">
            Prøv å fjerne filtre eller søk med et annet ord.
          </p>
          <button
            onClick={() => {
              setQuery("");
              setActiveCategory("");
              setSort("nyeste");
            }}
            className="mt-4 text-sm font-medium text-forest hover:text-forest-mid transition-colors duration-[120ms]"
          >
            Nullstill alle filtre
          </button>
        </div>
      )}
    </div>
  );
}
