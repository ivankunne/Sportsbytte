"use client";

import { useState, useEffect } from "react";
import type { Category } from "@/lib/queries";
import { supabase } from "@/lib/supabase";
import { showComingSoon } from "@/components/Toaster";

export default function SellPage() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedShipping, setSelectedShipping] = useState("bring");
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    supabase.from("categories").select("*").order("id").then(({ data }) => {
      if (data) setCategories(data);
    });
  }, []);

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 py-8 sm:py-12">
      <div className="text-center mb-10">
        <h1 className="font-display text-3xl sm:text-4xl font-bold text-ink">
          Selg utstyr
        </h1>
        <p className="mt-2 text-ink-mid">
          Nå hundrevis av sportsentusiaster i din klubb og på plattformen.
        </p>
      </div>

      <div className="space-y-10">
        {/* Step 1: Category */}
        <section>
          <div className="flex items-center gap-3 mb-5">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-forest text-white text-sm font-bold">
              1
            </span>
            <h2 className="font-display text-xl font-semibold text-ink">
              Velg kategori
            </h2>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {categories.map((cat) => (
              <button
                key={cat.slug}
                onClick={() => setSelectedCategory(cat.slug)}
                className={`flex items-center gap-3 rounded-xl p-4 text-left transition-all ${
                  selectedCategory === cat.slug
                    ? "bg-forest text-white ring-2 ring-forest ring-offset-2"
                    : "bg-white text-ink hover:bg-border"
                }`}
              >
                <span className="text-2xl">{cat.emoji}</span>
                <span className="text-sm font-medium">{cat.name}</span>
              </button>
            ))}
          </div>
        </section>

        {/* Step 2: Photos */}
        <section>
          <div className="flex items-center gap-3 mb-5">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-forest text-white text-sm font-bold">
              2
            </span>
            <h2 className="font-display text-xl font-semibold text-ink">
              Legg til bilder
            </h2>
          </div>

          {/* TODO MVP: Replace with real image upload to Supabase Storage */}
          <div className="rounded-xl border-2 border-dashed border-border bg-white p-8 text-center hover:border-forest/30 transition-colors duration-[120ms] cursor-pointer">
            <svg className="mx-auto h-12 w-12 text-ink-light" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.41a2.25 2.25 0 013.182 0l2.909 2.91m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
            </svg>
            <p className="mt-3 text-sm font-medium text-ink">
              Dra bilder hit eller klikk for å laste opp
            </p>
            <p className="mt-1 text-xs text-ink-light">
              Legg til opptil 8 bilder • Første bilde blir hovedbilde
            </p>
          </div>

          <div className="mt-3 grid grid-cols-4 gap-3">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="aspect-square rounded-lg border-2 border-dashed border-border bg-white flex items-center justify-center"
              >
                <svg className="h-6 w-6 text-border" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
              </div>
            ))}
          </div>
        </section>

        {/* Step 3: Details */}
        <section>
          <div className="flex items-center gap-3 mb-5">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-forest text-white text-sm font-bold">
              3
            </span>
            <h2 className="font-display text-xl font-semibold text-ink">
              Detaljer
            </h2>
          </div>

          <div className="space-y-5 bg-white rounded-xl p-6">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-ink mb-1.5">
                Tittel
              </label>
              <input
                id="title"
                type="text"
                placeholder='F.eks. "Salomon QST 106 ski — 180cm"'
                className="w-full rounded-lg border border-border px-4 py-2.5 text-sm text-ink placeholder:text-ink-light focus:outline-none focus:ring-2 focus:ring-forest/20 focus:border-forest"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label htmlFor="length" className="block text-sm font-medium text-ink mb-1.5">
                  Lengde (cm)
                </label>
                <input
                  id="length"
                  type="number"
                  placeholder="F.eks. 180"
                  className="w-full rounded-lg border border-border px-4 py-2.5 text-sm text-ink placeholder:text-ink-light focus:outline-none focus:ring-2 focus:ring-forest/20 focus:border-forest"
                />
              </div>
              <div>
                <label htmlFor="condition" className="block text-sm font-medium text-ink mb-1.5">
                  Stand
                </label>
                <select
                  id="condition"
                  className="w-full rounded-lg border border-border px-4 py-2.5 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-forest/20 focus:border-forest"
                >
                  <option value="">Velg stand</option>
                  <option>Som ny</option>
                  <option>Pent brukt</option>
                  <option>Godt brukt</option>
                  <option>Mye brukt</option>
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="wear" className="block text-sm font-medium text-ink mb-1.5">
                Nøyaktig stand
              </label>
              <textarea
                id="wear"
                rows={2}
                placeholder="Beskriv slitasje, reparasjoner..."
                className="w-full rounded-lg border border-border px-4 py-2.5 text-sm text-ink placeholder:text-ink-light focus:outline-none focus:ring-2 focus:ring-forest/20 focus:border-forest resize-none"
              />
            </div>

            <div>
              <label htmlFor="price" className="block text-sm font-medium text-ink mb-1.5">
                Pris (NOK)
              </label>
              <div className="relative">
                <input
                  id="price"
                  type="number"
                  placeholder="0"
                  className="w-full rounded-lg border border-border px-4 py-3 text-2xl font-bold text-forest placeholder:text-ink-light/40 focus:outline-none focus:ring-2 focus:ring-forest/20 focus:border-forest"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-lg text-ink-light">kr</span>
              </div>
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-ink mb-1.5">
                Beskrivelse
              </label>
              <textarea
                id="description"
                rows={4}
                placeholder="Beskriv utstyret, historikk, hva som er inkludert..."
                className="w-full rounded-lg border border-border px-4 py-2.5 text-sm text-ink placeholder:text-ink-light focus:outline-none focus:ring-2 focus:ring-forest/20 focus:border-forest resize-none"
              />
            </div>
          </div>
        </section>

        {/* Step 4: Shipping & Club */}
        <section>
          <div className="flex items-center gap-3 mb-5">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-forest text-white text-sm font-bold">
              4
            </span>
            <h2 className="font-display text-xl font-semibold text-ink">
              Frakt & klubb
            </h2>
          </div>

          <div className="space-y-5">
            {/* Club selection */}
            {/* TODO MVP: Replace with Supabase query for user's club memberships */}
            <div className="bg-white rounded-xl p-6">
              <label className="block text-sm font-medium text-ink mb-3">
                Velg din klubb
              </label>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-forest-light border-2 border-forest">
                <div className="h-10 w-10 rounded-full bg-forest flex items-center justify-center text-white text-xs font-bold">
                  BSK
                </div>
                <div className="flex-1">
                  <span className="font-medium text-ink text-sm">Bergen Skiklubb</span>
                  <p className="text-xs text-ink-light">
                    Annonsen vises på din klubbside og i søket
                  </p>
                </div>
                <svg className="h-5 w-5 text-forest" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                </svg>
              </div>
            </div>

            {/* Shipping options */}
            {/* TODO MVP: Replace with Bring Shipping Guide API integration
                See: https://developer.bring.com/api/shipping-guide_2/ */}
            <div className="bg-white rounded-xl p-6">
              <label className="block text-sm font-medium text-ink mb-3">
                Fraktvalg
              </label>
              <div className="space-y-3">
                {[
                  {
                    id: "bring",
                    label: "Bring pakke",
                    desc: "Fra 99 kr — label genereres automatisk",
                  },
                  {
                    id: "local",
                    label: "Hentes lokalt i Bergen",
                    desc: "Kjøper og selger avtaler sted",
                  },
                  {
                    id: "both",
                    label: "Begge deler",
                    desc: "La kjøper velge frakt eller henting",
                  },
                ].map((option) => (
                  <label
                    key={option.id}
                    className={`flex items-start gap-3 p-4 rounded-lg cursor-pointer transition-colors duration-[120ms] ${
                      selectedShipping === option.id
                        ? "bg-forest-light border-2 border-forest"
                        : "bg-cream border-2 border-transparent hover:border-border"
                    }`}
                  >
                    <input
                      type="radio"
                      name="shipping"
                      value={option.id}
                      checked={selectedShipping === option.id}
                      onChange={(e) => setSelectedShipping(e.target.value)}
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
          </div>
        </section>

        {/* Submit */}
        <div className="pt-2 pb-8">
          {/* TODO MVP: Replace with form submission to Supabase:
              await supabase.from('listings').insert({...formData, club_id, user_id})
              Then redirect to the new listing page */}
          <button
            type="button"
            onClick={() => showComingSoon("Publisering av annonser")}
            className="w-full rounded-lg bg-amber py-4 text-base font-bold text-white hover:brightness-92 transition-colors duration-[120ms]"
          >
            Publiser annonse
          </button>
          <p className="mt-4 text-center text-xs text-ink-light">
            Trygg betaling via Vipps • Bring frakt integrert • Klubbbeskyttelse
          </p>
        </div>
      </div>
    </div>
  );
}
