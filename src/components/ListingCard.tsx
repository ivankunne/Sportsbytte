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
              <span className="text-[13px] text-ink-light">{listing.profiles.name}</span>
            )}
          </div>
        </div>
      </article>
    </Link>
  );
}
