"use client";

import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import type { ListingWithRelations } from "@/lib/queries";
import { ListingCard } from "./ListingCard";

type Props = {
  clubId: number;
  clubName: string;
  initialListings: ListingWithRelations[];
};

export function ClubListings({ clubId, clubName, initialListings }: Props) {
  const [listings, setListings] = useState(initialListings);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState("nyeste");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const fetchRef = useRef(0);

  useEffect(() => {
    const id = setTimeout(() => setDebouncedQuery(query), 300);
    return () => clearTimeout(id);
  }, [query]);

  useEffect(() => {
    if (!debouncedQuery && sort === "nyeste") {
      setListings(initialListings);
      return;
    }
    const token = ++fetchRef.current;
    setLoading(true);

    (async () => {
      let q = supabase
        .from("listings")
        .select("*, clubs(*), profiles!listings_seller_id_fkey(*)")
        .eq("is_sold", false)
        .eq("club_id", clubId);

      if (debouncedQuery.trim()) {
        const pattern = `%${debouncedQuery.trim()}%`;
        q = q.or(`title.ilike.${pattern},description.ilike.${pattern}`);
      }

      switch (sort) {
        case "pris-lav": q = q.order("price", { ascending: true }); break;
        case "pris-hoy": q = q.order("price", { ascending: false }); break;
        default: q = q.order("created_at", { ascending: false });
      }

      const { data } = await q;
      if (token !== fetchRef.current) return;
      setListings((data ?? []) as ListingWithRelations[]);
      setLoading(false);
    })();
  }, [debouncedQuery, sort, clubId, initialListings]);

  return (
    <>
      {/* Search + sort bar */}
      <div className="flex gap-3 mb-8">
        <div className="relative flex-1">
          <svg
            className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-light pointer-events-none"
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={`Søk i ${clubName}...`}
            className="w-full rounded-lg border border-border bg-white pl-10 pr-4 py-2 text-sm text-ink placeholder:text-ink-light focus:outline-none focus:ring-2 focus:ring-forest/20 focus:border-forest"
          />
        </div>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          className="rounded-lg border border-border bg-white px-4 py-2 text-sm text-ink-mid focus:outline-none focus:ring-2 focus:ring-forest/20 focus:border-forest"
        >
          <option value="nyeste">Nyeste</option>
          <option value="pris-lav">Laveste pris</option>
          <option value="pris-hoy">Høyeste pris</option>
        </select>
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
            {query ? "Ingen annonser matcher søket ditt." : "Ingen annonser i denne klubben ennå."}
          </p>
          {query && (
            <button
              onClick={() => setQuery("")}
              className="mt-3 text-sm font-medium text-forest hover:text-forest-mid transition-colors duration-[120ms]"
            >
              Nullstill søk
            </button>
          )}
        </div>
      )}
    </>
  );
}
