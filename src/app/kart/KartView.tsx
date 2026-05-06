"use client";

import { useEffect, useState } from "react";
import { Map, Marker } from "pigeon-maps";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

type MapListing = {
  id: number;
  title: string;
  price: number;
  location: string | null;
  lat: number | null;
  lng: number | null;
  images: string[];
  listing_type: string | null;
};

export function KartView() {
  const [listings, setListings] = useState<MapListing[]>([]);
  const [selected, setSelected] = useState<MapListing | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from("listings")
      .select("id, title, price, location, lat, lng, images, listing_type")
      .eq("is_sold", false)
      .not("lat", "is", null)
      .not("lng", "is", null)
      .limit(300)
      .then(({ data }) => {
        setListings((data ?? []) as MapListing[]);
        setLoading(false);
      }, () => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[600px] rounded-xl bg-white border border-border">
        <div className="h-8 w-8 rounded-full border-2 border-forest border-t-transparent animate-spin" />
      </div>
    );
  }

  const withCoords = listings.filter((l) => l.lat && l.lng);

  // Default center: Norway
  const center: [number, number] = withCoords.length > 0
    ? [
        withCoords.reduce((s, l) => s + l.lat!, 0) / withCoords.length,
        withCoords.reduce((s, l) => s + l.lng!, 0) / withCoords.length,
      ]
    : [63.4, 10.4];

  return (
    <div className="relative">
      <Map
        height={600}
        defaultCenter={center}
        defaultZoom={withCoords.length > 1 ? 5 : 10}
        onClick={() => setSelected(null)}
        attribution={false}
      >
        {withCoords.map((l) => (
          <Marker
            key={l.id}
            anchor={[l.lat!, l.lng!]}
            onClick={() => setSelected(selected?.id === l.id ? null : l)}
            color={l.listing_type === "gi_bort" ? "#16a34a" : "#134e4a"}
          />
        ))}
      </Map>

      {selected && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-[1000] w-72 bg-white rounded-xl shadow-xl border border-border p-4">
          <button
            onClick={() => setSelected(null)}
            className="absolute top-3 right-3 text-ink-light hover:text-ink"
            aria-label="Lukk"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <div className="flex gap-3">
            {selected.images[0] ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={selected.images[0]} alt="" className="h-16 w-16 rounded-lg object-cover flex-shrink-0" />
            ) : (
              <div className="h-16 w-16 rounded-lg bg-border flex-shrink-0" />
            )}
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm text-ink truncate leading-snug">{selected.title}</p>
              {selected.location && (
                <p className="text-xs text-ink-light mt-0.5">{selected.location}</p>
              )}
              <p className="text-sm font-bold text-forest mt-1">
                {selected.listing_type === "gi_bort" ? "🎁 Gratis" : `${selected.price.toLocaleString("nb-NO")} kr`}
              </p>
            </div>
          </div>
          <Link
            href={`/annonse/${selected.id}`}
            className="mt-3 block w-full rounded-lg bg-forest py-2 text-center text-xs font-semibold text-white hover:bg-forest-mid transition-colors"
          >
            Se annonse →
          </Link>
        </div>
      )}

      <p className="mt-2 text-xs text-ink-light text-right">
        {withCoords.length} annonse{withCoords.length !== 1 ? "r" : ""} med stedinfo ·{" "}
        <span className="inline-flex items-center gap-1">
          <span className="inline-block h-2 w-2 rounded-full bg-[#134e4a]" /> Til salgs
          <span className="inline-block h-2 w-2 rounded-full bg-green-600 ml-2" /> Gi bort
        </span>
      </p>
    </div>
  );
}
