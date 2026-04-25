"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import type { ListingWithRelations } from "@/lib/queries";
import { formatDaysAgo, thumbnailUrl } from "@/lib/queries";

type Props = {
  listing: ListingWithRelations;
  showSeller?: boolean;
};

export function ListingCard({ listing }: Props) {
  const [saved, setSaved] = useState(false);
  const isSold = listing.is_sold;
  const seller = listing.profiles;
  const isBoosted =
    listing.is_boosted &&
    listing.boosted_until != null &&
    new Date(listing.boosted_until) > new Date();

  const nameParts = seller.name.trim().split(/\s+/);
  const displayName =
    nameParts.length > 1
      ? `${nameParts[0]} ${nameParts[nameParts.length - 1][0]}.`
      : nameParts[0];

  return (
    <Link href={`/annonse/${listing.id}`} className="group block h-full">
      <article
        className={`bg-white rounded-2xl border overflow-hidden transition-all duration-150 h-full flex flex-col ${
          isSold
            ? "border-border"
            : "border-border group-hover:border-forest group-hover:shadow-[0_4px_20px_rgba(0,0,0,0.10)]"
        }`}
      >
        {/* Image */}
        <div className="relative aspect-[4/3] bg-[#f0f0f0] overflow-hidden">
          <Image
            src={thumbnailUrl(listing)}
            alt={listing.title}
            fill
            className={`object-cover transition-transform duration-150 ${
              isSold ? "grayscale opacity-60" : "group-hover:scale-[1.04]"
            }`}
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />

          {/* Status badge */}
          <div className="absolute top-3 left-3 flex flex-col gap-1.5">
            {isSold ? (
              <span className="inline-flex items-center rounded-full bg-gray-200/90 px-3 py-1 text-xs font-semibold text-gray-400 backdrop-blur-sm">
                Solgt
              </span>
            ) : (
              <span className="inline-flex items-center rounded-full bg-forest px-3 py-1 text-xs font-semibold text-white shadow-sm">
                Til salgs
              </span>
            )}
            {isBoosted && !isSold && (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-400/90 px-3 py-1 text-xs font-semibold text-amber-900 backdrop-blur-sm shadow-sm">
                ★ Fremhevet
              </span>
            )}
          </div>

          {/* Heart */}
          <button
            className="absolute top-2.5 right-2.5 flex h-8 w-8 items-center justify-center rounded-full bg-white/80 backdrop-blur-sm transition-colors hover:bg-white"
            onClick={(e) => {
              e.preventDefault();
              setSaved((s) => !s);
            }}
            aria-label={saved ? "Fjern fra lagrede" : "Lagre annonse"}
          >
            <svg
              className={`h-4 w-4 transition-colors ${
                saved
                  ? "fill-rose-500 stroke-rose-500"
                  : isSold
                  ? "fill-none stroke-gray-300"
                  : "fill-none stroke-ink-light group-hover:stroke-ink"
              }`}
              viewBox="0 0 24 24"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z"
              />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className={`p-4 flex flex-col flex-1 ${isSold ? "opacity-50" : ""}`}>
          <h3 className="font-bold text-ink text-[15px] leading-snug line-clamp-2 mb-1">
            {listing.title}
          </h3>

          <p className="text-[17px] font-bold text-ink mb-2.5">
            kr {listing.price.toLocaleString("nb-NO")}
          </p>

          {/* Location + time */}
          <div className="flex items-center gap-1 text-xs text-ink-light mb-3">
            <svg
              className="h-3.5 w-3.5 flex-shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z"
              />
            </svg>
            <span>
              {listing.clubs.name} • {formatDaysAgo(listing.created_at)}
            </span>
          </div>

          {/* Seller row */}
          <div className="flex items-center justify-between border-t border-border pt-3 mt-auto">
            <div className="flex items-center gap-2">
              {seller.avatar_url ? (
                <Image
                  src={seller.avatar_url}
                  alt={seller.name}
                  width={24}
                  height={24}
                  className="h-6 w-6 rounded-full object-cover flex-shrink-0"
                />
              ) : (
                <div className="h-6 w-6 rounded-full bg-forest-light flex items-center justify-center text-forest text-[9px] font-bold flex-shrink-0">
                  {seller.avatar}
                </div>
              )}
              <span className="text-xs font-medium text-ink">{displayName}</span>
            </div>

            <span className="flex items-center gap-1 text-xs font-medium text-forest">
              <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z"
                  clipRule="evenodd"
                />
              </svg>
              Verifisert selger
            </span>
          </div>
        </div>
      </article>
    </Link>
  );
}
