import { supabase } from "./supabase";
import type { Tables } from "./database.types";

// Re-export row types for convenience
export type Club = Tables<"clubs">;
export type Profile = Tables<"profiles">;
export type Listing = Tables<"listings">;
export type Category = Tables<"categories">;
export type Review = Tables<"reviews">;
export type Announcement = Tables<"announcements">;
export type Membership = Tables<"memberships">;
export type SavedSearch = Tables<"saved_searches">;

// Listing with joined club and seller data
export type ListingWithRelations = Listing & {
  clubs: Club;
  profiles: Profile;
};

// Profile with joined club
export type ProfileWithClub = Profile & {
  clubs: Club | null;
};

function daysAgo(dateStr: string): number {
  const diff = Date.now() - new Date(dateStr).getTime();
  return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
}

export function formatDaysAgo(dateStr: string): string {
  const d = daysAgo(dateStr);
  if (d === 0) return "I dag";
  if (d === 1) return "1 dag siden";
  return `${d} dager siden`;
}

export function thumbnailUrl(listing: Listing): string {
  return listing.images?.[0] ?? "/placeholder-listing.svg";
}

// ─── Clubs ──────────────────────────────────────────────

export async function getAllClubs(): Promise<Club[]> {
  const { data, error } = await supabase
    .from("clubs")
    .select("*")
    .order("members", { ascending: false });
  if (error) throw error;
  // Pro clubs first (graceful: falls back if is_pro not yet in DB)
  return [...data].sort((a, b) => {
    const aP = (a as Club).is_pro ?? false;
    const bP = (b as Club).is_pro ?? false;
    return aP === bP ? 0 : aP ? -1 : 1;
  });
}

export async function getClubBySlug(slug: string): Promise<Club | null> {
  const { data, error } = await supabase
    .from("clubs")
    .select("*")
    .eq("slug", slug)
    .single();
  if (error && error.code !== "PGRST116") throw error;
  return data;
}

// ─── Categories ─────────────────────────────────────────

export async function getAllCategories(): Promise<Category[]> {
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .order("id");
  if (error) throw error;
  return data;
}

// Sold listings stay visible for 5 days, then disappear from browse/search
function soldVisibilityFilter() {
  const cutoff = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString();
  return `is_sold.eq.false,and(is_sold.eq.true,updated_at.gt.${cutoff})`;
}

// ─── Listings ───────────────────────────────────────────

export async function getFeaturedListings(
  limit = 6
): Promise<ListingWithRelations[]> {
  const { data, error } = await supabase
    .from("listings")
    .select("*, clubs(*), profiles(*)")
    .or(soldVisibilityFilter())
    .order("is_boosted", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data as ListingWithRelations[];
}

export async function getAllListings(): Promise<ListingWithRelations[]> {
  const { data, error } = await supabase
    .from("listings")
    .select("*, clubs(*), profiles(*)")
    .or(soldVisibilityFilter())
    .order("is_boosted", { ascending: false })
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data as ListingWithRelations[];
}

export async function getListingsByClub(
  clubId: number
): Promise<ListingWithRelations[]> {
  const { data, error } = await supabase
    .from("listings")
    .select("*, clubs(*), profiles(*)")
    .eq("club_id", clubId)
    .or(soldVisibilityFilter())
    .order("is_boosted", { ascending: false })
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data as ListingWithRelations[];
}

export async function getListingById(
  id: number
): Promise<ListingWithRelations | null> {
  const { data, error } = await supabase
    .from("listings")
    .select("*, clubs(*), profiles(*)")
    .eq("id", id)
    .single();
  if (error && error.code !== "PGRST116") throw error;
  return data as ListingWithRelations | null;
}

export async function getListingsBySeller(
  sellerId: number,
  excludeId?: number
): Promise<ListingWithRelations[]> {
  let query = supabase
    .from("listings")
    .select("*, clubs(*), profiles(*)")
    .eq("seller_id", sellerId)
    .or(soldVisibilityFilter())
    .order("created_at", { ascending: false });

  if (excludeId) query = query.neq("id", excludeId);

  const { data, error } = await query;
  if (error) throw error;
  return data as ListingWithRelations[];
}

// ─── Profiles ───────────────────────────────────────────

export async function getProfileBySlug(
  slug: string
): Promise<ProfileWithClub | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("*, clubs(*)")
    .eq("slug", slug)
    .single();
  if (error && error.code !== "PGRST116") throw error;
  return data as ProfileWithClub | null;
}

export async function getProfilesByClub(
  clubId: number
): Promise<Profile[]> {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("club_id", clubId)
    .order("total_sold", { ascending: false })
    .limit(5);
  if (error) throw error;
  return data;
}

export async function getAllProfileSlugs(): Promise<string[]> {
  const { data, error } = await supabase
    .from("profiles")
    .select("slug");
  if (error) throw error;
  return data.map((p) => p.slug);
}

// ─── Reviews ────────────────────────────────────────────

