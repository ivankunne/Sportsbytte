"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";

type RecentItem = {
  id: number;
  title: string;
  price: number;
  image: string;
  listing_type?: string;
};

export function RecentlyViewed() {
  const [items, setItems] = useState<RecentItem[]>([]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("recently_viewed");
      if (stored) setItems(JSON.parse(stored) as RecentItem[]);
    } catch {}
  }, []);

  if (items.length === 0) return null;

  return (
    <section className="mx-auto max-w-7xl px-6 sm:px-6 lg:px-12 py-8">
      <h2 className="font-display text-xl font-semibold text-ink mb-4">Sist sett</h2>
      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
        {items.map((item) => (
          <Link key={item.id} href={`/annonse/${item.id}`} className="flex-shrink-0 w-32 group">
            <div className="relative aspect-square rounded-xl overflow-hidden bg-cream mb-2 border border-border group-hover:border-forest transition-colors duration-[120ms]">
              {item.image ? (
                <Image
                  src={item.image}
                  alt={item.title}
                  fill
                  className="object-cover group-hover:scale-[1.04] transition-transform duration-150"
                  sizes="128px"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <svg className="h-8 w-8 text-border" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.41a2.25 2.25 0 013.182 0l2.909 2.91m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5z" />
                  </svg>
                </div>
              )}
            </div>
            <p className="text-xs font-semibold text-ink line-clamp-1 leading-snug">{item.title}</p>
            <p className="text-xs font-bold text-forest mt-0.5">
              {item.listing_type === "gi_bort" ? "Gratis" : `${item.price.toLocaleString("nb-NO")} kr`}
            </p>
          </Link>
        ))}
      </div>
    </section>
  );
}

export function saveRecentlyViewed(item: RecentItem) {
  try {
    const stored = localStorage.getItem("recently_viewed");
    const list: RecentItem[] = stored ? (JSON.parse(stored) as RecentItem[]) : [];
    const filtered = list.filter((i) => i.id !== item.id);
    const updated = [item, ...filtered].slice(0, 10);
    localStorage.setItem("recently_viewed", JSON.stringify(updated));
  } catch {}
}
