"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import type { ListingWithRelations, Category } from "@/lib/queries";
import { ListingCard } from "./ListingCard";

type Props = {
  clubId: number;
  clubName: string;
  initialListings: ListingWithRelations[];
};

export function ClubListings({ clubId, clubName, initialListings }: Props) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [listings, setListings] = useState(initialListings);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("");
  const [sort, setSort] = useState("nyeste");

  useEffect(() => {
    supabase
      .from("categories")
      .select("*")
      .order("id")
      .then(({ data }) => setCategories(data ?? []));
  }, []);

  const fetchListings = useCallback(async () => {
    setLoading(true);

    let q = supabase
      .from("listings")
      .select("*, clubs(*), profiles(*)")
      .eq("is_sold", false)
      .eq("club_id", clubId);

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
  }, [query, activeCategory, sort, clubId, categories]);

  const [debouncedQuery, setDebouncedQuery] = useState("");
  useEffect(() => {
    const id = setTimeout(() => setDebouncedQuery(query), 300);
    return () => clearTimeout(id);
  }, [query]);

  const [initialized, setInitialized] = useState(false);
  useEffect(() => {
    if (!initialized && !debouncedQuery && !activeCategory && sort === "nyeste") {
      setInitialized(true);
      return;
    }
    setInitialized(true);
    if (categories.length > 0 || !activeCategory) fetchListings();
  }, [debouncedQuery, activeCategory, sort, categories, fetchListings, initialized]);

  return (
    <>
      {/* Filter bar */}
      <div className="flex flex-col sm:flex-row gap-4 mb-8">
        <div className="flex flex-wrap gap-2 flex-1">
          <button
            onClick={() => setActiveCategory("")}
            className={`rounded-[20px] px-4 py-1.5 text-[13px] font-medium transition-colors duration-[120ms] ${
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
              className={`rounded-[20px] px-4 py-1.5 text-[13px] font-medium transition-colors duration-[120ms] ${
                activeCategory === cat.slug
                  ? "bg-forest text-white"
                  : "bg-forest-light text-forest hover:bg-forest hover:text-white"
              }`}
            >
              {cat.emoji} {cat.name}
            </button>
          ))}
        </div>
        <div className="flex gap-3">
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
              placeholder={`Søk i ${clubName}...`}
              className="rounded-lg border border-border bg-white pl-10 pr-4 py-1.5 text-sm text-ink placeholder:text-ink-light focus:outline-none focus:ring-2 focus:ring-forest/20 focus:border-forest w-full sm:w-56"
            />
          </div>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="rounded-lg border border-border bg-white px-4 py-1.5 text-sm text-ink-mid focus:outline-none focus:ring-2 focus:ring-forest/20 focus:border-forest"
          >
            <option value="nyeste">Nyeste</option>
            <option value="pris-lav">Laveste pris</option>
            <option value="pris-hoy">Høyeste pris</option>
          </select>
        </div>
      </div>

      {/* Listings grid */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-forest border-r-transparent" />
        </div>
      ) : listings.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {listings.map((listing) => (
            <ListingCard key={listing.id} listing={listing} showSeller />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-ink-light">
            {query || activeCategory
              ? "Ingen annonser matcher filtrene dine."
              : "Ingen annonser i denne klubben ennå."}
          </p>
          {(query || activeCategory) && (
            <button
              onClick={() => {
                setQuery("");
                setActiveCategory("");
                setSort("nyeste");
              }}
              className="mt-3 text-sm font-medium text-forest hover:text-forest-mid transition-colors duration-[120ms]"
            >
              Nullstill filtre
            </button>
          )}
        </div>
      )}
    </>
  );
}