export async function getReviewsByProfile(
  profileId: number
): Promise<Review[]> {
  const { data, error } = await supabase
    .from("reviews")
    .select("*")
    .eq("profile_id", profileId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

// ─── Search ─────────────────────────────────────────────

export type SearchResults = {
  listings: ListingWithRelations[];
  clubs: Club[];
  profiles: ProfileWithClub[];
  categories: Category[];
};

export async function searchAll(query: string): Promise<SearchResults> {
  const q = query.trim();
  if (!q) return { listings: [], clubs: [], profiles: [], categories: [] };

  const pattern = `%${q}%`;

  const [listingsRes, clubsRes, profilesRes, categoriesRes] =
    await Promise.all([
      supabase
        .from("listings")
        .select("*, clubs(*), profiles(*)")
        .or(soldVisibilityFilter())
        .or(`title.ilike.${pattern},category.ilike.${pattern},description.ilike.${pattern}`)
        .order("created_at", { ascending: false })
        .limit(20),
      supabase
        .from("clubs")
        .select("*")
        .ilike("name", pattern)
        .order("members", { ascending: false })
        .limit(10),
      supabase
        .from("profiles")
        .select("*, clubs(*)")
        .or(`name.ilike.${pattern},bio.ilike.${pattern}`)
        .order("total_sold", { ascending: false })
        .limit(10),
      supabase
        .from("categories")
        .select("*")
        .ilike("name", pattern)
        .limit(6),
    ]);

  return {
    listings: (listingsRes.data ?? []) as ListingWithRelations[],
    clubs: clubsRes.data ?? [],
    profiles: (profilesRes.data ?? []) as ProfileWithClub[],
    categories: categoriesRes.data ?? [],
  };
}

// ─── Announcements ──────────────────────────────────────

export async function getAnnouncementsByClub(clubId: number): Promise<Announcement[]> {
  const { data, error } = await supabase
    .from("announcements")
    .select("*")
    .eq("club_id", clubId)
    .order("created_at", { ascending: false })
    .limit(10);
  if (error) return []; // table may not exist yet — fail gracefully
  return data;
}

export async function createAnnouncement(
  clubId: number,
  title: string,
  body: string,
  type: string,
  authorName?: string
): Promise<Announcement> {
  const { data, error } = await supabase
    .from("announcements")
    .insert({ club_id: clubId, title, body, type, author_name: authorName ?? null })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteAnnouncement(id: number): Promise<void> {
  const { error } = await supabase.from("announcements").delete().eq("id", id);
  if (error) throw error;
}

// ─── Memberships ─────────────────────────────────────────

export type MembershipWithProfile = Membership & { profiles: Profile };

export async function getMembershipsByClub(
  clubId: number,
  status?: string
): Promise<MembershipWithProfile[]> {
  let q = supabase
    .from("memberships")
    .select("*, profiles(*)")
    .eq("club_id", clubId)
    .order("created_at", { ascending: false });
  if (status) q = q.eq("status", status);
  const { data, error } = await q;
  if (error) throw error;
  return data as MembershipWithProfile[];
}

export async function createMembershipRequest(
  clubId: number,
  name: string,
  message?: string,
  status: "pending" | "approved" = "pending"
): Promise<void> {
  // Find or create a profile by name for MVP (no real auth yet)
  let { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .ilike("name", name.trim())
    .limit(1)
    .single();

  if (!profile) {
    const slug = name.trim().toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
    const { data: newProfile, error } = await supabase
      .from("profiles")
      .insert({ name: name.trim(), slug: `${slug}-${Date.now()}`, avatar: name.trim().slice(0, 2).toUpperCase() })
      .select("id")
      .single();
    if (error) throw error;
    profile = newProfile;
  }

  const { error } = await supabase.from("memberships").upsert({
    club_id: clubId,
    profile_id: profile.id,
    message: message ?? null,
    status,
  });
  if (error) throw error;
}

export async function updateMembershipStatus(
  id: number,
  status: "approved" | "rejected"
): Promise<void> {
  const { error } = await supabase
    .from("memberships")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;
}

// ─── Saved Searches ──────────────────────────────────────

export async function createSavedSearch(params: {
  notifyEmail: string;
  keywords?: string;
  category?: string;
  maxPrice?: number;
  sizeHint?: string;
  clubId?: number;
}): Promise<void> {
  const { error } = await supabase.from("saved_searches").insert({
    notify_email: params.notifyEmail,
    keywords: params.keywords ?? null,
    category: params.category ?? null,
    max_price: params.maxPrice ?? null,
    size_hint: params.sizeHint ?? null,
    club_id: params.clubId ?? null,
  });
  if (error) throw error;
}

// ─── Search ─────────────────────────────────────────────

export async function searchListings(
  query?: string,
  category?: string,
  sort?: string,
  clubId?: number
): Promise<ListingWithRelations[]> {
  let q = supabase
    .from("listings")
    .select("*, clubs(*), profiles(*)")
    .or(soldVisibilityFilter());

  if (clubId) q = q.eq("club_id", clubId);

  if (query?.trim()) {
    const pattern = `%${query.trim()}%`;
    q = q.or(`title.ilike.${pattern},description.ilike.${pattern}`);
  }

  if (category) q = q.ilike("category", `%${category}%`);

  q = q.order("is_boosted", { ascending: false });

  switch (sort) {
    case "pris-lav":
      q = q.order("price", { ascending: true });
      break;
    case "pris-hoy":
      q = q.order("price", { ascending: false });
      break;
    default:
      q = q.order("created_at", { ascending: false });
  }

  const { data, error } = await q;
  if (error) throw error;
  return data as ListingWithRelations[];
}
