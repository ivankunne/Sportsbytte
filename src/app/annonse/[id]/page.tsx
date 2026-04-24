import type { Metadata } from "next";
import { supabase } from "@/lib/supabase";
import { ListingDetail } from "./ListingDetail";

type Props = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const { data } = await supabase
    .from("listings")
    .select("title, description, images, price, category, condition, clubs(name)")
    .eq("id", Number(id))
    .single();

  if (!data) return { title: "Annonse ikke funnet" };

  const club = data.clubs as { name: string } | null;
  const firstImage = Array.isArray(data.images) && data.images.length > 0
    ? (data.images[0] as string)
    : null;

  const price = data.price.toLocaleString("nb-NO");
  const title = `${data.title} — ${price} kr`;

  // Rich description: condition · category · club · site name
  const descParts = [data.condition, data.category, club?.name].filter(Boolean).join(" · ");
  const description = data.description
    ? `${data.description.slice(0, 120)} — ${descParts}`
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
  return <ListingDetail id={id} />;
}
