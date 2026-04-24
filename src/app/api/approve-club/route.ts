import { createClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";
import type { Database } from "@/lib/database.types";

const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  const adminSecret = process.env.ADMIN_SECRET;
  if (!adminSecret) {
    console.error("ADMIN_SECRET env var not set");
    return NextResponse.json({ error: "Server misconfigured" }, { status: 503 });
  }
  if (req.headers.get("x-admin-secret") !== adminSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let reg: Record<string, unknown>;
  try {
    reg = await req.json();
  } catch {
    return NextResponse.json({ error: "Ugyldig JSON" }, { status: 400 });
  }

  // Validate required fields
  if (typeof reg.club_name !== "string" || !reg.club_name.trim()) {
    return NextResponse.json({ error: "Mangler klubbnavn" }, { status: 400 });
  }

  const clubName = String(reg.club_name).trim().slice(0, 120);
  const description = reg.description ? String(reg.description).slice(0, 1000) : null;

  // Validate logo_url is a safe https URL or null
  let logoUrl: string | null = null;
  if (reg.logo_url && typeof reg.logo_url === "string") {
    try {
      const u = new URL(reg.logo_url);
      if (u.protocol === "https:") logoUrl = reg.logo_url;
    } catch {
      // invalid URL — ignore
    }
  }

  // Validate color is a hex color
  const hexPattern = /^#[0-9a-fA-F]{6}$/;
  const color = typeof reg.primary_color === "string" && hexPattern.test(reg.primary_color)
    ? reg.primary_color
    : "#1a3c2e";
  const secondaryColor = typeof reg.secondary_color === "string" && hexPattern.test(reg.secondary_color)
    ? reg.secondary_color
    : null;

  const slug =
    clubName
      .toLowerCase()
      .replace(/æ/g, "ae").replace(/ø/g, "o").replace(/å/g, "a")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") +
    "-" +
    Math.random().toString(36).slice(2, 6);

  const initials = clubName
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const { error } = await supabase.from("clubs").insert({
    name: clubName,
    slug,
    initials,
    color,
    secondary_color: secondaryColor,
    description,
    logo_url: logoUrl,
    invite_token: crypto.randomUUID(),
  });

  if (error) {
    return NextResponse.json({ error: "Intern feil" }, { status: 500 });
  }

  revalidatePath("/klubber");
  revalidatePath("/");

  return NextResponse.json({ ok: true, slug });
}
