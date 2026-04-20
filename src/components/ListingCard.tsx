import Image from "next/image";
import Link from "next/link";
import type { ListingWithRelations } from "@/lib/queries";
import { formatDaysAgo, thumbnailUrl } from "@/lib/queries";
import { ConditionBadge } from "./ConditionBadge";
import { CategoryBadge } from "./CategoryBadge";
import { ClubBadge } from "./ClubBadge";

type Props = {
  listing: ListingWithRelations;
  showSeller?: boolean;
};

export function ListingCard({ listing, showSeller = false }: Props) {
  return (
    <Link href={`/annonse/${listing.id}`} className="group block">
      <article className="bg-white rounded-xl border border-border overflow-hidden transition-all duration-[120ms] ease-out group-hover:-translate-y-0.5 group-hover:shadow-[0_4px_16px_rgba(0,0,0,0.08)]">
        <div className="relative aspect-[4/3] overflow-hidden">
          <Image
            src={thumbnailUrl(listing)}
            alt={listing.title}
            fill
            className="object-cover transition-transform duration-[120ms] ease-out group-hover:scale-[1.02]"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
          <div className="absolute top-3 left-3">
            <CategoryBadge category={listing.category} />
          </div>
          <div className="absolute top-3 right-3">
            <ConditionBadge condition={listing.condition} />
          </div>
        </div>

        <div className="p-4">
          <h3 className="font-display font-semibold text-ink text-sm leading-snug line-clamp-2 mb-2">
            {listing.title}
          </h3>

          <div className="flex items-center justify-between">
            <span className="text-lg font-bold font-display text-forest">
              {listing.price.toLocaleString("nb-NO")} kr
            </span>
            <span className="text-[13px] text-ink-light">
              {formatDaysAgo(listing.created_at)}
            </span>
          </div>

          <div className="mt-3 flex items-center justify-between">
            <ClubBadge club={listing.clubs.name} />
            {showSeller && (
              <span className="flex items-center gap-1 text-[13px] text-ink-light">
                {listing.profiles.rating > 0 && (
                  <>
                    <svg className="h-3 w-3 text-amber" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    {listing.profiles.rating.toFixed(1)}
                  </>
                )}
                {listing.profiles.name}
              </span>
            )}
          </div>
        </div>
      </article>
    </Link>
  );
}
