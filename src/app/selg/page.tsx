"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { Category, Club } from "@/lib/queries";
import { supabase } from "@/lib/supabase";
import { AuthForm } from "@/components/AuthForm";

type AuthPhase = "checking" | "auth" | "form";

type ListingType = "regular" | "iso" | "bulk";

const LISTING_TYPE_ICONS: Record<ListingType, React.ReactNode> = {
  regular: (
    <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6z" />
    </svg>
  ),
  iso: (
    <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 7.5v6M7.5 10.5h6" />
    </svg>
  ),
  bulk: (
    <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.429 9.75L2.25 12l4.179 2.25m0-4.5l5.571 3 5.571-3m-11.142 0L2.25 7.5 12 2.25l9.75 5.25-4.179 2.25m0 0L21.75 12l-4.179 2.25m0 0l4.179 2.25L12 21.75 2.25 16.5l4.179-2.25m11.142 0l-5.571 3-5.571-3" />
    </svg>
  ),
};

export default function SellPage() {
  const router = useRouter();
  const [authPhase, setAuthPhase] = useState<AuthPhase>("checking");

  const [listingType, setListingType] = useState<ListingType>("regular");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [deliveryMethod, setDeliveryMethod] = useState("both");
  const [categories, setCategories] = useState<Category[]>([]);
  const [userClub, setUserClub] = useState<Pick<Club, "id" | "name" | "color" | "initials"> | null>(null);
  const [selectedClubId, setSelectedClubId] = useState<number | null>(null);
  const [userProfileId, setUserProfileId] = useState<number | null>(null);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [error, setError] = useState<string>("");
  const [form, setForm] = useState({
    title: "",
    condition: "",
    wearDescription: "",
    price: "",
    description: "",
    quantity: "2",
    sizeRange: "",
    membersOnly: false,
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const categoryRef = useRef<HTMLElement>(null);
  const detailsRef = useRef<HTMLElement>(null);

  function scrollTo(ref: React.RefObject<HTMLElement | null>) {
    setTimeout(() => ref.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
  }

  // Check auth on mount
  useEffect(() => {
    async function checkAuth() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setAuthPhase("auth");
        return;
      }
      await prefillFromSession(session.user.id);
    }
    checkAuth();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function prefillFromSession(authUserId: string) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("id, club_id")
      .eq("auth_user_id", authUserId)
      .maybeSingle();

    if (profile) {
      setUserProfileId(profile.id);
      if (profile.club_id) {
        setSelectedClubId(profile.club_id);
        const { data: club } = await supabase
          .from("clubs")
          .select("id, name, color, initials")
          .eq("id", profile.club_id)
          .maybeSingle();
        if (club) setUserClub(club);
      }
    }
    setAuthPhase("form");
  }


  useEffect(() => {
    if (authPhase !== "form") return;
    supabase.from("categories").select("*").order("id").then(({ data: cats }) => {
      if (cats) setCategories(cats);
    });
  }, [authPhase]); // eslint-disable-line react-hooks/exhaustive-deps

  function handleImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const incoming = Array.from(e.target.files ?? []);
    const MAX_SIZE = 10 * 1024 * 1024;
    const ALLOWED = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/heic", "image/heif", "image/gif"];
    const tooBig = incoming.find((f) => f.size > MAX_SIZE);
    const wrongType = incoming.find((f) => !ALLOWED.includes(f.type.toLowerCase()));
    if (tooBig) { setError(`"${tooBig.name}" er for stor (maks 10 MB per bilde).`); e.target.value = ""; return; }
    if (wrongType) { setError(`"${wrongType.name}" har ugyldig format. Bruk JPG, PNG eller WebP.`); e.target.value = ""; return; }
    setError("");
    const combined = [...imageFiles, ...incoming].slice(0, 8);
    setImageFiles(combined);
    setImagePreviews(combined.map((f) => URL.createObjectURL(f)));
    // reset input so same file can be re-added after removal
    e.target.value = "";
  }

  function removeImage(index: number) {
    const newFiles = imageFiles.filter((_, i) => i !== index);
    setImageFiles(newFiles);
    setImagePreviews(newFiles.map((f) => URL.createObjectURL(f)));
  }

  async function uploadImages(): Promise<string[]> {
    if (imageFiles.length === 0) return [];
    const urls: string[] = [];
    for (const file of imageFiles) {
      const path = `${Date.now()}_${Math.random().toString(36).slice(2)}_${file.name}`;
      const { data, error: uploadErr } = await supabase.storage
        .from("listing-images")
        .upload(path, file);
      if (uploadErr) throw uploadErr;
      const { data: urlData } = supabase.storage
        .from("listing-images")
        .getPublicUrl(data.path);
      urls.push(urlData.publicUrl);
    }
    return urls;
  }

  async function handleSubmit() {
    setError("");

    if (!selectedCategory) return setError("Velg en kategori");
    if (!form.title.trim()) return setError("Skriv inn en tittel");
    if (listingType !== "iso" && !form.condition) return setError("Velg stand på utstyret");
    if (listingType !== "iso" && !form.price) return setError("Skriv inn pris");

    setSubmitting(true);
    try {
      setUploading(true);
      const imageUrls = await uploadImages();
      setUploading(false);

      const specs: Record<string, string> = {};
      if (form.condition) specs["Stand"] = form.condition;
      if (form.wearDescription) specs["Slitasje"] = form.wearDescription;
      if (listingType === "bulk" && form.quantity) specs["Antall"] = form.quantity;
      if (listingType === "bulk" && form.sizeRange) specs["Størrelser"] = form.sizeRange;

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Ikke innlogget");

      const res = await fetch("/api/create-listing", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          title: form.title.trim(),
          description: form.description.trim() || null,
          category: selectedCategory,
          condition: listingType === "iso" ? "Søker" : form.condition,
          price: parseInt(form.price || "0"),
          images: imageUrls,
          specs,
          club_id: selectedClubId,
          listing_type: listingType,
          members_only: form.membersOnly,
          quantity: listingType === "bulk" ? parseInt(form.quantity || "2") : null,
          size_range: listingType === "bulk" ? form.sizeRange || null : null,
          delivery_method: listingType === "iso" ? null : deliveryMethod,
          is_sold: false,
        }),
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error ?? "Noe gikk galt");
      router.push(`/annonse/${result.id}?published=1`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Noe gikk galt. Prøv igjen.");
      setSubmitting(false);
      setUploading(false);
    }
  }

  const isISO = listingType === "iso";
  const isBulk = listingType === "bulk";
  const step4Num = isISO ? "3" : "4";
  const step5Num = isISO ? "4" : "5";

  // ── Auth gate ──────────────────────────────────────────
  if (authPhase === "checking") {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 rounded-full border-2 border-forest border-t-transparent animate-spin" />
      </div>
    );
  }

  if (authPhase === "auth") {
    return (
      <div className="mx-auto max-w-sm px-4 py-16">
        <div className="text-center mb-8">
          <h1 className="font-display text-2xl font-bold text-ink">
            Logg inn for å selge
          </h1>
          <p className="mt-2 text-sm text-ink-light">
            Du må være innlogget for å legge ut annonser.
          </p>
        </div>
        <AuthForm onSuccess={({ authUserId }) => prefillFromSession(authUserId)} />
      </div>
    );
  }

  // ── Main form ───────────────────────────────────────────
  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 py-8 sm:py-12">
      <div className="text-center mb-10">
        <h1 className="font-display text-3xl sm:text-4xl font-bold text-ink">
          {isISO ? "Ettersøk utstyr" : "Selg utstyr"}
        </h1>
        <p className="mt-2 text-ink-mid">
          {isISO
            ? "Fortell hva du ser etter — la andre klubbmedlemmer finne det for deg."
            : "Nå hundrevis av sportsentusiaster i din klubb og på plattformen."}
        </p>
      </div>

      <div className="space-y-10">

        {/* Step 1: Listing type */}
        <section>
          <div className="flex items-center gap-3 mb-5">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-forest text-white text-sm font-bold">1</span>
            <h2 className="font-display text-xl font-semibold text-ink">Type annonse</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {([
              { id: "regular" as const, label: "Selg utstyr", desc: "Selg ett enkelt utstyr" },
              { id: "iso" as const, label: "Ettersøk (ISO)", desc: "Søker etter bestemt utstyr" },
              { id: "bulk" as const, label: "Massesalg", desc: "Selg lag-utstyr i bulk" },
            ]).map((type) => (
              <button
                key={type.id}
                onClick={() => { setListingType(type.id); scrollTo(categoryRef); }}
                className={`flex flex-col gap-2 rounded-xl p-4 text-left transition-all duration-[120ms] ${
                  listingType === type.id
                    ? "bg-forest text-white ring-2 ring-forest ring-offset-2"
                    : "bg-white text-ink hover:bg-border/60"
                }`}
              >
                <span className={listingType === type.id ? "text-white" : "text-ink-light"}>{LISTING_TYPE_ICONS[type.id]}</span>
                <span className="text-sm font-semibold">{type.label}</span>
                <span className={`text-xs leading-snug ${listingType === type.id ? "text-white/70" : "text-ink-light"}`}>
                  {type.desc}
                </span>
              </button>
            ))}
          </div>
        </section>

        {/* Step 2: Category */}
        <section ref={categoryRef}>
          <div className="flex items-center gap-3 mb-5">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-forest text-white text-sm font-bold">2</span>
            <h2 className="font-display text-xl font-semibold text-ink">Velg kategori</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {categories.map((cat) => (
              <button
                key={cat.slug}
                onClick={() => { setSelectedCategory(cat.name); scrollTo(detailsRef); }}
                className={`flex items-center gap-3 rounded-xl p-4 text-left transition-all duration-[120ms] ${
                  selectedCategory === cat.name
                    ? "bg-forest text-white ring-2 ring-forest ring-offset-2"
                    : "bg-white text-ink hover:bg-border/60"
                }`}
              >
                <span className="text-2xl">{cat.emoji}</span>
                <span className="text-sm font-medium">{cat.name}</span>
              </button>
            ))}
          </div>
        </section>

        {/* Step 3: Photos — skip for ISO */}
        {!isISO && (
          <section>
            <div className="flex items-center gap-3 mb-5">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-forest text-white text-sm font-bold">3</span>
              <h2 className="font-display text-xl font-semibold text-ink">Legg til bilder</h2>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handleImageSelect}
            />

            {imagePreviews.length === 0 ? (
              <div
                onClick={() => !uploading && fileInputRef.current?.click()}
                className={`rounded-xl border-2 border-dashed border-border bg-white p-8 text-center transition-colors duration-[120ms] ${uploading ? "opacity-50 cursor-not-allowed" : "hover:border-forest/30 cursor-pointer"}`}
              >
                <svg className="mx-auto h-12 w-12 text-ink-light" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.41a2.25 2.25 0 013.182 0l2.909 2.91m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                </svg>
                <p className="mt-3 text-sm font-medium text-ink">Dra bilder hit eller klikk for å laste opp</p>
                <p className="mt-1 text-xs text-ink-light">Opptil 8 bilder • Første bilde blir hovedbilde</p>
              </div>
            ) : (
              <div className="grid grid-cols-4 gap-3">
                {imagePreviews.map((src, i) => (
                  <div key={i} className="relative aspect-square rounded-lg overflow-hidden border border-border">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={src} alt="" className="w-full h-full object-cover" />
                    <button
                      onClick={() => removeImage(i)}
                      className="absolute top-1 right-1 h-5 w-5 rounded-full bg-ink/70 text-white flex items-center justify-center text-xs hover:bg-ink transition-colors"
                    >
                      ×
                    </button>
                    {i === 0 && (
                      <span className="absolute bottom-1 left-1 text-[10px] font-bold bg-forest text-white rounded px-1 py-0.5">
                        Hoved
                      </span>
                    )}
                  </div>
                ))}
                {imagePreviews.length < 8 && (
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="aspect-square rounded-lg border-2 border-dashed border-border bg-white flex items-center justify-center hover:border-forest/30 transition-colors duration-[120ms] disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <svg className="h-6 w-6 text-border" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                    </svg>
                  </button>
                )}
              </div>
            )}
          </section>
        )}

        {/* Step 4: Details */}
        <section ref={detailsRef}>
          <div className="flex items-center gap-3 mb-5">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-forest text-white text-sm font-bold">
              {step4Num}
            </span>
            <h2 className="font-display text-xl font-semibold text-ink">Detaljer</h2>
          </div>

          <div className="space-y-5 bg-white rounded-xl p-6">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-ink mb-1.5">
                {isISO ? "Hva ser du etter?" : "Tittel"}
              </label>
              <input
                id="title"
                type="text"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder={isISO
                  ? 'F.eks. "Slalom ski str 170–180 cm, dame"'
                  : 'F.eks. "Salomon QST 106 ski — 180 cm"'}
                className="w-full rounded-lg border border-border px-4 py-2.5 text-sm text-ink placeholder:text-ink-light focus:outline-none focus:ring-2 focus:ring-forest/20 focus:border-forest"
              />
            </div>

            {!isISO && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label htmlFor="condition" className="block text-sm font-medium text-ink mb-1.5">Stand</label>
                  <select
                    id="condition"
                    value={form.condition}
                    onChange={(e) => setForm({ ...form, condition: e.target.value })}
                    className="w-full rounded-lg border border-border px-4 py-2.5 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-forest/20 focus:border-forest"
                  >
                    <option value="">Velg stand</option>
                    <option>Som ny</option>
                    <option>Pent brukt</option>
                    <option>Godt brukt</option>
                    <option>Brukt</option>
                  </select>
                </div>
                {isBulk && (
                  <div>
                    <label htmlFor="quantity" className="block text-sm font-medium text-ink mb-1.5">Antall enheter</label>
                    <input
                      id="quantity"
                      type="number"
                      min="2"
                      value={form.quantity}
                      onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                      className="w-full rounded-lg border border-border px-4 py-2.5 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-forest/20 focus:border-forest"
                    />
                  </div>
                )}
              </div>
            )}

            {isBulk && (
              <div>
                <label htmlFor="sizeRange" className="block text-sm font-medium text-ink mb-1.5">
                  Størrelser tilgjengelig
                </label>
                <input
                  id="sizeRange"
                  type="text"
                  value={form.sizeRange}
                  onChange={(e) => setForm({ ...form, sizeRange: e.target.value })}
                  placeholder="F.eks. XS, S, M, L, XL eller 160–180 cm"
                  className="w-full rounded-lg border border-border px-4 py-2.5 text-sm text-ink placeholder:text-ink-light focus:outline-none focus:ring-2 focus:ring-forest/20 focus:border-forest"
                />
              </div>
            )}

            {!isISO && (
              <div>
                <label htmlFor="wear" className="block text-sm font-medium text-ink mb-1.5">Nøyaktig stand</label>
                <textarea
                  id="wear"
                  rows={2}
                  value={form.wearDescription}
                  onChange={(e) => setForm({ ...form, wearDescription: e.target.value })}
                  placeholder="Beskriv slitasje, reparasjoner, brukshistorikk..."
                  className="w-full rounded-lg border border-border px-4 py-2.5 text-sm text-ink placeholder:text-ink-light focus:outline-none focus:ring-2 focus:ring-forest/20 focus:border-forest resize-none"
                />
              </div>
            )}

            <div>
              <label htmlFor="price" className="block text-sm font-medium text-ink mb-1.5">
                {isISO ? "Budsjett / maks pris (valgfritt)" : isBulk ? "Pris per enhet (NOK)" : "Pris (NOK)"}
              </label>
              <div className="relative">
                <input
                  id="price"
                  type="number"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                  placeholder="0"
                  className="w-full rounded-lg border border-border px-4 py-3 text-2xl font-bold text-forest placeholder:text-ink-light/40 focus:outline-none focus:ring-2 focus:ring-forest/20 focus:border-forest"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-lg text-ink-light">kr</span>
              </div>
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-ink mb-1.5">
                {isISO ? "Mer info om hva du søker" : "Beskrivelse"}
              </label>
              <textarea
                id="description"
                rows={4}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder={
                  isISO
                    ? "Gi mer detaljer — størrelse, merke, formål, fleksibilitet på pris..."
                    : "Beskriv utstyret, historikk, hva som er inkludert..."
                }
                className="w-full rounded-lg border border-border px-4 py-2.5 text-sm text-ink placeholder:text-ink-light focus:outline-none focus:ring-2 focus:ring-forest/20 focus:border-forest resize-none"
              />
            </div>
          </div>
        </section>

        {/* Step 5: Club, profile & shipping */}
        <section>
          <div className="flex items-center gap-3 mb-5">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-forest text-white text-sm font-bold">
              {step5Num}
            </span>
            <h2 className="font-display text-xl font-semibold text-ink">Klubb & profil</h2>
          </div>

          <div className="space-y-5">
            {/* Club display */}
            {userClub ? (
              <div className="bg-white rounded-xl p-6">
                <label className="block text-sm font-medium text-ink mb-3">Publiser til klubb</label>
                {selectedClubId ? (
                  <>
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-forest-light border-2 border-forest">
                      <div
                        className="h-8 w-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                        style={{ backgroundColor: userClub.color }}
                      >
                        {userClub.initials}
                      </div>
                      <span className="font-medium text-ink text-sm flex-1">{userClub.name}</span>
                      <svg className="h-4 w-4 text-forest flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedClubId(null)}
                      className="mt-3 text-xs text-ink-light hover:text-ink underline"
                    >
                      Publiser kun på min profil (uten klubb)
                    </button>
                  </>
                ) : (
                  <>
                    <p className="text-sm text-ink-light mb-3">Annonsen publiseres kun på din profil.</p>
                    <button
                      type="button"
                      onClick={() => setSelectedClubId(userClub.id)}
                      className="flex items-center gap-3 p-3 rounded-lg bg-cream border-2 border-dashed border-border hover:border-forest/40 transition-colors duration-[120ms] w-full text-left"
                    >
                      <div
                        className="h-8 w-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 opacity-60"
                        style={{ backgroundColor: userClub.color }}
                      >
                        {userClub.initials}
                      </div>
                      <span className="text-sm text-ink-light">Legg til {userClub.name}</span>
                    </button>
                  </>
                )}
              </div>
            ) : (
              <div className="bg-white rounded-xl p-6">
                <label className="block text-sm font-medium text-ink mb-3">Publiser til</label>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-forest-light border-2 border-forest">
                  <div className="h-8 w-8 rounded-full bg-forest/10 flex items-center justify-center flex-shrink-0">
                    <svg className="h-4 w-4 text-forest" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                    </svg>
                  </div>
                  <span className="font-medium text-ink text-sm flex-1">Min profil</span>
                  <svg className="h-4 w-4 text-forest flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <p className="mt-3 text-xs text-ink-light">
                  Du er ikke med i noen klubb ennå — annonsen vises på din profil.{" "}
                  <Link href="/klubber" className="text-forest hover:underline">Bli med i en klubb</Link>
                  {" "}eller{" "}
                  <Link href="/registrer-klubb" className="text-forest hover:underline">registrer din klubb</Link>{" "}
                  for å nå enda flere.
                </p>
              </div>
            )}

            {/* Members only toggle */}
            <div className="bg-white rounded-xl p-6">
              <label className="flex items-center gap-4 cursor-pointer">
                <div className="relative flex-shrink-0">
                  <input
                    type="checkbox"
                    checked={form.membersOnly}
                    onChange={(e) => setForm({ ...form, membersOnly: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-10 h-6 bg-border rounded-full peer peer-checked:bg-forest transition-colors duration-[120ms]" />
                  <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full shadow transition-transform duration-[120ms] peer-checked:translate-x-4" />
                </div>
                <div>
                  <span className="text-sm font-medium text-ink">Kun for klubbmedlemmer</span>
                  <p className="text-xs text-ink-light mt-0.5">Annonsen vises bare for godkjente medlemmer av valgt klubb</p>
                </div>
              </label>
            </div>

            {/* Delivery method — skip for ISO */}
            {!isISO && (
              <div className="bg-white rounded-xl p-6">
                <label className="block text-sm font-medium text-ink mb-3">Leveringsmåte</label>
                <div className="space-y-3">
                  {[
                    { id: "pickup", label: "Hentes av kjøper", desc: "Avtal sted og tidspunkt direkte" },
                    { id: "shipping", label: "Kan sendes", desc: "Kjøper betaler frakt — avtal detaljer i meldinger" },
                    { id: "both", label: "Begge deler", desc: "Henting eller sending — avtal med kjøper" },
                  ].map((option) => (
                    <label
                      key={option.id}
                      className={`flex items-start gap-3 p-4 rounded-lg cursor-pointer transition-colors duration-[120ms] ${
                        deliveryMethod === option.id
                          ? "bg-forest-light border-2 border-forest"
                          : "bg-cream border-2 border-transparent hover:border-border"
                      }`}
                    >
                      <input
                        type="radio"
                        name="delivery"
                        value={option.id}
                        checked={deliveryMethod === option.id}
                        onChange={(e) => setDeliveryMethod(e.target.value)}
                        className="mt-0.5 accent-forest"
                      />
                      <div>
                        <span className="text-sm font-medium text-ink">{option.label}</span>
                        <p className="text-xs text-ink-light mt-0.5">{option.desc}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Submit */}
        <div className="pt-2 pb-8">
          {error && (
            <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting || uploading}
            className="w-full rounded-lg bg-amber py-4 text-base font-bold text-white hover:brightness-92 transition-all duration-[120ms] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {uploading
              ? "Laster opp bilder..."
              : submitting
              ? "Publiserer..."
              : isISO
              ? "Publiser ettersøk"
              : isBulk
              ? "Publiser massesalg"
              : "Publiser annonse"}
          </button>
          <p className="mt-4 text-center text-xs text-ink-light">
            Trygg kortbetaling • Selger og kjøper avtaler levering • Klubbbeskyttelse
          </p>
        </div>
      </div>
    </div>
  );
}
