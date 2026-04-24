import { createClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";
import type { Database } from "@/lib/database.types";

const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

type Resource = "club" | "profile" | "listing" | "registration" | "inquiry";
type Action = "delete" | "update";

const TABLE_MAP: Record<Resource, keyof Database["public"]["Tables"]> = {
  club: "clubs",
  profile: "profiles",
  listing: "listings",
  registration: "club_registrations",
  inquiry: "inquiries",
};

// Only these columns may be updated per resource — prevents arbitrary column injection
const COLUMN_ALLOWLIST: Record<Resource, string[]> = {
  club: ["name", "slug", "initials", "color", "secondary_color", "description", "logo_url", "is_membership_gated", "is_pro", "member_email_domain"],
  profile: ["name", "bio", "club_id", "total_sold"],
  listing: ["title", "price", "description", "is_sold", "condition", "category"],
  registration: ["status"],
  inquiry: ["status"],
};

function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

export async function POST(req: NextRequest) {
  // Verify admin secret — must match server-only ADMIN_SECRET env var
  const adminSecret = process.env.ADMIN_SECRET;
  if (!adminSecret) {
    console.error("ADMIN_SECRET env var not set");
    return NextResponse.json({ error: "Server misconfigured" }, { status: 503 });
  }
  if (req.headers.get("x-admin-secret") !== adminSecret) return unauthorized();

  let body: { resource: Resource; action: Action; id: number; data?: Record<string, unknown> };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Ugyldig JSON" }, { status: 400 });
  }

  const { resource, action, id, data } = body;

  if (!resource || !action || !id) {
    return NextResponse.json({ error: "Mangler resource, action eller id" }, { status: 400 });
  }

  const table = TABLE_MAP[resource];
  if (!table) {
    return NextResponse.json({ error: `Ukjent resource: ${resource}` }, { status: 400 });
  }

  if (action === "delete") {
    if (resource === "club") {
      const { error: profilesErr } = await supabase
        .from("profiles")
        .update({ club_id: null })
        .eq("club_id", id);
      if (profilesErr) return NextResponse.json({ error: "Intern feil" }, { status: 500 });
    }

    const { error } = await supabase.from(table).delete().eq("id", id);
    if (error) return NextResponse.json({ error: "Intern feil" }, { status: 500 });

    if (resource === "club") { revalidatePath("/klubber"); revalidatePath("/"); }
    else if (resource === "profile") { revalidatePath("/"); }
    else if (resource === "listing") { revalidatePath("/"); revalidatePath("/kjop"); }

    return NextResponse.json({ ok: true });
  }

  if (action === "update") {
    if (!data || Object.keys(data).length === 0) {
      return NextResponse.json({ error: "Ingen data å oppdatere" }, { status: 400 });
    }

    // Strip any columns not in the allowlist
    const allowed = COLUMN_ALLOWLIST[resource];
    const filtered = Object.fromEntries(
      Object.entries(data).filter(([key]) => allowed.includes(key))
    );
    if (Object.keys(filtered).length === 0) {
      return NextResponse.json({ error: "Ingen tillatte kolonner" }, { status: 400 });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await supabase.from(table).update(filtered as any).eq("id", id);
    if (error) return NextResponse.json({ error: "Intern feil" }, { status: 500 });

    if (resource === "club") { revalidatePath("/klubber"); revalidatePath("/"); }
    else if (resource === "profile") { revalidatePath("/"); }
    else if (resource === "listing") { revalidatePath("/"); revalidatePath("/kjop"); }

    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: `Ukjent action: ${action}` }, { status: 400 });
}
