"use client";

import { useEffect, useRef, useState } from "react";
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
  category: string;
  listing_type: string | null;
};

export function KartView() {
  const mapRef = useRef<HTMLDivElement>(null);
  const [listings, setListings] = useState<MapListing[]>([]);
  const [selected, setSelected] = useState<MapListing | null>(null);
  const [loading, setLoading] = useState(true);
  const mapInstanceRef = useRef<import("leaflet").Map | null>(null);
  const markersRef = useRef<import("leaflet").Marker[]>([]);

  useEffect(() => {
    supabase
      .from("listings")
      .select("id, title, price, location, lat, lng, images, category, listing_type")
      .eq("is_sold", false)
      .not("lat", "is", null)
      .not("lng", "is", null)
      .limit(200)
      .then(({ data }) => {
        setListings((data ?? []) as MapListing[]);
        setLoading(false);
      }, () => setLoading(false));
  }, []);

  useEffect(() => {
    if (loading || !mapRef.current || mapInstanceRef.current) return;

    let L: typeof import("leaflet");
    import("leaflet").then((mod) => {
      L = mod.default ?? mod;

      // Fix default icon paths for Next.js
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });

      const map = L.map(mapRef.current!, {
        center: [63.4, 10.4],
        zoom: 5,
        zoomControl: true,
      });

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map);

      mapInstanceRef.current = map;

      const validListings = listings.filter((l) => l.lat && l.lng);
      const markers = validListings.map((l) => {
        const marker = L.marker([l.lat!, l.lng!]).addTo(map);
        marker.on("click", () => setSelected(l));
        return marker;
      });
      markersRef.current = markers;

      if (validListings.length > 0) {
        const bounds = L.latLngBounds(validListings.map((l) => [l.lat!, l.lng!]));
        map.fitBounds(bounds, { padding: [40, 40], maxZoom: 10 });
      }
    });

    return () => {
      mapInstanceRef.current?.remove();
      mapInstanceRef.current = null;
      markersRef.current = [];
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[600px] rounded-xl bg-white border border-border">
        <div className="h-8 w-8 rounded-full border-2 border-forest border-t-transparent animate-spin" />
      </div>
    );
  }

  const withCoords = listings.filter((l) => l.lat && l.lng);

  return (
    <div className="relative">
      <link
        rel="stylesheet"
        href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        crossOrigin={"" as any}
      />
      <div ref={mapRef} className="h-[600px] w-full rounded-xl border border-border overflow-hidden z-0" />

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
              <p className="text-xs text-ink-light mt-0.5">{selected.location}</p>
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
        {withCoords.length} annonse{withCoords.length !== 1 ? "r" : ""} med stedinfo
      </p>
    </div>
  );
}
