"use client";

import { useState } from "react";
import Link from "next/link";
import { showComingSoon } from "@/components/Toaster";

// TODO MVP: Replace with:
// 1. Auth check — user must be logged in
// 2. await supabase.from('clubs').insert({...formData})
// 3. Stripe subscription creation for club plan

export default function RegisterClubPage() {
  const [step, setStep] = useState(1);

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-10 sm:py-16">
      <div className="text-center mb-12">
        <span className="text-xs font-bold text-amber uppercase tracking-wider">
          Kom i gang gratis
        </span>
        <h1 className="mt-2 font-display text-3xl sm:text-4xl font-bold text-ink">
          Registrer din klubb
        </h1>
        <p className="mt-3 text-ink-mid max-w-lg mx-auto">
          Gi klubbens medlemmer en egen markedsplass for brukt utstyr. Gratis
          å sette opp, ingen bindingstid.
        </p>
      </div>

      {/* Progress steps */}
      <div className="flex items-center justify-center gap-4 mb-10">
        {[
          { n: 1, label: "Klubbinfo" },
          { n: 2, label: "Kontaktperson" },
          { n: 3, label: "Tilpass" },
        ].map(({ n, label }) => (
          <button
            key={n}
            onClick={() => setStep(n)}
            className="flex items-center gap-2"
          >
            <span
              className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold transition-colors duration-[120ms] ${
                step >= n
                  ? "bg-forest text-white"
                  : "bg-border text-ink-light"
              }`}
            >
              {n}
            </span>
            <span
              className={`text-sm font-medium hidden sm:block ${
                step >= n ? "text-ink" : "text-ink-light"
              }`}
            >
              {label}
            </span>
            {n < 3 && (
              <div className="w-12 h-px bg-border mx-2 hidden sm:block" />
            )}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-border">
        {step === 1 && (
          <div className="space-y-5">
            <h2 className="font-display text-xl font-semibold text-ink mb-6">
              Om klubben
            </h2>
            <div>
              <label htmlFor="club-name" className="block text-sm font-medium text-ink mb-1.5">
                Klubbnavn *
              </label>
              <input
                id="club-name"
                type="text"
                placeholder="F.eks. Bergen Skiklubb"
                className="w-full rounded-lg border border-border px-4 py-2.5 text-sm text-ink placeholder:text-ink-light focus:outline-none focus:ring-2 focus:ring-forest/20 focus:border-forest"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label htmlFor="sport" className="block text-sm font-medium text-ink mb-1.5">
                  Idrett / Aktivitet *
                </label>
                <select
                  id="sport"
                  className="w-full rounded-lg border border-border px-4 py-2.5 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-forest/20 focus:border-forest"
                >
                  <option value="">Velg aktivitet</option>
                  <option>Ski / Alpint</option>
                  <option>Klatring</option>
                  <option>Sykkel</option>
                  <option>Løping</option>
                  <option>Friluftsliv</option>
                  <option>Fotball</option>
                  <option>Håndball</option>
                  <option>Annet</option>
                </select>
              </div>
              <div>
                <label htmlFor="location" className="block text-sm font-medium text-ink mb-1.5">
                  Sted *
                </label>
                <input
                  id="location"
                  type="text"
                  placeholder="F.eks. Bergen"
                  className="w-full rounded-lg border border-border px-4 py-2.5 text-sm text-ink placeholder:text-ink-light focus:outline-none focus:ring-2 focus:ring-forest/20 focus:border-forest"
                />
              </div>
            </div>
            <div>
              <label htmlFor="members" className="block text-sm font-medium text-ink mb-1.5">
                Ca. antall medlemmer
              </label>
              <select
                id="members"
                className="w-full rounded-lg border border-border px-4 py-2.5 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-forest/20 focus:border-forest"
              >
                <option value="">Velg</option>
                <option>Under 100</option>
                <option>100–300</option>
                <option>300–500</option>
                <option>500–1000</option>
                <option>Over 1000</option>
              </select>
            </div>
            <div>
              <label htmlFor="org-number" className="block text-sm font-medium text-ink mb-1.5">
                Organisasjonsnummer (valgfritt)
              </label>
              <input
                id="org-number"
                type="text"
                placeholder="9 siffer fra Brønnøysundregistrene"
                className="w-full rounded-lg border border-border px-4 py-2.5 text-sm text-ink placeholder:text-ink-light focus:outline-none focus:ring-2 focus:ring-forest/20 focus:border-forest"
              />
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-5">
            <h2 className="font-display text-xl font-semibold text-ink mb-6">
              Kontaktperson
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label htmlFor="first-name" className="block text-sm font-medium text-ink mb-1.5">
                  Fornavn *
                </label>
                <input id="first-name" type="text" className="w-full rounded-lg border border-border px-4 py-2.5 text-sm text-ink placeholder:text-ink-light focus:outline-none focus:ring-2 focus:ring-forest/20 focus:border-forest" />
              </div>
              <div>
                <label htmlFor="last-name" className="block text-sm font-medium text-ink mb-1.5">
                  Etternavn *
                </label>
                <input id="last-name" type="text" className="w-full rounded-lg border border-border px-4 py-2.5 text-sm text-ink placeholder:text-ink-light focus:outline-none focus:ring-2 focus:ring-forest/20 focus:border-forest" />
              </div>
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-ink mb-1.5">
                E-post *
              </label>
              <input id="email" type="email" placeholder="din@epost.no" className="w-full rounded-lg border border-border px-4 py-2.5 text-sm text-ink placeholder:text-ink-light focus:outline-none focus:ring-2 focus:ring-forest/20 focus:border-forest" />
            </div>
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-ink mb-1.5">
                Telefon
              </label>
              <input id="phone" type="tel" placeholder="+47" className="w-full rounded-lg border border-border px-4 py-2.5 text-sm text-ink placeholder:text-ink-light focus:outline-none focus:ring-2 focus:ring-forest/20 focus:border-forest" />
            </div>
            <div>
              <label htmlFor="role" className="block text-sm font-medium text-ink mb-1.5">
                Din rolle i klubben
              </label>
              <select id="role" className="w-full rounded-lg border border-border px-4 py-2.5 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-forest/20 focus:border-forest">
                <option value="">Velg rolle</option>
                <option>Lagleder / Styreleder</option>
                <option>Trener</option>
                <option>Styremedlem</option>
                <option>Frivillig</option>
                <option>Medlem</option>
              </select>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-5">
            <h2 className="font-display text-xl font-semibold text-ink mb-6">
              Tilpass klubbsiden
            </h2>
            <div>
              <label className="block text-sm font-medium text-ink mb-3">
                Klubblogo
              </label>
              <div className="rounded-xl border-2 border-dashed border-border bg-cream/50 p-8 text-center">
                <div className="mx-auto h-20 w-20 rounded-full bg-border flex items-center justify-center mb-3">
                  <svg className="h-8 w-8 text-ink-light" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.41a2.25 2.25 0 013.182 0l2.909 2.91m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                  </svg>
                </div>
                <p className="text-sm text-ink-light">Last opp logo (PNG eller SVG)</p>
              </div>
            </div>
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-ink mb-1.5">
                Kort beskrivelse av klubben
              </label>
              <textarea
                id="description"
                rows={3}
                placeholder="Fortell litt om klubben, aktiviteter, og hvorfor dere vil bruke Sportsbyttet..."
                className="w-full rounded-lg border border-border px-4 py-2.5 text-sm text-ink placeholder:text-ink-light focus:outline-none focus:ring-2 focus:ring-forest/20 focus:border-forest resize-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-ink mb-3">Klubbfarger</label>
              <div className="flex gap-3">
                {["#1a3c2e", "#1e3a5c", "#5c1e2e", "#5c3d1e", "#8B0000", "#2d2d2d"].map((color) => (
                  <button
                    key={color}
                    className="h-10 w-10 rounded-full border-2 border-white shadow-sm ring-2 ring-transparent hover:ring-forest/30 transition-all"
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between mt-8 pt-6 border-t border-border">
          {step > 1 ? (
            <button
              onClick={() => setStep(step - 1)}
              className="text-sm font-medium text-ink-light hover:text-ink transition-colors duration-[120ms]"
            >
              ← Tilbake
            </button>
          ) : (
            <div />
          )}

          {step < 3 ? (
            <button
              onClick={() => setStep(step + 1)}
              className="rounded-lg bg-forest px-7 py-2.5 text-sm font-semibold text-white hover:bg-forest-mid transition-colors duration-[120ms]"
            >
              Neste steg →
            </button>
          ) : (
            <button
              type="button"
              onClick={() => showComingSoon("Klubbregistrering")}
              className="rounded-lg bg-amber px-7 py-2.5 text-sm font-bold text-white hover:brightness-92 transition-colors duration-[120ms]"
            >
              Registrer klubben
            </button>
          )}
        </div>
      </div>

      {/* Benefits */}
      <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-6">
        {[
          { title: "Gratis oppstart", desc: "Ingen kostnad for å sette opp klubbsiden. Betal kun for premium-funksjoner." },
          { title: "Klar på minutter", desc: "Vi setter opp alt. Del lenken med medlemmene og kom i gang med en gang." },
          { title: "Støtte hele veien", desc: "Dedikert kontaktperson hjelper deg med oppsett og lansering i klubben." },
        ].map((item) => (
          <div key={item.title} className="text-center">
            <h3 className="font-display text-lg font-semibold text-ink">{item.title}</h3>
            <p className="mt-1 text-sm text-ink-mid">{item.desc}</p>
          </div>
        ))}
      </div>

      <p className="mt-8 text-center text-xs text-ink-light">
        Har du spørsmål? <Link href="/kontakt" className="text-forest hover:underline">Ta kontakt</Link> — vi svarer innen 24 timer.
      </p>
    </div>
  );
}
