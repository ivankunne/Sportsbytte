import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "For idrettslag — Sportsbyttet",
  description:
    "Sportsbyttet gir hvert idrettslag en merkevarekledd markedsplass der medlemmene kan kjøpe og selge brukt sportsutstyr — trygt, enkelt og helt gratis for klubben.",
};

export default function ForKlubberPage() {
  return (
    <div className="overflow-x-hidden">
      {/* ─── 1. HERO ─────────────────────────────────────────────── */}
      <section className="relative bg-forest text-white">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 pt-20 pb-28 sm:pt-28 sm:pb-36 text-center">
          <span className="inline-block rounded-full border border-white/30 bg-white/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-white/90">
            For idrettslag
          </span>
          <h1 className="mt-6 font-display text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight">
            Gi klubbens medlemmer sin&nbsp;egen bruktmarkedsplass
          </h1>
          <p className="mt-6 text-lg sm:text-xl text-white/75 max-w-2xl mx-auto leading-relaxed">
            Sportsbyttet gir hvert idrettslag en merkevarekledd side der
            medlemmene kan kjøpe og selge brukt sportsutstyr — trygt, enkelt
            og helt gratis for klubben.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/registrer-klubb"
              className="rounded-lg bg-amber px-8 py-3.5 text-sm font-semibold text-white hover:brightness-110 transition-all duration-[120ms] shadow-lg shadow-amber/30"
            >
              Registrer klubben gratis →
            </Link>
            <Link
              href="/klubber"
              className="rounded-lg border border-white/30 bg-white/10 px-8 py-3.5 text-sm font-semibold text-white hover:bg-white/20 transition-colors duration-[120ms]"
            >
              Se eksempel →
            </Link>
          </div>
        </div>

        {/* Wave at the bottom */}
        <div className="absolute bottom-0 left-0 right-0 overflow-hidden leading-none">
          <svg
            viewBox="0 0 1440 56"
            xmlns="http://www.w3.org/2000/svg"
            className="w-full block"
            preserveAspectRatio="none"
          >
            <path
              d="M0,32 C240,56 480,8 720,32 C960,56 1200,8 1440,32 L1440,56 L0,56 Z"
              fill="white"
              fillOpacity="0.06"
            />
            <path
              d="M0,44 C360,20 720,56 1080,44 C1260,38 1380,48 1440,50 L1440,56 L0,56 Z"
              fill="white"
              fillOpacity="0.04"
            />
          </svg>
        </div>
      </section>

      {/* ─── 2. TRUST BAR ────────────────────────────────────────── */}
      <section className="bg-forest-mid">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-0 text-white text-sm font-medium">
            <span className="px-6 text-center">Gratis å registrere</span>
            <span className="hidden sm:block h-4 w-px bg-white/30" />
            <span className="px-6 text-center">Ingen bindingstid</span>
            <span className="hidden sm:block h-4 w-px bg-white/30" />
            <span className="px-6 text-center">Satt opp på 5 minutter</span>
          </div>
        </div>
      </section>

      {/* ─── 3. PROBLEM → SOLUTION ───────────────────────────────── */}
      <section className="bg-white py-20 sm:py-28">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Problem */}
            <div className="bg-cream rounded-2xl p-8 sm:p-10">
              <h2 className="font-display text-2xl font-bold text-ink mb-6">
                Slik er det i dag
              </h2>
              <ul className="space-y-4">
                {[
                  "Brukt utstyr samler støv i kjelleren",
                  "Byttemarked på parkeringen én gang i året",
                  "Facebook-grupper uten struktur eller trygg betaling",
                  "Foreldre som ikke vet hvem de handler med",
                ].map((pain) => (
                  <li key={pain} className="flex items-start gap-3 text-ink-mid">
                    <span className="text-lg leading-tight mt-0.5 flex-shrink-0">
                      ❌
                    </span>
                    <span className="text-base leading-snug">{pain}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Solution */}
            <div className="bg-forest text-white rounded-2xl p-8 sm:p-10">
              <h2 className="font-display text-2xl font-bold mb-6">
                Slik er det med Sportsbyttet
              </h2>
              <ul className="space-y-4">
                {[
                  "Aktiv markedsplass tilgjengelig hele sesongen",
                  "Klubbens egne annonser — ikke druknet i generell feed",
                  "Trygg betaling med Vipps og Bring-frakt",
                  "Kjøper vet hvem selgeren er — samme klubb",
                ].map((sol) => (
                  <li key={sol} className="flex items-start gap-3 text-white/90">
                    <span className="text-amber font-bold text-lg leading-tight mt-0.5 flex-shrink-0">
                      ✓
                    </span>
                    <span className="text-base leading-snug">{sol}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ─── 4. BENEFITS GRID ────────────────────────────────────── */}
      <section className="bg-cream py-20 sm:py-28">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-ink">
              Alt klubben trenger,{" "}
              <span className="text-forest">ingenting den ikke trenger</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              {
                icon: (
                  <svg
                    className="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"
                    />
                  </svg>
                ),
                title: "Merkevare",
                desc: "Klubbsiden viser logoen din, fargene dine og navnet ditt. Gjenkjennelig for alle medlemmene.",
              },
              {
                icon: (
                  <svg
                    className="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z"
                    />
                  </svg>
                ),
                title: "Statistikk",
                desc: "Se hvem som selger mest, hvilke kategorier som er populære og total omsetning i klubben.",
              },
              {
                icon: (
                  <svg
                    className="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z"
                    />
                  </svg>
                ),
                title: "Inviter enkelt",
                desc: "Del én invitasjonslenke — så kan medlemmene opprette profil og legge ut annonser med én gang.",
              },
              {
                icon: (
                  <svg
                    className="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
                    />
                  </svg>
                ),
                title: "Kun for medlemmer",
                desc: "Velg om annonser skal være synlige bare for klubbmedlemmer eller åpne for alle.",
              },
              {
                icon: (
                  <svg
                    className="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M10.34 15.84c-.688-.06-1.386-.09-2.09-.09H7.5a4.5 4.5 0 110-9h.75c.704 0 1.402-.03 2.09-.09m0 9.18c.253.962.584 1.892.985 2.783.247.55.06 1.21-.463 1.511l-.657.38c-.551.318-1.26.117-1.527-.461a20.845 20.845 0 01-1.44-4.282m3.102.069a18.03 18.03 0 01-.59-4.59c0-1.586.205-3.124.59-4.59m0 9.18a23.848 23.848 0 018.835 2.535M10.34 6.66a23.847 23.847 0 008.835-2.535m0 0A23.74 23.74 0 0018.795 3m.38 1.125a23.91 23.91 0 011.014 5.395m-1.014 8.855c-.118.38-.245.754-.38 1.125m.38-1.125a23.91 23.91 0 001.014-5.395m0-3.46c.495.413.811 1.035.811 1.73 0 .695-.316 1.317-.811 1.73m0-3.46a24.347 24.347 0 010 3.46"
                    />
                  </svg>
                ),
                title: "Oppslag og beskjeder",
                desc: "Post nyheter, arrangementer og utstyrskampanjer direkte på klubbsiden.",
              },
              {
                icon: (
                  <svg
                    className="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941"
                    />
                  </svg>
                ),
                title: "Digitalt byttemarked",
                desc: "Sett opp et digitalt byttemarked med ett klikk — ingen gymsal, ingen frivillige som må stå vakt.",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="bg-white border border-border rounded-xl p-6"
              >
                <div className="text-forest mb-4">{item.icon}</div>
                <h3 className="font-display text-lg font-semibold text-ink">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm text-ink-mid leading-relaxed">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── 5. HOW IT WORKS ─────────────────────────────────────── */}
      <section className="bg-white py-20 sm:py-28">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-ink">
              Tre steg. Klar på fem minutter.
            </h2>
          </div>

          <div className="relative">
            {/* Dashed connector line on desktop */}
            <div
              className="hidden md:block absolute top-8 left-[calc(16.666%+1.25rem)] right-[calc(16.666%+1.25rem)] h-px border-t-2 border-dashed border-forest/30"
              aria-hidden="true"
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-6">
              {[
                {
                  step: "1",
                  title: "Registrer klubben",
                  desc: "Fyll inn klubbnavn, velg farger og last opp logo. Tar 2 minutter — og det er det.",
                },
                {
                  step: "2",
                  title: "Del invitasjonslenken",
                  desc: "Send én lenke til medlemmene på e-post, WhatsApp eller i klubb-appen. Ingen CSV, ingen manuell import.",
                },
                {
                  step: "3",
                  title: "Medlemmene handler",
                  desc: "De legger ut utstyr, kjøper trygt med Vipps, og du får statistikk på alt som skjer.",
                },
              ].map((item, idx) => (
                <div key={item.step} className="text-center relative">
                  <div className="flex justify-center mb-5">
                    <span className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-forest text-white font-bold font-display text-2xl shadow-lg shadow-forest/25 z-10 relative">
                      {item.step}
                    </span>
                  </div>
                  <h3 className="font-display text-xl font-semibold text-ink">
                    {item.title}
                  </h3>
                  <p className="mt-3 text-sm text-ink-mid leading-relaxed max-w-xs mx-auto">
                    {item.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-14 text-center">
            <Link
              href="/registrer-klubb"
              className="rounded-lg bg-amber px-8 py-3.5 text-sm font-semibold text-white hover:brightness-110 transition-all duration-[120ms] shadow-md shadow-amber/25"
            >
              Registrer klubben gratis →
            </Link>
          </div>
        </div>
      </section>

      {/* ─── 6. ROI SECTION ──────────────────────────────────────── */}
      <section className="bg-cream py-20 sm:py-28">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-ink">
              Hva er det verdt for klubben din?
            </h2>
            <p className="mt-3 text-ink-mid max-w-xl mx-auto">
              Regnestykket for en typisk klubb med 150 medlemmer:
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-border p-8 sm:p-10 max-w-2xl mx-auto">
            <div className="grid grid-cols-2 gap-y-8 gap-x-6 sm:grid-cols-4 text-center">
              <div>
                <p className="font-display text-4xl font-bold text-forest">45</p>
                <p className="mt-1 text-xs text-ink-mid leading-tight">
                  aktive selgere
                  <br />
                  <span className="text-ink-light">(30% av 150)</span>
                </p>
              </div>
              <div>
                <p className="font-display text-4xl font-bold text-forest">135</p>
                <p className="mt-1 text-xs text-ink-mid leading-tight">
                  annonser
                  <br />
                  <span className="text-ink-light">(3 per selger)</span>
                </p>
              </div>
              <div>
                <p className="font-display text-4xl font-bold text-forest">800</p>
                <p className="mt-1 text-xs text-ink-mid leading-tight">
                  kr snittpris
                  <br />
                  <span className="text-ink-light">per vare</span>
                </p>
              </div>
              <div>
                <p className="font-display text-4xl font-bold text-amber">108&nbsp;000</p>
                <p className="mt-1 text-xs text-ink-mid leading-tight">
                  kr byttehandel
                  <br />
                  <span className="text-ink-light">= totalt</span>
                </p>
              </div>
            </div>

            <div className="mt-8 border-t border-border pt-6 text-center">
              <p className="font-display text-lg font-semibold text-ink">
                Alt dette — gratis for klubben.
              </p>
              <p className="mt-1 text-sm text-ink-mid">
                Vi tar kun en liten plattformavgift per gjennomført salg.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── 7. TESTIMONIALS ─────────────────────────────────────── */}
      <section className="bg-white py-20 sm:py-28">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="font-display text-3xl font-bold text-ink">
              Hva sier klubbene?
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              {
                quote:
                  "Vi hadde byttemarked på parkeringsplassen én gang i året. Nå er det digitalt og tilgjengelig hele sesongen. Medlemmene elsker det.",
                name: "Tone Andersen",
                role: "Leder i Fredrikstad Skiklubb",
                initial: "T",
              },
              {
                quote:
                  "Enkelt for foreldrene å selge unna utstyr barna har vokst ut av. Alle penger går rett til familien — ikke til videreselgere.",
                name: "Kjetil Haugen",
                role: "Sportssjef i Drammen FK Bredde",
                initial: "K",
              },
            ].map((t) => (
              <figure
                key={t.name}
                className="bg-cream rounded-2xl p-8 flex flex-col"
              >
                <blockquote className="flex-1">
                  <p className="text-ink leading-relaxed text-base">
                    &ldquo;{t.quote}&rdquo;
                  </p>
                </blockquote>
                <figcaption className="mt-6 flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-forest flex items-center justify-center text-white font-bold font-display flex-shrink-0">
                    {t.initial}
                  </div>
                  <div>
                    <p className="font-semibold text-ink text-sm">{t.name}</p>
                    <p className="text-xs text-ink-light">{t.role}</p>
                  </div>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* ─── 8. PRICING ──────────────────────────────────────────── */}
      <section className="bg-forest py-20 sm:py-28">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-white">
              Enkel prising. Ingen overraskelser.
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* For klubben */}
            <div className="border border-white/20 rounded-2xl p-8 bg-white/5">
              <h3 className="font-display text-xl font-semibold text-white">
                For klubben
              </h3>
              <div className="mt-4 flex items-baseline gap-2">
                <span className="font-display text-5xl font-bold text-white">
                  Gratis
                </span>
              </div>
              <p className="mt-1 text-sm text-white/60">Alltid</p>

              <ul className="mt-8 space-y-3">
                {[
                  "Klubbside med merkevare",
                  "Ubegrenset antall annonser",
                  "Statistikk og innsikt",
                  "Invitasjonslenke til medlemmer",
                  "Digitalt byttemarked",
                ].map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-sm text-white/80">
                    <svg
                      className="h-5 w-5 text-amber flex-shrink-0 mt-0.5"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"
                        clipRule="evenodd"
                      />
                    </svg>
                    {f}
                  </li>
                ))}
              </ul>

              <Link
                href="/registrer-klubb"
                className="mt-8 block w-full rounded-lg bg-amber py-3 text-center text-sm font-semibold text-white hover:brightness-110 transition-all duration-[120ms]"
              >
                Registrer gratis
              </Link>
            </div>

            {/* Per transaksjon */}
            <div className="border border-white/20 rounded-2xl p-8 bg-white/5">
              <h3 className="font-display text-xl font-semibold text-white">
                Per transaksjon
              </h3>
              <div className="mt-4 flex items-baseline gap-2">
                <span className="font-display text-5xl font-bold text-white">
                  Lav&nbsp;%
                </span>
              </div>
              <p className="mt-1 text-sm text-white/60">Kun når noe selges</p>

              <p className="mt-8 text-sm text-white/70 leading-relaxed">
                Selger beholder nesten alt. Vi tar kun en liten plattformavgift
                per gjennomført salg for å dekke Vipps og Bring-integrasjon.
              </p>

              <div className="mt-6 inline-block rounded-full border border-amber/50 bg-amber/10 px-4 py-1.5 text-xs font-semibold text-amber">
                Eksakt sats kunngjøres ved lansering
              </div>

              <div className="mt-8 rounded-xl bg-white/10 p-5">
                <p className="text-sm text-white/70 leading-relaxed">
                  Avgiften dekker sikker Vipps-betaling, Bring-fraktlabel og
                  kjøperbeskyttelse. Ingen skjulte kostnader for klubben.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── 9. FAQ ──────────────────────────────────────────────── */}
      <section className="bg-white py-20 sm:py-28">
        <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8">
          <h2 className="font-display text-3xl font-bold text-ink text-center mb-12">
            Vanlige spørsmål
          </h2>

          <div className="divide-y divide-border">
            {[
              {
                q: "Koster det noe for klubben?",
                a: "Nei. Det er gratis å opprette og drive en klubbside på Sportsbyttet. Vi tar kun en liten plattformavgift per gjennomført transaksjon — den betales av kjøper eller deles med selger.",
              },
              {
                q: "Hvem kan registrere klubben?",
                a: "Alle med en offisiell rolle i klubben — lagleder, sportssjef, styremedlem eller daglig leder. Du bekrefter rollen ved registrering.",
              },
              {
                q: "Kan vi ha private annonser?",
                a: "Ja. Du kan velge at annonser kun er synlige for godkjente klubbmedlemmer.",
              },
              {
                q: "Hva med betaling og frakt?",
                a: "Betaling skjer via Vipps — trygt og kjent for alle nordmenn. Frakt ordnes med Bring, der fraktlabel genereres automatisk.",
              },
              {
                q: "Kan vi kjøre digitalt byttemarked?",
                a: "Absolutt. Fra admin-panelet kan du sette opp et tidsbegrenset digitalt byttemarked der alle annonser samles på én side.",
              },
            ].map((faq) => (
              <div key={faq.q} className="py-6">
                <h3 className="font-semibold text-ink text-base">{faq.q}</h3>
                <p className="mt-2 text-sm text-ink-mid leading-relaxed">
                  {faq.a}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── 10. FINAL CTA ───────────────────────────────────────── */}
      <section className="bg-amber py-20 sm:py-28">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-white leading-tight">
            Klar til å gi klubben en digital markedsplass?
          </h2>
          <p className="mt-4 text-white/80 text-lg">
            Det tar 5 minutter. Gratis. Ingen binding.
          </p>
          <div className="mt-10">
            <Link
              href="/registrer-klubb"
              className="inline-block rounded-lg bg-white px-10 py-4 text-base font-semibold text-forest hover:bg-cream transition-colors duration-[120ms] shadow-xl shadow-black/10"
            >
              Registrer klubben nå →
            </Link>
          </div>
          <p className="mt-6 text-sm text-white/60">
            Spørsmål? Ta kontakt på{" "}
            <a
              href="mailto:hei@sportsbyttet.no"
              className="text-white/80 underline underline-offset-2 hover:text-white transition-colors duration-[120ms]"
            >
              hei@sportsbyttet.no
            </a>
          </p>
        </div>
      </section>
    </div>
  );
}
