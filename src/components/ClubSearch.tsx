"use client";

import { useState } from "react";
import Link from "next/link";
import type { Club } from "@/lib/queries";

export function ClubSearch({ clubs }: { clubs: Club[] }) {
  const [query, setQuery] = useState("");

  const filtered = clubs.filter(
    (c) =>
      !query.trim() ||
      c.name.toLowerCase().includes(query.trim().toLowerCase())
  );

  return (
    <div>
      <div className="mb-6">
        <div className="relative max-w-xs">
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
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Søk etter klubb..."
            className="w-full rounded-lg border border-border pl-10 pr-4 py-2.5 text-sm text-ink placeholder:text-ink-light bg-white focus:outline-none focus:ring-2 focus:ring-forest/20 focus:border-forest"
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="text-sm text-ink-light py-4">Ingen klubber matcher søket ditt.</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {filtered.map((club) => (
            <Link
              key={club.id}
              href={`/klubb/${club.slug}`}
              className="group flex flex-col items-center rounded-xl bg-white border border-border p-5 hover:shadow-md hover:-translate-y-0.5 transition-all duration-[120ms]"
            >
              {club.logo_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={club.logo_url}
                  alt={club.name}
                  className="h-14 w-14 rounded-full object-cover mb-3"
                />
              ) : (
                <div
                  className="h-14 w-14 rounded-full flex items-center justify-center text-white text-lg font-bold font-display mb-3"
                  style={{ backgroundColor: club.color }}
                >
                  {club.initials}
                </div>
              )}
              <p className="text-sm font-semibold text-ink text-center leading-tight line-clamp-2">
                {club.name}
              </p>
              <p className="text-xs text-ink-light mt-1">
                {club.members.toLocaleString("nb-NO")} medlemmer
              </p>
              {club.active_listings > 0 && (
                <p className="text-xs text-forest mt-0.5">
                  {club.active_listings} annonser
                </p>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
