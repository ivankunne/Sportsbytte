"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import type { Club } from "@/lib/queries";

export default function JoinViaInvitePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const router = useRouter();
  const [club, setClub] = useState<Club | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ name: "", email: "", message: "" });

  useEffect(() => {
    params.then(async ({ token }) => {
      const { data } = await supabase
        .from("clubs")
        .select("*")
        .eq("invite_token", token)
        .single();

      if (!data) {
        setNotFound(true);
      } else {
        setClub(data);
      }
      setLoading(false);
    });
  }, [params]);

  async function handleJoin(e: { preventDefault(): void }) {
    e.preventDefault();
    if (!club || !form.name.trim()) return setError("Skriv inn ditt navn");

    setSubmitting(true);
    setError("");

    try {
      // Find or create profile
      let profileId: number;
      const { data: existing } = await supabase
        .from("profiles")
        .select("id")
        .ilike("name", form.name.trim())
        .limit(1)
        .maybeSingle();

      if (existing) {
        profileId = existing.id;
      } else {
        const slug =
          form.name.trim().toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "") +
          "-" +
          Date.now();
        const { data: newProfile, error: profileErr } = await supabase
          .from("profiles")
          .insert({
            name: form.name.trim(),
            slug,
            avatar: form.name.trim().slice(0, 2).toUpperCase(),
            club_id: club.id,
          })
          .select("id")
          .single();
        if (profileErr) throw profileErr;
        profileId = newProfile.id;
      }

      // Invite link always auto-approves
      const { error: memberErr } = await supabase.from("memberships").upsert({
        club_id: club.id,
        profile_id: profileId,
        status: "approved",
        message: form.message.trim() || null,
      });
      if (memberErr) throw memberErr;

      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Noe gikk galt. Prøv igjen.");
    }
    setSubmitting(false);
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-forest border-r-transparent" />
      </div>
    );
  }

  if (notFound || !club) {
    return (
      <div className="mx-auto max-w-sm px-4 py-20 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-cream">
          <svg className="h-7 w-7 text-ink-light" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
          </svg>
        </div>
        <h1 className="font-display text-2xl font-bold text-ink">Ugyldig invitasjonslenke</h1>
        <p className="mt-2 text-sm text-ink-light">
          Denne lenken er ikke lenger aktiv. Kontakt klubben for en ny invitasjon.
        </p>
        <Link href="/" className="mt-6 inline-block text-sm font-semibold text-forest hover:underline">
          Tilbake til forsiden
        </Link>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="mx-auto max-w-sm px-4 py-20 text-center">
        <div
          className="mx-auto flex h-16 w-16 items-center justify-center rounded-full text-white text-xl font-bold mb-5"
          style={{ backgroundColor: club.color }}
        >
          {club.initials}
        </div>
        <h1 className="font-display text-2xl font-bold text-ink">Velkommen til {club.name}!</h1>
        <p className="mt-2 text-sm text-ink-mid">
          Du er nå registrert som medlem. Du kan se og legge ut annonser fra klubbsiden.
        </p>
        <div className="mt-8 flex flex-col gap-3">
          <Link
            href={`/klubb/${club.slug}`}
            className="rounded-lg bg-forest px-6 py-3 text-sm font-semibold text-white hover:bg-forest-mid transition-colors duration-[120ms] text-center"
          >
            Gå til {club.name}
          </Link>
          <Link
            href="/selg"
            className="rounded-lg border border-border px-6 py-3 text-sm font-medium text-ink hover:bg-cream transition-colors duration-[120ms] text-center"
          >
            Legg ut ditt første utstyr
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-sm px-4 py-16">
      {/* Club banner */}
      <div
        className="rounded-2xl px-8 py-10 text-center mb-8 relative overflow-hidden"
        style={{ backgroundColor: club.color }}
      >
        {club.is_pro && (
          <span className="absolute top-3 right-3 inline-flex items-center gap-1 rounded-full bg-amber px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white shadow">
            Pro
          </span>
        )}
        {club.is_pro && club.logo_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={club.logo_url}
            alt={club.name}
            className="mx-auto mb-4 h-24 w-24 rounded-full object-cover border-4 border-white/40 shadow-lg"
          />
        ) : (
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-white/20 text-white text-xl font-bold font-display border-2 border-white/30 mb-4">
            {club.initials}
          </div>
        )}
        <h1 className="font-display text-2xl font-bold text-white">{club.name}</h1>
        <p className="mt-1 text-sm text-white/75">
          {club.members.toLocaleString("nb-NO")} medlemmer
        </p>
        {club.description && (
          <p className="mt-2 text-sm text-white/80">{club.description}</p>
        )}
        {club.is_pro && (
          <p className="mt-3 text-xs text-white/60">
            Verifisert Pro-klubb på Sportsbytte
          </p>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-border p-8">
        <h2 className="font-display text-xl font-bold text-ink mb-1">Du er invitert!</h2>
        <p className="text-sm text-ink-light mb-6">
          Fyll inn navnet ditt for å bli med i {club.name} på Sportsbytte.
        </p>

        <form onSubmit={handleJoin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-ink mb-1.5">Ditt navn</label>
            <input
              type="text"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Fullt navn"
              className="w-full rounded-lg border border-border px-4 py-2.5 text-sm text-ink placeholder:text-ink-light focus:outline-none focus:ring-2 focus:ring-forest/20 focus:border-forest"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-ink mb-1.5">E-post (valgfritt)</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="din@epost.no"
              className="w-full rounded-lg border border-border px-4 py-2.5 text-sm text-ink placeholder:text-ink-light focus:outline-none focus:ring-2 focus:ring-forest/20 focus:border-forest"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-ink mb-1.5">
              Kort intro (valgfritt)
            </label>
            <textarea
              rows={2}
              value={form.message}
              onChange={(e) => setForm({ ...form, message: e.target.value })}
              placeholder="F.eks. hva du driver med i klubben..."
              className="w-full rounded-lg border border-border px-4 py-2.5 text-sm text-ink placeholder:text-ink-light focus:outline-none focus:ring-2 focus:ring-forest/20 focus:border-forest resize-none"
            />
          </div>
          {error && <p className="text-xs text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-lg py-3 text-sm font-semibold text-white hover:brightness-92 transition-all duration-[120ms] disabled:opacity-50"
            style={{ backgroundColor: club.color }}
          >
            {submitting ? "Registrerer..." : `Bli med i ${club.name}`}
          </button>
        </form>

        <p className="mt-4 text-center text-xs text-ink-light">
          Ved å bli med godtar du{" "}
          <Link href="/vilkar" className="text-forest hover:underline">
            vilkårene
          </Link>{" "}
          til Sportsbytte.
        </p>
      </div>
    </div>
  );
}
