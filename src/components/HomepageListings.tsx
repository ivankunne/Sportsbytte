"use client";

import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import type { ListingWithRelations, Category } from "@/lib/queries";
import { ListingCard } from "./ListingCard";
import { ListingCardSkeleton } from "./Skeleton";

const CONDITIONS = ["Som ny", "Pent brukt", "Godt brukt", "Mye brukt"];
const SORTS = [
  { value: "nyeste", label: "Nyeste først" },
  { value: "pris-lav", label: "Lavest pris" },
  { value: "pris-hoy", label: "Høyest pris" },
];

export function HomepageListings({ initialCategories }: { initialCategories: Category[] }) {
  const [listings, setListings] = useState<ListingWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("");
  const [condition, setCondition] = useState("");
  const [sort, setSort] = useState("nyeste");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [debouncedMin, setDebouncedMin] = useState("");
  const [debouncedMax, setDebouncedMax] = useState("");
  const fetchRef = useRef(0);

  useEffect(() => {
    const id = setTimeout(() => { setDebouncedMin(minPrice); setDebouncedMax(maxPrice); }, 600);
    return () => clearTimeout(id);
  }, [minPrice, maxPrice]);

  useEffect(() => {
    const token = ++fetchRef.current;
    setLoading(true);

    async function fetch() {
      let q = supabase
        .from("listings")
        .select("*, clubs(*), profiles!listings_seller_id_fkey(*)")
        .eq("is_sold", false);

      if (activeCategory) {
        const cat = initialCategories.find((c) => c.slug === activeCategory);
        if (cat) q = q.eq("category", cat.name);
      }

      if (condition) q = q.eq("condition", condition);

      const min = parseFloat(debouncedMin);
      const max = parseFloat(debouncedMax);
      if (!isNaN(min)) q = q.gte("price", min);
      if (!isNaN(max)) q = q.lte("price", max);

      if (sort === "pris-lav") q = q.order("price", { ascending: true });
      else if (sort === "pris-hoy") q = q.order("price", { ascending: false });
      else q = q.order("created_at", { ascending: false });

      q = q.limit(6);

      const { data } = await q;
      if (token === fetchRef.current) {
        setListings((data as ListingWithRelations[]) ?? []);
        setLoading(false);
      }
    }

    fetch();
  }, [activeCategory, condition, sort, debouncedMin, debouncedMax, initialCategories]);

  const hasActiveFilters = activeCategory || condition || minPrice || maxPrice || sort !== "nyeste";

  function clearFilters() {
    setActiveCategory("");
    setCondition("");
    setSort("nyeste");
    setMinPrice("");
    setMaxPrice("");
  }

  return (
    <div>
      {/* Filter bar */}
      <div className="flex flex-col gap-4 mb-8">
        {/* Category pills */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setActiveCategory("")}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors duration-[120ms] ${
              activeCategory === ""
                ? "bg-amber text-white"
                : "bg-forest-light text-forest hover:bg-forest-light/70"
            }`}
          >
            Alle
          </button>
          {initialCategories.map((cat) => (
            <button
              key={cat.slug}
              onClick={() => setActiveCategory(cat.slug === activeCategory ? "" : cat.slug)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors duration-[120ms] ${
                activeCategory === cat.slug
                  ? "bg-amber text-white"
                  : "bg-forest-light text-forest hover:bg-forest-light/70"
              }`}
            >
              {cat.emoji} {cat.name}
            </button>
          ))}
        </div>

        {/* Second row: condition + sort + price */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Condition */}
          <select
            value={condition}
            onChange={(e) => setCondition(e.target.value)}
            className="rounded-lg border border-border bg-white px-3 py-1.5 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-amber/30"
          >
            <option value="">Alle tilstander</option>
            {CONDITIONS.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          {/* Sort */}
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="rounded-lg border border-border bg-white px-3 py-1.5 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-amber/30"
          >
            {SORTS.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>

          {/* Price range */}
          <div className="flex items-center gap-1.5">
            <input
              type="number"
              placeholder="Min kr"
              value={minPrice}
              onChange={(e) => setMinPrice(e.target.value)}
              className="w-24 rounded-lg border border-border bg-white px-3 py-1.5 text-sm text-ink placeholder:text-ink-light focus:outline-none focus:ring-2 focus:ring-amber/30"
            />
            <span className="text-ink-light text-sm">–</span>
            <input
              type="number"
              placeholder="Maks kr"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
              className="w-24 rounded-lg border border-border bg-white px-3 py-1.5 text-sm text-ink placeholder:text-ink-light focus:outline-none focus:ring-2 focus:ring-amber/30"
            />
          </div>

          {/* Clear */}
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="text-sm text-ink-light hover:text-ink transition-colors duration-[120ms] underline"
            >
              Nullstill
            </button>
          )}
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => <ListingCardSkeleton key={i} />)}
        </div>
      ) : listings.length === 0 ? (
        <div className="py-16 text-center text-ink-mid">
          <p className="text-lg font-medium text-ink mb-1">Ingen annonser funnet</p>
          <p className="text-sm">Prøv å justere filtrene dine.</p>
          <button onClick={clearFilters} className="mt-4 text-sm text-amber hover:underline">
            Vis alle annonser
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {listings.map((listing) => (
            <ListingCard key={listing.id} listing={listing} />
          ))}
        </div>
      )}
    </div>
  );
}
