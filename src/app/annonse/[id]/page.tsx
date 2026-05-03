import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { ListingDetail } from "./ListingDetail";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://sportsbytte.no";

type Props = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const { data } = await supabase
    .from("listings")
    .select("title, description, images, price, category, condition, clubs(name)")
    .eq("id", Number(id))
    .maybeSingle();

  if (!data) return { title: "Annonse ikke funnet" };

  const club = data.clubs as { name: string } | null;
  const firstImage = Array.isArray(data.images) && data.images.length > 0
    ? (data.images[0] as string)
    : null;

  const price = data.price.toLocaleString("nb-NO");
  const title = `${data.title} — ${price} kr`;

  const descParts = [data.condition, data.category, club?.name].filter(Boolean).join(" · ");
  const description = data.description
    ? `${data.description.slice(0, 155)} — ${descParts}`
    : `${descParts} · Kjøp trygt med kort på Sportsbytte`;

  const pageUrl = `/annonse/${id}`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: pageUrl,
      siteName: "Sportsbytte",
      locale: "nb_NO",
      type: "website",
      ...(firstImage
        ? { images: [{ url: firstImage, width: 1200, height: 900, alt: data.title }] }
        : {}),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      ...(firstImage ? { images: [firstImage] } : {}),
    },
  };
}

export default async function ListingPage({ params }: Props) {
  const { id } = await params;
  if (!/^\d+$/.test(id)) notFound();

  const { data } = await supabase
    .from("listings")
    .select("title, description, images, price, condition, profiles!listings_seller_id_fkey(name)")
    .eq("id", Number(id))
    .maybeSingle();

  const jsonLd = data
    ? {
        "@context": "https://schema.org",
        "@type": "Product",
        name: data.title,
        description: data.description ?? undefined,
        image: Array.isArray(data.images) && data.images.length > 0 ? data.images : undefined,
        offers: {
          "@type": "Offer",
          priceCurrency: "NOK",
          price: data.price,
          availability: "https://schema.org/InStock",
          url: `${SITE_URL}/annonse/${id}`,
          seller: {
            "@type": "Person",
            name: (data.profiles as { name: string } | null)?.name,
          },
        },
      }
    : null;

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Hjem", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: "Utforsk", item: `${SITE_URL}/utforsk` },
      { "@type": "ListItem", position: 3, name: data?.title ?? "Annonse", item: `${SITE_URL}/annonse/${id}` },
    ],
  };

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
      />
      <Suspense>
        <ListingDetail id={id} />
      </Suspense>
    </>
  );
}
